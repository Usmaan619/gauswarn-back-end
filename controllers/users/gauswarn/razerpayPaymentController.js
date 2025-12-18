const Razorpay = require("razorpay");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const { withConnection } = require("../../../utils/helper");

/* =============================
   RAZORPAY INSTANCE
============================= */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_yxHWWlu9sVA1sQ",
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* =============================
   HELPERS
============================= */
const getCurrentTime = () => new Date().toTimeString().slice(0, 8);

const validateCartForShopmozo = (cart) => {
  return cart && Array.isArray(cart) && cart.length > 0;
};

const sendWhatsAppNotification = async (mobile, orderId, amount) => {
  try {
    const message = `Thank you for your order! Order ID: ${orderId}, Amount: ₹${amount}. Your Gauswarn Ghee order has been confirmed.`;
    const whatsappApiUrl = `https://bhashsms.com/api/sendmsg.php?user=RAJLAKSHMIBWA&pass=123456&sender=BUZWAP&phone=${mobile}&text=${encodeURIComponent(
      message
    )}&priority=wa&stype=normal`;

    const response = await axios.get(whatsappApiUrl, { timeout: 5000 });
    if (response.status !== 200) {
      throw new Error(`WhatsApp API failed: ${response.data}`);
    }
    return response.data;
  } catch (error) {
    console.error("WhatsApp notification failed:", error.message);
    // Don't throw - don't fail payment for WhatsApp issues
  }
};

/* =============================
   SHOPMOZO ORDER (IMPROVED)
============================= */
const generateShopmozoOrder = async (userData, cart, date) => {
  if (!validateCartForShopmozo(cart)) {
    console.warn("ℹ️ Cart is empty – Skipping Shopmozo integration");
    return `ORD_${uuidv4().slice(0, 8)}_${Date.now()}`; // Return local order ID
  }

  const payload = {
    order_id: `ORD_${uuidv4().slice(0, 8)}_${Date.now()}`,
    order_date: date,
    order_type: "ESSENTIALS",

    consignee_name: userData.user_name,
    consignee_phone: Number(userData.user_mobile_num),
    // consignee_alternate_phone: Number(userData.user_mobile_num),
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
    console.log("📦 Creating Shopmozo order...");
    const response = await axios.post(
      "https://shipping-api.com/app/api/v1/push-order",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "private-key":
          process.env.SHOPMOZO_PRIVATE_KEY || "G0K1PQYBq3Xlph6y48gw",
          "public-key":
          process.env.SHOPMOZO_PUBLIC_KEY || "LBYfQgGFRljv1A249H87",
        },
        timeout: 10000,
      }
    );
    console.log('response:--------------------------------------------- ', response);

    if (response.data?.result === "1") {
      console.log("✅ Shopmozo order created:", response.data.data.order_id);
      return response.data.data.order_id;
    } else {
      console.warn("⚠️ Shopmozo rejected:", response.data?.message);
      return payload.order_id; // Fallback to local order ID
    }
  } catch (err) {
    console.error("===== SHOPMOZO ERROR =====");
    console.error("Status:", err.response?.status);
    console.error("Data:", err.response?.data);
    console.error("=========================");
    return payload.order_id; // Fallback to local order ID
  }
};

/* =============================
   SAVE PAYMENT (DB) - ENHANCED
============================= */
const savePaymentDetails = async (userData, shopmozoOrderId, cart = []) => {
  const date = moment().format("YYYY-MM-DD");
  const time = getCurrentTime();

  const query = `
    INSERT INTO gauswarn_payment
    (
      user_name, user_mobile_num, user_email, user_state, user_city,
      user_country, user_house_number, user_landmark, user_pincode,
      user_total_amount, purchase_price, product_quantity,
      date, time, shopmozo_order_id, status, isPaymentPaid, cart_data
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', false, ?)
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
      shopmozoOrderId,
      JSON.stringify(cart), // Store full cart data
    ])
  );

  return result.insertId;
};

/* =============================
   VALIDATE INPUT
============================= */
const validatePaymentInput = (userData) => {
  const requiredFields = [
    "user_name",
    "user_mobile_num",
    "user_email",
    "user_state",
    "user_city",
    "user_country",
    "user_house_number",
    "user_landmark",
    "user_pincode",
    "user_total_amount",
    "purchase_price",
    "product_quantity",
  ];

  for (const field of requiredFields) {
    if (!userData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const amount = Number(userData.user_total_amount);
  if (amount <= 0 || amount > 100000) {
    throw new Error("Invalid amount (must be between ₹1 - ₹100000)");
  }

  if (!/^\d{10}$/.test(userData.user_mobile_num)) {
    throw new Error("Invalid mobile number format");
  }

  return true;
};

/* =============================
   CREATE PAYMENT (MAIN)
============================= */
const createPaymentAndGenerateUrlRazor = async (req, res) => {
  try {
    const userData = req.body;

    // ✅ Input validation
    validatePaymentInput(userData);

    const amountInPaise = Number(userData.user_total_amount) * 100;
    const date = moment().format("YYYY-MM-DD");

    console.log(
      "🛒 Payment initiation for:",
      userData.user_name,
      "Amount: ₹",
      userData.user_total_amount
    );

    /* 1️⃣ SHOPMOZO (OPTIONAL) */
    const shopmozoOrderId = await generateShopmozoOrder(
      userData,
      userData.cart,
      date
    );

    /* 2️⃣ SAVE TO DB */
    const userId = await savePaymentDetails(
      userData,
      shopmozoOrderId,
      userData.cart || []
    );

    /* 3️⃣ RAZORPAY ORDER */
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: shopmozoOrderId,
      notes: {
        userId: userId.toString(),
        shopmozo_order_id: shopmozoOrderId,
        user_name: userData.user_name,
        user_email: userData.user_email,
        user_mobile_num: userData.user_mobile_num,
        cart: userData.cart || [],
      },
    });

    /* 4️⃣ JWT TOKEN */
    const token = jwt.sign(
      {
        userId,
        orderId: shopmozoOrderId,
        amount: amountInPaise,
        user_name: userData.user_name,
        user_email: userData.user_email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    console.log("✅ Payment order created:", razorpayOrder.id);

    res.json({
      success: true,
      message: "Payment initiated successfully",
      razorpay_order_id: razorpayOrder.id,
      razorpay_order: razorpayOrder,
      shopmozo_order_id: shopmozoOrderId,
      has_shopmozo: validateCartForShopmozo(userData.cart),
      token,
      timestamp: moment().format("MMMM Do YYYY, h:mm:ss a"),
    });
  } catch (err) {
    console.error("❌ PAYMENT INIT ERROR:", err.message);
    res.status(400).json({
      success: false,
      message: err.message || "Payment initiation failed",
    });
  }
};

/* =============================
   VERIFY PAYMENT (WEBHOOK)
============================= */
const getRazorpayStatusAndUpdatePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body?.rzpResponse || {};
    const notes = req.body?.notes || {};

    console.log("🔍 Verifying payment:", razorpay_payment_id);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay params",
      });
    }

    // ✅ Signature verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Invalid signature");
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // ✅ Fetch payment details
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const isPaid = payment.status === "captured";

    // ✅ Update database
    await withConnection((conn) =>
      conn.execute(
        `UPDATE gauswarn_payment
         SET status=?, paymentDetails=?, isPaymentPaid=?, razorpay_payment_id=?
         WHERE user_id=?`,
        [
          payment.status,
          JSON.stringify(payment),
          isPaid,
          razorpay_payment_id,
          notes.userId,
        ]
      )
    );

    // ✅ WhatsApp notification for success
    if (isPaid && notes.user_mobile_num) {
      sendWhatsAppNotification(
        notes.user_mobile_num,
        notes.shopmozo_order_id,
        payment.amount / 100
      );
    }

    console.log("✅ Payment verification:", payment.status);

    res.json({
      success: isPaid,
      message: isPaid ? "Payment successful" : "Payment authorized",
      payment_status: payment.status,
    });
  } catch (err) {
    console.error("❌ VERIFY ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};

/* =============================
   CHECK PAYMENT STATUS
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
    console.error("Payment status check failed:", err.message);
    res.status(404).json({
      success: false,
      message: "Payment not found",
    });
  }
};

/* =============================
   EXPORTS
============================= */
module.exports = {
  createPaymentAndGenerateUrlRazor,
  getRazorpayStatusAndUpdatePayment,
  checkRazorpayPaymentStatus,
};

// const Razorpay = require("razorpay");

// const { default: axios } = require("axios");
// const db = require("../../../config/dbConnection");
// const { v4: uuidv4 } = require("uuid");
// const crypto = require("crypto");
// const {
//   generateChecksumForPhonePe,
//   generateMergedKey,
// } = require("../../../utils/payment.service");
// const moment = require("moment");

// const jwt = require("jsonwebtoken");

// const { withConnection } = require("../../../utils/helper");

// // Initialize Razorpay instance
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_yxHWWlu9sVA1sQ",
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// const createPaymentAndGenerateUrlRazor = async (req, res) => {
//   const {
//     user_name,
//     user_mobile_num,
//     user_email,
//     user_state,
//     user_city,
//     user_country,
//     user_house_number,
//     user_landmark,
//     user_pincode,
//     user_total_amount,
//     purchase_price,
//     product_quantity,
//     cart,
//   } = req.body;

//   // Validate the payload
//   if (
//     !user_name ||
//     !user_mobile_num ||
//     !user_email ||
//     !user_state ||
//     !user_city ||
//     !user_country ||
//     !user_house_number ||
//     !user_landmark ||
//     !user_pincode ||
//     !user_total_amount ||
//     !purchase_price ||
//     !product_quantity
//   ) {
//     return res.json({ success: false, message: "All fields are required." });
//   }

//   const date = moment().format("YYYY-MM-DD");
//   const time = getCurrentTime();

//   // Convert user_total_amount to paise for Razorpay (same as PhonePe)
//   const amountIn = user_total_amount * 100;

//   // Insert user details into the database
//   const userQuery = `INSERT INTO gauswarn_payment (user_name, user_mobile_num, user_email, user_state, user_city, user_country, user_house_number, user_landmark, user_pincode, user_total_amount, purchase_price, product_quantity, date, time)
//                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

//   try {
//     const [result] = await withConnection(async (connection) => {
//       return connection.execute(userQuery, [
//         user_name,
//         user_mobile_num,
//         user_email,
//         user_state,
//         user_city,
//         user_country,
//         user_house_number,
//         user_landmark,
//         user_pincode,
//         user_total_amount,
//         purchase_price,
//         product_quantity,
//         date,
//         time,
//       ]);
//     });

//     // Get the inserted user ID
//     const userId = result.insertId;

//     const getOrderIdByShopmozy = await generateShopmozyAPI(
//       user_name,
//       user_mobile_num,
//       user_email,
//       user_state,
//       user_city,
//       user_house_number,
//       user_landmark,
//       user_pincode,
//       cart,
//       date
//     );

//     // Create a unique order ID
//     const orderId = getOrderIdByShopmozy;

//     const mergedKey = await generateMergedKey(
//       user_name,
//       user_mobile_num,
//       orderId
//     );

//     // Create a JWT for secure data exchange
//     const token = jwt.sign(
//       {
//         userId,
//         user_name,
//         user_email,
//         orderId,
//         amountIn,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "6m" }
//     );

//     // Create Razorpay order
//     const razorpayOrder = await razorpay.orders.create({
//       amount: amountIn, // Amount in
//       currency: "INR",
//       receipt: orderId,
//       notes: {
//         user_name,
//         user_email,
//         user_mobile_num,
//         userId: userId.toString(),
//         shopmozy_order_id: getOrderIdByShopmozy,
//       },
//     });

//     console.log("razorpayOrder: ", razorpayOrder);

//     // Respond with the created payment record and Razorpay URL
//     res.json({
//       success: true,
//       message: "OK",
//       razorpay_order_id: razorpayOrder.id,
//       razorpayOrder,
//       token,
//       mergedKey,
//       date: moment().format("MMMM Do YYYY, h:mm:ss a"),
//     });
//   } catch (error) {
//     console.error("Razorpay order creation error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to create payment or generate URL",
//       error: error.message,
//     });
//   }
// };

// const getRazorpayStatusAndUpdatePayment = async (req, res) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//     req.body?.rzpResponse;

//   console.log("req.body: ", req.body);

//   const userId = req?.body?.notes?.userId;
//   const mobNo = req?.body?.notes?.user_mobile_num;
//   const amount = req?.body?.amount;
//   const orderId = req?.body?.receipt;

//   try {
//     // Verify the payment signature
//     const body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body.toString())
//       .digest("hex");

//     const isAuthentic = expectedSignature === razorpay_signature;

//     console.log("isAuthentic: ", isAuthentic);
//     if (isAuthentic) {
//       // Fetch payment details from Razorpay
//       const payment = await razorpay.payments.fetch(razorpay_payment_id);
//       console.log("payment:===============response ", payment);

//       // Update payment status in the database
//       const query = `UPDATE gauswarn_payment SET status = ?, paymentDetails = ?, isPaymentPaid = ?  WHERE user_id = ?`;

//       const [result] = await withConnection(async (connection) => {
//         return connection.execute(query, [
//           payment.status,
//           JSON.stringify(payment),
//           payment.status === "captured",
//           userId,
//         ]);
//       });

//       if (result.affectedRows === 0) {
//         return res.json({
//           success: false,
//           message: "Payment record not found.",
//         });
//       }

//       // Send WhatsApp message on successful payment
//       const isPaymentCaptured = payment.status === "captured";

//       if (isPaymentCaptured)
//         await sendWhatsAppMessage(mobNo, orderId, amount / 100); // Convert back to rupees

//       return res.json({
//         success: isPaymentCaptured,
//         message: isPaymentCaptured ? "Payment successful." : "Payment failed.",
//       });
//     } else {
//       // Invalid signature
//       const query = `UPDATE gauswarn_payment SET status = ?, paymentDetails = ?, isPaymentPaid = ? WHERE user_id = ?`;

//       await withConnection(async (connection) => {
//         return connection.execute(query, [
//           "failed",
//           JSON.stringify({ error: "Invalid signature" }),
//           false,
//           tarnId,
//         ]);
//       });

//       return res.redirect(process.env.REDIRECT_URL_TO_FAILURE_PAGE);
//     }
//   } catch (error) {
//     console.error("Error processing Razorpay payment:", error);
//     return res.status(500).json({ success: false, error: error.message });
//   }
// };

// const getCurrentTime = () => {
//   const now = new Date();
//   const hours = now.getHours();
//   const minutes = now.getMinutes();
//   const seconds = now.getSeconds();

//   const hoursStr = String(hours).padStart(2, "0");
//   const minutesStr = String(minutes).padStart(2, "0");
//   const secondsStr = String(seconds).padStart(2, "0");

//   return `${hoursStr}:${minutesStr}:${secondsStr}`;
// };

// // Alternative method to check payment status by payment ID
// const checkRazorpayPaymentStatus = async (req, res) => {
//   const { payment_id } = req.params;

//   try {
//     const payment = await razorpay.payments.fetch(payment_id);

//     res.json({
//       success: true,
//       payment_status: payment.status,
//       payment_details: payment,
//     });
//   } catch (error) {
//     console.error("Error fetching payment status:", error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

// async function sendWhatsAppMessage(user_mobile_num, ordeId, user_total_amount) {
//   const whatsappApiUrl = `https://bhashsms.com/api/sendmsg.php?user=RAJLAKSHMIBWA&pass=123456&sender=BUZWAP&phone=${user_mobile_num}&text=gauswarn_ghee002&priority=wa&stype=normal&Params=${ordeId},${user_total_amount}&htype=image&url=https://i.ibb.co/p6P86j3J/Whats-App-Image-2025-02-17-at-12-46-41.jpg`;

//   try {
//     const response = await axios.get(whatsappApiUrl);

//     if (!response.status === 200) {
//       throw new Error(`API error: ${response.data.message}`);
//     }

//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// }

// async function generateShopmozyAPI(
//   user_name,
//   user_mobile_num,
//   user_email,
//   user_state,
//   user_city,
//   user_house_number,
//   user_landmark,
//   user_pincode,
//   cart,
//   date
// ) {
//   try {
//     const ShippingPayLoad = {
//       order_id: "ordID",
//       order_date: date,
//       order_type: "ESSENTIALS",
//       consignee_name: user_name,
//       consignee_phone: Number(user_mobile_num),
//       consignee_alternate_phone: Number(user_mobile_num),
//       consignee_email: user_email,
//       consignee_address_line_one: user_house_number,
//       consignee_address_line_two: user_landmark,
//       consignee_pin_code: user_pincode,
//       consignee_city: user_city,
//       consignee_state: user_state,
//       product_detail: cart?.map((i) => {
//         return {
//           name: i?.product_name || "Ghee",
//           sku_number: "22",
//           quantity: i?.product_quantity,
//           discount: "",
//           hsn: "#123",
//           unit_price: i?.product_price,
//           product_category: "Ghee",
//         };
//       }),

//       payment_type: "PREPAID",
//       cod_amount: "",
//       shipping_charges: "",
//       weight: 200,
//       length: 10,
//       width: 20,
//       height: 15,
//       warehouse_id: "43190",
//       gst_ewaybill_number: "",
//       gstin_number: "",
//     };

//     const apiResponse = await axios.post(
//       `https://shipping-api.com/app/api/v1/push-order`,
//       ShippingPayLoad,
//       {
//         headers: {
//           "Content-Type": "application/json",
//           "private-key": "G0K1PQYBq3Xlph6y48gw",
//           "public-key": "LBYfQgGFRljv1A249H87",
//         },
//       }
//     );
//     return apiResponse?.data?.data?.order_id;
//   } catch (error) {
//     console.log("error: ", error);
//   }
// }

// module.exports = {
//   createPaymentAndGenerateUrlRazor,
//   getRazorpayStatusAndUpdatePayment,
//   checkRazorpayPaymentStatus,
// };
