const Razorpay = require("razorpay");

const { default: axios } = require("axios");
const db = require("../../../config/dbConnection");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const {
  generateChecksumForPhonePe,
  generateMergedKey,
} = require("../../../utils/payment.service");
const moment = require("moment");

const jwt = require("jsonwebtoken");

const { withConnection } = require("../../../utils/helper");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_yxHWWlu9sVA1sQ",
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createPaymentAndGenerateUrlRazor = async (req, res) => {
  const {
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
    purchase_price,
    product_quantity,
    cart,
  } = req.body;

  // Validate the payload
  if (
    !user_name ||
    !user_mobile_num ||
    !user_email ||
    !user_state ||
    !user_city ||
    !user_country ||
    !user_house_number ||
    !user_landmark ||
    !user_pincode ||
    !user_total_amount ||
    !purchase_price ||
    !product_quantity
  ) {
    return res.json({ success: false, message: "All fields are required." });
  }

  const date = moment().format("YYYY-MM-DD");
  const time = getCurrentTime();

  // Convert user_total_amount to paise for Razorpay (same as PhonePe)
  const amountIn = user_total_amount * 100;

  // Insert user details into the database
  const userQuery = `INSERT INTO gauswarn_payment (user_name, user_mobile_num, user_email, user_state, user_city, user_country, user_house_number, user_landmark, user_pincode, user_total_amount, purchase_price, product_quantity, date, time)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  try {
    const [result] = await withConnection(async (connection) => {
      return connection.execute(userQuery, [
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
        purchase_price,
        product_quantity,
        date,
        time,
      ]);
    });

    // Get the inserted user ID
    const userId = result.insertId;

    const getOrderIdByShopmozy = await generateShopmozyAPI(
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

    // Create a unique order ID
    const orderId = getOrderIdByShopmozy;

    const mergedKey = await generateMergedKey(
      user_name,
      user_mobile_num,
      orderId
    );

    // Create a JWT for secure data exchange
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

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountIn, // Amount in
      currency: "INR",
      receipt: orderId,
      notes: {
        user_name,
        user_email,
        user_mobile_num,
        userId: userId.toString(),
        shopmozy_order_id: getOrderIdByShopmozy,
      },
    });

    console.log("razorpayOrder: ", razorpayOrder);

    // Respond with the created payment record and Razorpay URL
    res.json({
      success: true,
      message: "OK",
      razorpay_order_id: razorpayOrder.id,
      razorpayOrder,
      token,
      mergedKey,
      date: moment().format("MMMM Do YYYY, h:mm:ss a"),
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment or generate URL",
      error: error.message,
    });
  }
};

const getRazorpayStatusAndUpdatePayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body?.rzpResponse;

  console.log("req.body: ", req.body);

  const userId = req?.body?.notes?.userId;
  const mobNo = req?.body?.notes?.user_mobile_num;
  const amount = req?.body?.amount;
  const orderId = req?.body?.receipt;

  try {
    // Verify the payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    console.log("isAuthentic: ", isAuthentic);
    if (isAuthentic) {
      // Fetch payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      console.log("payment:===============response ", payment);

      // Update payment status in the database
      const query = `UPDATE gauswarn_payment SET status = ?, paymentDetails = ?, isPaymentPaid = ?  WHERE user_id = ?`;

      const [result] = await withConnection(async (connection) => {
        return connection.execute(query, [
          payment.status,
          JSON.stringify(payment),
          payment.status === "captured",
          userId,
        ]);
      });

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
      const query = `UPDATE gauswarn_payment SET status = ?, paymentDetails = ?, isPaymentPaid = ? WHERE user_id = ?`;

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
    console.error("Error processing Razorpay payment:", error);
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
    console.error("Error fetching payment status:", error);
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
          name: i?.product_name || "Ghee",
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
  } catch (error) {
    console.log("error: ", error);
  }
}

module.exports = {
  createPaymentAndGenerateUrlRazor,
  getRazorpayStatusAndUpdatePayment,
  checkRazorpayPaymentStatus,
};
