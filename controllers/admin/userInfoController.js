// Get All Products

const adminUserInfoModal = require("../../model/admin/userInfoModal");
const asyncHandler = require("express-async-handler");
const { orderConfirmationTemplate } = require("../../emailTemplates/orderConfirmationTemplate");
const moment = require("moment");

exports.getAllUserInfo = asyncHandler(async (req, res) => {
  try {
    const customers = await adminUserInfoModal.getAllUserInfo(
      req?.query?.limit
    );
    res.json({ success: true, customers });
  } catch (error) {
    res.json({ error: "Failed to fetch products" });
  }
});

// get user details by payment table
exports.getAllOrderDetails = asyncHandler(async (req, res) => {
  try {
    const orderDetails = await adminUserInfoModal.getAllOrderDetails(
      req?.query?.limit
    );
    res.json({ success: true, orderDetails });
  } catch (error) {
    res.json({ error: "Failed to fetch products" });
  }
});



exports.updateOrderStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const result = await adminUserInfoModal.updateOrderStatus(id, status);

    res.json({ success: true, message: "Order status updated!" });

  } catch (error) {
    res.json({ success: false, message: "Failed to update" });
  }
});

exports.getInvoiceHtml = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const dbUserRow = await adminUserInfoModal.getOrderDetailsById(id);

    if (!dbUserRow) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let cart = [];
    try {
      cart = JSON.parse(dbUserRow.cart_data || "[]");
    } catch (_) {}

    const subtotal = cart.reduce((sum, item) => (item.product_price || 0) * (item.product_quantity || 1) + sum, 0);

    const orderData = {
      order_id: dbUserRow.shopmozo_order_id || `ORD-${dbUserRow.user_id}`,
      user_name: dbUserRow.user_name || "",
      user_email: dbUserRow.user_email || "",
      user_mobile_num: dbUserRow.user_mobile_num || "",
      user_house_number: dbUserRow.user_house_number || "",
      user_landmark: dbUserRow.user_landmark || "",
      user_city: dbUserRow.user_city || "",
      user_state: dbUserRow.user_state || "",
      user_country: dbUserRow.user_country || "",
      user_pincode: dbUserRow.user_pincode || "",
      cart,
      subtotal,
      discount: Number(dbUserRow.discount_amount) || 0,
      coupon_code: dbUserRow.coupon_code || null,
      total_amount: Number(dbUserRow.final_payable_amount || dbUserRow.user_total_amount),
      payment_id: dbUserRow.razorpay_payment_id || "",
      date: moment(dbUserRow.date || new Date()).format("DD MMM YYYY"),
    };

    const html = orderConfirmationTemplate(orderData);
    res.json({ success: true, html });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ success: false, message: "Failed to generate invoice" });
  }
});
