const { withConnection } = require("../../../utils/helper");

exports.addOrder = async (
  order_id,
  uid,
  product_id,
  product_name,
  product_price,
  product_weight,
  product_quantity,
  product_total_amount,
  order_status
) => {
  return await withConnection(async (conn) => {
    const query = `
      INSERT INTO rajlaxmi_orders 
      (order_id, uid, product_id, product_name, product_price, product_weight, product_quantity, product_total_amount, order_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await conn.execute(query, [
      order_id,
      uid,
      product_id,
      product_name,
      product_price,
      product_weight,
      product_quantity,
      product_total_amount,
      order_status,
    ]);
    return result.insertId;
  });
};

exports.getAllOrders = async () => {
  return await withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT * FROM rajlaxmi_orders ORDER BY created_at DESC`
    );
    return rows;
  });
};

exports.getOrderById = async (id) => {
  return await withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT * FROM rajlaxmi_orders WHERE id = ?`,
      [id]
    );
    return rows[0];
  });
};

exports.updateOrder = async (id, data) => {
  const fields = Object.keys(data)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = Object.values(data);

  return await withConnection(async (conn) => {
    const query = `UPDATE rajlaxmi_orders SET ${fields} WHERE id = ?`;
    const [result] = await conn.execute(query, [...values, id]);
    return result;
  });
};

exports.deleteOrder = async (id) => {
  return await withConnection(async (conn) => {
    const [result] = await conn.execute(
      `DELETE FROM rajlaxmi_orders WHERE id = ?`,
      [id]
    );
    return result;
  });
};
