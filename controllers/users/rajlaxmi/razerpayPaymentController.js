const Razorpay = require("razorpay");

const { default: axios } = require("axios");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const {
  generateChecksumForPhonePe,
  generateMergedKey,
} = require("../../../utils/payment.service");
const moment = require("moment");

const jwt = require("jsonwebtoken");

const { withConnection } = require("../../../utils/helper");
const {
  findUserByUid,
} = require("../../../model/users/rajlaxmi/registerModel");

const registerModel = require("../../../model/users/rajlaxmi/registerModel");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_yxHWWlu9sVA1sQ",
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const orderModel = require("../../../model/users/rajlaxmi/insertOrderItem");
const createPaymentAndGenerateUrlRazor = async (req, res) => {
  try {
    const { payload } = req.body;
    const cart = payload || [];
    const addressData = req.body?.address || {};

    const {
      address: user_landmark,
      city: user_city,
      contactNo: user_mobile_num,
      country: user_country,
      email: user_email,
      fullName: user_name,
      houseNo: user_house_number,
      pincode: user_pincode,
      state: user_state,
    } = addressData;

    // Basic validation
    const requiredFields = [
      user_name,
      user_mobile_num,
      user_email,
      user_state,
      user_city,
      user_country,
      user_house_number,
      user_landmark,
      user_pincode,
    ];

    if (requiredFields.some((field) => !field)) {
      return res.status(400).json({
        success: false,
        message: "All address fields are required.",
      });
    }

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is required and cannot be empty.",
      });
    }
    // Dynamically calculate total amount
    const user_total_amount = cart.reduce((sum, item) => {
      const price = Number(item.product_price) || 0;
      const quantity = Number(item.product_quantity) || 1;
      return sum + price * quantity;
    }, 0);

    const purchase_price = 0;
    const product_quantity = cart.reduce((sum, item) => {
      return sum + (Number(item.product_quantity) || 0);
    }, 0);

    const total_purchase_amount = cart.reduce((sum, item) => {
      const purchase = Number(item.product_purchase) || 0;
      return sum + purchase;
    }, 0);

    const user = await registerModel.findUserByUid(payload?.[0]?.uid);
    const userId = user?.id;

    if (!userId) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const date = moment().format("YYYY-MM-DD");
    const time = getCurrentTime();
    const amountIn = user_total_amount * 100; // convert to paise

    // Insert address/payment into database
    const insertQuery = `
      INSERT INTO rajlaxmi_payment (
        user_name, user_mobile_num, user_email, user_state, user_city,
        user_country, user_house_number, user_landmark, user_pincode,
        user_total_amount, purchase_price, product_quantity, date, time, uid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await withConnection(async (conn) => {
      await conn.execute(insertQuery, [
        user_name,
        user_mobile_num,
        user_email,
        user_state,
        user_city,
        user_country,
        user_house_number,
        user_landmark,
        user_pincode,
        user_total_amount,
        total_purchase_amount,
        product_quantity,
        date,
        time,
        userId,
      ]);
    });

    // External API call
    const shopmozy_order_id = await generateShopmozyAPI(
      user_name,
      user_mobile_num,
      user_email,
      user_state,
      user_city,
      user_house_number,
      user_landmark,
      user_pincode,
      cart,
      date
    );

    const orderId = shopmozy_order_id;
    const mergedKey = await generateMergedKey(
      user_name,
      user_mobile_num,
      orderId
    );

    const token = jwt.sign(
      {
        userId,
        user_name,
        user_email,
        orderId,
        amountIn,
      },
      process.env.JWT_SECRET,
      { expiresIn: "6m" }
    );

    // Razorpay order creation
    const razorpayOrder = await razorpay.orders.create({
      amount: amountIn,
      currency: "INR",
      receipt: orderId,
      notes: {
        user_name,
        user_email,
        user_mobile_num,
        userId,
        shopmozy_order_id,
      },
    });

    // Insert each cart item into order model
    for (const item of cart) {
      const {
        product_id,
        product_name,
        product_price,
        product_weight,
        product_quantity,
      } = item;

      const product_total_amount =
        Number(product_price) * Number(product_quantity);

      await orderModel.insertOrderItem(
        orderId,
        userId,
        product_id,
        user_name,
        product_name,
        product_price,
        product_weight,
        product_quantity,
        product_total_amount
      );
    }

    return res.json({
      success: true,
      message: "Payment link generated successfully.",
      razorpay_order_id: razorpayOrder.id,
      razorpayOrder,
      token,
      mergedKey,
      date: moment().format("MMMM Do YYYY, h:mm:ss a"),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create payment or generate URL.",
      error: error.message,
    });
  }
};

const getRazorpayStatusAndUpdatePayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body?.rzpResponse;

  const mobNo = req?.body?.notes?.user_mobile_num;
  const amount = req?.body?.amount;
  const orderId = req?.body?.receipt;

  const user = await registerModel.findUserByid(req?.body?.notes?.userId);

  try {
    // Verify the payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Fetch payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpay_payment_id);

      // Update payment status in the database
      const query = `UPDATE rajlaxmi_payment SET status = ?, paymentDetails = ?, isPaymentPaid = ?  WHERE uid = ?`;

      const [result] = await withConnection(async (connection) => {
        return connection.execute(query, [
          payment.status,
          JSON.stringify(payment),
          payment.status === "captured",
          req?.body?.notes?.userId,
        ]);
      });

      await orderModel.updateOrderItemStatus(
        payment.status === "captured" ? "Paid" : "Fail",
        user?.uid
      );

      if (payment.status === "captured")
        await orderModel.deleteCartItems(user?.uid);

      if (result.affectedRows === 0) {
        return res.json({
          success: false,
          message: "Payment record not found.",
        });
      }

      // Send WhatsApp message on successful payment
      const isPaymentCaptured = payment.status === "captured";

      if (isPaymentCaptured)
        await sendWhatsAppMessage(mobNo, orderId, amount / 100); // Convert back to rupees

      return res.json({
        success: isPaymentCaptured,
        message: isPaymentCaptured ? "Payment successful." : "Payment failed.",
      });
    } else {
      // Invalid signature
      const query = `UPDATE rajlaxmi_payment SET status = ?, paymentDetails = ?, isPaymentPaid = ? WHERE user_id = ?`;

      await withConnection(async (connection) => {
        return connection.execute(query, [
          "failed",
          JSON.stringify({ error: "Invalid signature" }),
          false,
          tarnId,
        ]);
      });

      return res.redirect(process.env.REDIRECT_URL_TO_FAILURE_PAGE);
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hoursStr = String(hours).padStart(2, "0");
  const minutesStr = String(minutes).padStart(2, "0");
  const secondsStr = String(seconds).padStart(2, "0");

  return `${hoursStr}:${minutesStr}:${secondsStr}`;
};

// Alternative method to check payment status by payment ID
const checkRazorpayPaymentStatus = async (req, res) => {
  const { payment_id } = req.params;

  try {
    const payment = await razorpay.payments.fetch(payment_id);

    res.json({
      success: true,
      payment_status: payment.status,
      payment_details: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

async function sendWhatsAppMessage(user_mobile_num, ordeId, user_total_amount) {
  const whatsappApiUrl = `https://bhashsms.com/api/sendmsg.php?user=RAJLAKSHMIBWA&pass=123456&sender=BUZWAP&phone=${user_mobile_num}&text=gauswarn_ghee002&priority=wa&stype=normal&Params=${ordeId},${user_total_amount}&htype=image&url=https://i.ibb.co/p6P86j3J/Whats-App-Image-2025-02-17-at-12-46-41.jpg`;

  try {
    const response = await axios.get(whatsappApiUrl);

    if (!response.status === 200) {
      throw new Error(`API error: ${response.data.message}`);
    }

    return response.data;
  } catch (error) {
    throw error;
  }
}

async function generateShopmozyAPI(
  user_name,
  user_mobile_num,
  user_email,
  user_state,
  user_city,
  user_house_number,
  user_landmark,
  user_pincode,
  cart,
  date
) {
  try {
    const ShippingPayLoad = {
      order_id: "ordID",
      order_date: date,
      order_type: "ESSENTIALS",
      consignee_name: user_name,
      consignee_phone: Number(user_mobile_num),
      consignee_alternate_phone: Number(user_mobile_num),
      consignee_email: user_email,
      consignee_address_line_one: user_house_number,
      consignee_address_line_two: user_landmark,
      consignee_pin_code: user_pincode,
      consignee_city: user_city,
      consignee_state: user_state,
      product_detail: cart?.map((i) => {
        return {
          name: i?.product_name,
          sku_number: "22",
          quantity: i?.product_quantity,
          discount: "",
          hsn: "#123",
          unit_price: i?.product_price,
          product_category: "Ghee",
        };
      }),
      payment_type: "PREPAID",
      cod_amount: "",
      shipping_charges: "",
      weight: 200,
      length: 10,
      width: 20,
      height: 15,
      warehouse_id: "",
      gst_ewaybill_number: "",
      gstin_number: "",
    };

    const apiResponse = await axios.post(
      `https://shipping-api.com/app/api/v1/push-order`,
      ShippingPayLoad,
      {
        headers: {
          "Content-Type": "application/json",
          "private-key": "G0K1PQYBq3Xlph6y48gw",
          "public-key": "LBYfQgGFRljv1A249H87",
        },
      }
    );
    return apiResponse?.data?.data?.order_id;
  } catch (error) {}
}

module.exports = {
  createPaymentAndGenerateUrlRazor,
  getRazorpayStatusAndUpdatePayment,
  checkRazorpayPaymentStatus,
};
