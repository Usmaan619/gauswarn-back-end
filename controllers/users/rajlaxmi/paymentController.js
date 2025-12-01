// rajlaxmi // controller //payment

const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");
const {
  generateChecksumForPhonePe,
  generateMergedKey,
} = require("../../../utils/payment.service");
const { withConnection } = require("../../../utils/helper");
const { processOrderAfterPayment } = require("../../../utils/processOrderAfterPayment");



const createPaymentAndGenerateUrl = async (req, res) => {
  try {
    const {
      uid,
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
      user_coupon,
    } = req.body;


    if (
      !uid ||
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
      !purchase_price
    ) {
      return res
        
        .json({ success: false, message: "All fields are required." });
    }

    const date = moment().format("YYYY-MM-DD");
    const time = moment().format("HH:mm:ss");
    const amountInPaise = user_total_amount * 100;
    const orderId = uuidv4();

    const userQuery = `
      INSERT INTO rajlaxmi_payment 
      (uid, user_name, user_mobile_num, user_email, user_state, user_city, user_country, 
       user_house_number, user_landmark, user_pincode, user_total_amount, purchase_price, 
        user_coupon, date, time) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await withConnection(async (connection) => {
      return connection.execute(userQuery, [
        uid,
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
        user_coupon,
        date,
        time,
      ]);
    });

    const userId = result.insertId;
    const mergedKey = await generateMergedKey(
      user_name,
      user_mobile_num,
      orderId
    );
    const token = jwt.sign(
      {
        userId,
        uid,
        user_name,
        user_email,
        orderId,
        amountInPaise,
        user_coupon,
      }, // Include user_coupon in token
      process.env.JWT_SECRET,
      { expiresIn: "6m" }
    );

    const paymentPayload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantUserId: uid,
      mobileNumber: user_mobile_num,
      amount: amountInPaise,
      merchantTransactionId: orderId,
      redirectUrl: `${process.env.REDIRECT_URL_TO_BACKEND_API}/?id=${orderId}&tarnId=${userId}`,
      redirectMode: "POST",
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const payload = Buffer.from(JSON.stringify(paymentPayload)).toString(
      "base64"
    );
    const checksum = await generateChecksumForPhonePe(payload);

    const options = {
      method: "POST",
      url: process.env.PHONEPE_MERCHANT_BASE_URL,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: { request: payload },
    };

    const response = await axios.request(options);

    if (!response.data?.data?.instrumentResponse?.redirectInfo?.url) {
      throw new Error("Redirect URL not found in PhonePe response");
    }

    res
    
    .json({
      status:200,
      success: true,
      message: "Payment URL generated successfully",
      url: response.data.data.instrumentResponse.redirectInfo.url,
      token,
      mergedKey,
      date: moment().format("MMMM Do YYYY, h:mm:ss a"),
    });
  } catch (error) {
    console.error("Error in createPaymentAndGenerateUrl:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Payment generation failed",
        error: error.message,
      });
  }
};

const getPhonePeUrlStatusAndUpdatePayment = async (req, res) => {
  try {
    const merchantTransactionId = req.query.id;
    const tarnId = req.query.tarnId;
    const keyIndex = process.env.SALT_INDEX;

    const string =
      `/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}` +
      process.env.PHONEPE_MERCHANT_KEY;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    const option = {
      method: "GET",
      url: `${process.env.PHONEPE_MERCHANT_STATUS_URL}/${process.env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": process.env.PHONEPE_MERCHANT_ID,
      },
    };

    const response = await axios.request(option);
    const paymentStatus = response.data.code;
    const paymentDetails = JSON.stringify(response.data);
    const isPaymentPaid = paymentStatus === "PAYMENT_SUCCESS";

    const query = `UPDATE rajlaxmi_payment SET status = ?, paymentDetails = ?, isPaymentPaid = ? WHERE id = ?`;
    await withConnection(async (connection) =>
      connection.execute(query, [
        paymentStatus,
        paymentDetails,
        isPaymentPaid,
        tarnId,
      ])
    );

     // ✅ If payment is successful, process the order
     if (isPaymentPaid) {
      await processOrderAfterPayment(tarnId);
    } 

    const redirectUrl = isPaymentPaid
      ? process.env.REDIRECT_URL_TO_SUCCESS_PAGE_RAJLAXMI
      : process.env.REDIRECT_URL_TO_FAILURE_PAGE_RAJLAXMI;
    res.redirect(redirectUrl);
  } catch (err) {
    console.error("Error fetching PhonePe status or updating database:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  createPaymentAndGenerateUrl,
  getPhonePeUrlStatusAndUpdatePayment,
};
