const { withConnection } = require("../../../utils/helper");
const insertOrderItem = async (
  orderId,
  userId,
  product_id,
  user_name,
  product_name,
  product_price,
  product_weight,
  product_quantity,
  product_total_amount
) => {
  try {
    return await withConnection(async (connection) => {
      const query = `
      INSERT INTO rajlaxmi_orders 
      (order_id, uid, product_id, user_name, product_name, product_price, product_weight, product_quantity, product_total_amount, order_status, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Processing', NOW())
    `;

      const [result] = await connection.execute(query, [
        orderId || null,
        userId || null,
        product_id || null,
        user_name || null,
        product_name || null,
        product_price || null,
        product_weight || null,
        product_quantity || null,
        product_total_amount || null,
      ]);

      return result.affectedRows > 0;
    });
  } catch (error) {
    return false;
  }
};

const deleteCartItems = async (uid) => {
  try {
    return await withConnection(async (connection) => {
      const query = `DELETE FROM rajlaxmi_addtocart WHERE uid = ?`;

      const [result] = await connection.execute(query, [uid]);

      return result.affectedRows > 0;
    });
  } catch (error) {
    return false;
  }
};

const updateOrderItemStatus = async (order_status, uid) => {
  try {
    return await withConnection(async (connection) => {
      const query = `UPDATE rajlaxmi_orders SET order_status = ?  WHERE uid = ?`;

      const [result] = await connection.execute(query, [order_status, uid]);

      return result.affectedRows > 0;
    });
  } catch (error) {
    return false;
  }
};

module.exports = {
  insertOrderItem,
  deleteCartItems,
  updateOrderItemStatus,
};
