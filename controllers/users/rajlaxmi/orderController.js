const orderModel = require("../../../model/users/rajlaxmi/orderModal");
const asyncHandler = require("express-async-handler");

exports.createOrder = asyncHandler(async (req, res) => {
  try {
    const {
      order_id,
      uid,
      product_id,
      product_name,
      product_price,
      product_weight,
      product_quantity,
      product_total_amount,
      order_status,
    } = req.body;

    if (!order_id || !uid || !product_id) {
      return res
        .status(400)
        .json({ message: "Order ID, UID, and Product ID are required" });
    }

    const id = await orderModel.addOrder(
      order_id,
      uid,
      product_id,
      product_name,
      product_price,
      product_weight,
      product_quantity,
      product_total_amount,
      order_status
    );

    res.status(201).json({ success: true, message: "Order created", id });
  } catch (error) {
    console.error("Create Order Error:", error);
    throw error;
  }
});

exports.getAllOrders = asyncHandler(async (req, res) => {
  try {
    const orders = await orderModel.getAllOrders();
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Get All Orders Error:", error);
    throw error;
  }
});
exports.getOrderById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderModel.getOrderById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get Order by ID Error:", error);
    throw error;
  }
});
exports.updateOrder = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const result = await orderModel.updateOrder(id, updatedData);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ success: true, message: "Order updated" });
  } catch (error) {
    console.error("Update Order Error:", error);
    throw error;
  }
});
exports.deleteOrder = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const result = await orderModel.deleteOrder(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ success: true, message: "Order deleted" });
  } catch (error) {
    console.error("Delete Order Error:", error);
    throw error;
  }
});
