const Razorpay = require("razorpay");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const { withConnection } = require("../../../utils/helper");
const couponModel = require("../../../model/coupons/couponModel");

/* =============================
   RAZORPAY INSTANCE
============================= */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* =============================
   HELPERS
============================= */
const getCurrentTime = () => new Date().toTimeString().slice(0, 8);

const validateCartForShopmozo = (cart) =>
  cart && Array.isArray(cart) && cart.length > 0;

const sendWhatsAppNotification = async (mobile, orderId, amount) => {
  try {
    const message = `Thank you for your order! Order ID: ${orderId}, Amount: ₹${amount}. Your Gauswarn Ghee order has been confirmed.`;
    const url = `https://bhashsms.com/api/sendmsg.php?user=RAJLAKSHMIBWA&pass=123456&sender=BUZWAP&phone=${mobile}&text=${encodeURIComponent(message)}&priority=wa&stype=normal`;
    await axios.get(url, { timeout: 5000 });
  } catch (_) {
    // Never fail a payment due to WhatsApp errors
  }
};

/* =============================
   SHOPMOZO — PUSH ORDER
============================= */
const generateShopmozoOrder = async (userData, cart, date) => {
  const fallbackId = `ORD_${uuidv4().slice(0, 8)}_${Date.now()}`;

  if (!validateCartForShopmozo(cart)) {
    return fallbackId;
  }

  const payload = {
    order_id: fallbackId,
    order_date: date,
    order_type: "ESSENTIALS",
    consignee_name: userData.user_name,
    consignee_phone: Number(userData.user_mobile_num),
    consignee_email: userData.user_email,
    consignee_address_line_one: userData.user_house_number,
    consignee_address_line_two: userData.user_landmark,
    consignee_pin_code: Number(userData.user_pincode),
    consignee_city: userData.user_city,
    consignee_state: userData.user_state,
    product_detail: cart.map((item) => ({
      name: item.product_name || item.name || "Ghee",
      sku_number: item.sku || item.product_id || "SKU001",
      quantity: Number(item.product_quantity),
      discount: item.discount || "",
      hsn: item.hsn || "17021190",
      unit_price: Number(item.product_price),
      product_category: item.category || "Ghee",
    })),
    payment_type: "PREPAID",
    cod_amount: "",
    shipping_charges: "",
    weight: 200,
    length: 10,
    width: 20,
    height: 15,
    warehouse_id: process.env.SHOPMOZO_WAREHOUSE_ID || "43190",
    gst_ewaybill_number: "",
    gstin_number: "",
  };

  try {
    const response = await axios.post(
      "https://shipping-api.com/app/api/v1/push-order",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "private-key": process.env.SHOPMOZO_PRIVATE_KEY,
          "public-key": process.env.SHOPMOZO_PUBLIC_KEY,
        },
        timeout: 10000,
      }
    );

    if (response.data?.result === "1") {
      console.log("📦 Shopmozo order pushed:", response.data.data.order_id);
      return response.data.data.order_id;
    }
    console.warn("⚠️ Shopmozo rejected:", response.data?.message);
    return fallbackId;
  } catch (err) {
    console.warn("⚠️ Shopmozo API error:", err.message);
    return fallbackId;
  }
};

/* =============================
   SAVE PAYMENT RECORD TO DB
============================= */
const savePaymentDetails = async (userData, tempOrderId, cart = []) => {
  const date = moment().format("YYYY-MM-DD");
  const time = getCurrentTime();

  const query = `
    INSERT INTO gauswarn_payment
    (
      user_name, user_mobile_num, user_email, user_state, user_city,
      user_country, user_house_number, user_landmark, user_pincode,
      user_total_amount, purchase_price, product_quantity,
      date, time, shopmozo_order_id, status, isPaymentPaid, cart_data,
      coupon_code, discount_amount, final_payable_amount
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?, ?)
  `;

  const [result] = await withConnection((conn) =>
    conn.execute(query, [
      userData.user_name,
      userData.user_mobile_num,
      userData.user_email,
      userData.user_state,
      userData.user_city,
      userData.user_country,
      userData.user_house_number,
      userData.user_landmark,
      userData.user_pincode,
      userData.user_total_amount,
      userData.purchase_price,
      userData.product_quantity,
      date,
      time,
      tempOrderId,
      JSON.stringify(cart),
      userData.coupon_code || null,
      userData.discount_amount || 0,
      userData.final_payable_amount || userData.user_total_amount,
    ])
  );

  return result.insertId;
};

/* =============================
   INPUT VALIDATION
============================= */
const validatePaymentInput = (userData) => {
  const required = [
    "user_name", "user_mobile_num", "user_email",
    "user_state", "user_city", "user_country",
    "user_house_number", "user_landmark", "user_pincode",
    "user_total_amount", "purchase_price", "product_quantity",
  ];

  for (const field of required) {
    if (!userData[field]) throw new Error(`Missing required field: ${field}`);
  }

  const amount = Number(userData.user_total_amount);
  if (amount <= 0 || amount > 100000)
    throw new Error("Invalid amount (must be between ₹1 - ₹100000)");

  if (!/^\d{10}$/.test(String(userData.user_mobile_num)))
    throw new Error("Invalid mobile number format");

  return true;
};

/* =============================
   CREATE PAYMENT ORDER
============================= */
const createPaymentAndGenerateUrlRazor = async (req, res) => {
  try {
    const userData = req.body;
    validatePaymentInput(userData);

    const chargeAmount = userData.final_payable_amount || userData.user_total_amount;
    const amountInPaise = Number(chargeAmount) * 100;

    console.log("🛒 Payment initiation for:", userData.user_name, "| Amount: ₹", chargeAmount);

    // 1. Save to DB with temp order ID
    const tempOrderId = `TEMP_${Date.now()}`;
    const userId = await savePaymentDetails(userData, tempOrderId, userData.cart || []);

    // 2. Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: tempOrderId,
      notes: {
        userId: userId.toString(),
        user_name: userData.user_name,
        user_email: userData.user_email,
        user_mobile_num: userData.user_mobile_num,
        cart: userData.cart || [],
        coupon_code: userData.coupon_code || null,
        discount_amount: userData.discount_amount || 0,
      },
    });

    // 3. Issue JWT (15-min window for payment)
    const token = jwt.sign(
      { userId, amount: amountInPaise, user_name: userData.user_name, user_email: userData.user_email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      success: true,
      message: "Payment initiated successfully",
      razorpay_order_id: razorpayOrder.id,
      razorpay_order: razorpayOrder,
      token,
      timestamp: moment().format("MMMM Do YYYY, h:mm:ss a"),
    });
  } catch (err) {
    console.error("❌ Payment init error:", err.message);
    res.status(400).json({ success: false, message: err.message || "Payment initiation failed" });
  }
};

/* =============================
   VERIFY PAYMENT (CLIENT CALLBACK)
   Called by frontend after Razorpay payment
============================= */
const getRazorpayStatusAndUpdatePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body?.rzpResponse || {};
    const notes = req.body?.notes || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing Razorpay params" });
    }

    // 1. Verify HMAC signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.warn("⚠️ Invalid Razorpay signature for payment:", razorpay_payment_id);
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // 2. Fetch payment from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const isPaid = payment.status === "captured";
    console.log("💳 Payment status:", payment.status, "| id:", razorpay_payment_id);

    let shopmozoOrderId = null;

    if (isPaid) {
      // 3. Get user's saved order from DB
      const [[userRow]] = await withConnection((conn) =>
        conn.execute("SELECT * FROM gauswarn_payment WHERE id=?", [notes.userId])
      );

      if (userRow) {
        let cart = [];
        try { cart = JSON.parse(userRow.cart_data || "[]"); } catch (_) {}
        shopmozoOrderId = await generateShopmozoOrder(userRow, cart, moment().format("YYYY-MM-DD"));
      } else {
        console.warn("⚠️ No payment record found for userId:", notes.userId);
      }

      // 4. Increment coupon usage
      if (notes.coupon_code) {
        try {
          const coupon = await couponModel.findCouponByCode(notes.coupon_code);
          if (coupon) await couponModel.incrementUsedCount(coupon.id);
        } catch (_) {}
      }

      // 5. WhatsApp notification (fire-and-forget)
      if (notes.user_mobile_num) {
        sendWhatsAppNotification(notes.user_mobile_num, shopmozoOrderId, payment.amount / 100);
      }
    }

    // 6. Update DB
    await withConnection((conn) =>
      conn.execute(
        `UPDATE gauswarn_payment
         SET status=?, paymentDetails=?, isPaymentPaid=?, razorpay_payment_id=?, shopmozo_order_id=?
         WHERE id=?`,
        [payment.status, JSON.stringify(payment), isPaid ? 1 : 0, razorpay_payment_id, shopmozoOrderId, notes.userId]
      )
    );

    console.log("✅ Payment verified & DB updated. userId:", notes.userId, "| status:", payment.status);

    res.json({
      success: isPaid,
      message: isPaid ? "Payment successful" : "Payment authorized but not captured",
      payment_status: payment.status,
      shopmozo_order_id: shopmozoOrderId,
    });
  } catch (err) {
    console.error("❌ Verify payment error:", err.message, "\n", err.stack);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

/* =============================
   RAZORPAY WEBHOOK HANDLER
   Server-side event from Razorpay (payment.captured, payment.failed)
============================= */
const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature
    if (webhookSecret) {
      const razorpaySignature = req.headers["x-razorpay-signature"];
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (razorpaySignature !== expectedSignature) {
        console.warn("⚠️ [WEBHOOK] Invalid signature — rejected");
        return res.status(400).json({ success: false, message: "Invalid webhook signature" });
      }
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload?.payment?.entity;

    console.log("📩 [WEBHOOK] Event:", event, "| payment_id:", paymentEntity?.id);

    if (event === "payment.captured" && paymentEntity) {
      const notes = paymentEntity.notes || {};
      const userId = notes.userId;
      let shopmozoOrderId = null;

      if (userId) {
        const [[userRow]] = await withConnection((conn) =>
          conn.execute("SELECT * FROM gauswarn_payment WHERE id=?", [userId])
        );

        if (userRow) {
          let cart = [];
          try { cart = JSON.parse(userRow.cart_data || "[]"); } catch (_) {}
          shopmozoOrderId = await generateShopmozoOrder(userRow, cart, moment().format("YYYY-MM-DD"));
        }

        await withConnection((conn) =>
          conn.execute(
            `UPDATE gauswarn_payment
             SET status=?, paymentDetails=?, isPaymentPaid=1, razorpay_payment_id=?, shopmozo_order_id=?
             WHERE id=?`,
            [paymentEntity.status, JSON.stringify(paymentEntity), paymentEntity.id, shopmozoOrderId, userId]
          )
        );

        if (notes.coupon_code) {
          try {
            const coupon = await couponModel.findCouponByCode(notes.coupon_code);
            if (coupon) await couponModel.incrementUsedCount(coupon.id);
          } catch (_) {}
        }

        if (notes.user_mobile_num) {
          sendWhatsAppNotification(notes.user_mobile_num, shopmozoOrderId, paymentEntity.amount / 100);
        }
      }
    }

    if (event === "payment.failed" && paymentEntity) {
      const userId = paymentEntity.notes?.userId;
      if (userId) {
        await withConnection((conn) =>
          conn.execute(
            "UPDATE gauswarn_payment SET status='failed', isPaymentPaid=0, razorpay_payment_id=? WHERE id=?",
            [paymentEntity.id, userId]
          )
        );
      }
    }

    // Always 200 — Razorpay retries on non-200
    res.status(200).json({ success: true, received: true });
  } catch (err) {
    console.error("❌ [WEBHOOK] Error:", err.message);
    res.status(200).json({ success: false, message: "Webhook processing error" });
  }
};

/* =============================
   CHECK PAYMENT STATUS BY ID
============================= */
const checkRazorpayPaymentStatus = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const payment = await razorpay.payments.fetch(payment_id);
    res.json({
      success: true,
      payment_status: payment.status,
      amount: payment.amount / 100,
      order_id: payment.order_id,
      captured: payment.captured,
    });
  } catch (err) {
    res.status(404).json({ success: false, message: "Payment not found" });
  }
};

/* =============================
   EXPORTS
============================= */
module.exports = {
  createPaymentAndGenerateUrlRazor,
  getRazorpayStatusAndUpdatePayment,
  handleRazorpayWebhook,
  checkRazorpayPaymentStatus,
};
