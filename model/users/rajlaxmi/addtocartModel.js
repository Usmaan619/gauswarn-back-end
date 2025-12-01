// // models/cartModel.js
// const { connectToDatabase } = require("../../../config/dbConnection");
// const { withConnection } = require("../../../utils/helper");

// // Check if cart item exists
// exports.findCartItem = async (product_id, uid) => {

//   try {
//     connection = await connectToDatabase();

//     const query = `SELECT * FROM rajlaxmi_addtocart WHERE product_id = ? AND uid = ?`;
//     const [rows] = await connection.execute(query, [product_id, uid]);
//     return rows.length > 0 ? rows[0] : null;

//   } catch (error) {
//     
//     throw error;
//   }
// };

// // Add a new item to the cart
// exports.addCartItem = async (cartItem) => {
//   try {
//     const {
//       uid,
//       product_id,
//       product_name,
//       product_price,
//       product_weight,
//       product_quantity,
//       product_total_amount,
//     } = cartItem;

//     const connection = await connectToDatabase();
//     const query = `INSERT INTO rajlaxmi_addtocart (
//           uid,
//           product_id,
//           product_name,
//           product_price,
//           product_weight,
//           product_quantity,
//           product_total_amount
//       ) VALUES (?, ?, ?, ?, ?, ?, ?)`;

//     const [results] = await connection.execute(query, [
//       uid,
//       product_id,
//       product_name,
//       product_price,
//       product_weight,
//       product_quantity,
//       product_total_amount,
//     ]);
//     return results;
//   } catch (error) {
//     
//     throw error;
//   }
// };

// // Update cart item
// exports.updateCartItem = async (
//   uid,
//   product_id,
//   product_name,
//   product_quantity,
//   product_total_amount
// ) => {
//   let connection;
//   try {
//     connection = await connectToDatabase();

//     const query = `
//       UPDATE rajlaxmi_addtocart
//       SET product_quantity = ?, product_total_amount = ?
//       WHERE product_id = ? AND uid = ? AND product_name = ?
//     `;

//     const [results] = await connection.execute(query, [
//       product_quantity, // Use correct parameter
//       product_total_amount, // Use correct parameter
//       product_id,
//       uid, // Fix: UID comes before product_name
//       product_name,
//     ]);

//     return results.affectedRows;
//   } catch (error) {
//     
//     throw error;
//   } finally {
//     if (connection) {
//       await connection.end(); // Release the connection if using a pool
//     }
//   }
// };

// // Function to remove an item from the cart
// exports.deleteCartItem = async (uid, product_id) => {
//   try {
//     const connection = await connectToDatabase();
//     const query = `DELETE FROM rajlaxmi_addtocart WHERE product_id = ? AND uid = ?`;

//     const [result] = await connection.execute(query, [uid, product_id]);
//     

//     if (result.affectedRows > 0) {
//       return { message: "Product removed from cart" };
//     } else {
//       return { message: "No matching product in cart" };
//     }
//   } catch (error) {
//     
//     throw error;
//   }
// };

// // Get All Carts
// exports.getAllCarts = async () => {
//   try {
//     const connection = await connectToDatabase();
//     const query = "SELECT * FROM rajlaxmi_addtocart";
//     const [carts] = await connection.execute(query);
//     return carts;
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };

// exports.getCartItemsByUserId = async (uid) => {
//   try {
//     const connection = await connectToDatabase(); // Ensure database connection
//     const query = `SELECT * FROM rajlaxmi_addtocart WHERE uid = ?`;

//     const [rows] = await connection.execute(query, [uid]);

//     return rows; // Return the cart items array

//   } catch (error) {
//     
//     throw error;
//   }
// };

const { connectToDatabase } = require("../../../config/dbConnection");
const { withConnection } = require("../../../utils/helper");

// Find a cart item by product ID and user ID
exports.findCartItem = async (product_id, uid) => {
  let connection;
  try {
    connection = await connectToDatabase();
    const query = `SELECT * FROM rajlaxmi_addtocart WHERE product_id = ? AND uid = ?`;
    const [rows] = await connection.execute(query, [product_id, uid]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    
    throw error;
  } finally {
    if (connection) await connection.end();
  }
};

// Add a new item to the cart
exports.addCartItem = async (cartItem) => {
  let connection;
  try {
    connection = await connectToDatabase();
    const query = `INSERT INTO rajlaxmi_addtocart (uid, product_id, product_name, product_price, product_weight, product_quantity, product_total_amount)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await connection.execute(query, [
      cartItem.uid,
      cartItem.product_id,
      cartItem.product_name,
      cartItem.product_price,
      cartItem.product_weight,
      cartItem.product_quantity,
      cartItem.product_total_amount,
    ]);
    return result;
  } catch (error) {
    
    throw error;
  } finally {
    if (connection) await connection.end();
  }
};

// Update cart item quantity and total amount
exports.updateCartItem = async (
  uid,
  product_id,
  product_quantity,
  product_total_amount,
  product_weight
) => {
  let connection;
  try {
    connection = await connectToDatabase();
    const query = `UPDATE rajlaxmi_addtocart 
    SET product_quantity = ?, 
        product_total_amount = ?, 
        product_weight = ? 
    WHERE product_id = ? AND uid = ? AND product_weight = ?`;
    const [result] = await connection.execute(query, [
      product_quantity,
      product_total_amount,
      product_weight,
      product_id,
      uid,
      product_weight,
    ]);
    return result.affectedRows > 0;
  } catch (error) {
    
    throw error;
  } finally {
    if (connection) await connection.end();
  }
};

// Delete cart item
exports.deleteCartItem = async (uid, product_id) => {
  try {
    return await withConnection(async (connection) => {
      const query = `DELETE FROM rajlaxmi_addtocart WHERE product_id = ? AND uid = ?`;
      const [result] = await connection.execute(query, [product_id, uid]);
      return result.affectedRows > 0;
    });
  } catch (error) {
    
    throw error;
  }
};

// Get all cart items
exports.getAllCarts = async () => {
  const connection = await connectToDatabase();
  const [rows] = await connection.execute("SELECT * FROM rajlaxmi_addtocart");
  await connection.end();
  return rows;
};

// Get cart items by user ID
exports.getCartItemsByUserId = async (uid) => {
  const connection = await connectToDatabase();
  const [rows] = await connection.execute(
    "SELECT * FROM rajlaxmi_addtocart WHERE uid = ?",
    [uid]
  );
  await connection.end();
  return rows;
};

exports.findCartItemPlusWait = async (product_id, uid, product_weight) => {
  let connection;
  try {
    connection = await connectToDatabase();
    const query = `SELECT * FROM rajlaxmi_addtocart WHERE product_id = ? AND uid = ? AND product_weight = ?`;
    const [rows] = await connection.execute(query, [
      product_id,
      uid,
      product_weight,
    ]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    
    throw error;
  } finally {
    if (connection) await connection.end();
  }
};

exports.getAllCartById = async (id) => {
  return await withConnection(async (connection) => {
    const [rows] = await connection.query(
      `SELECT * FROM rajlaxmi_addtocart WHERE uid = ?`,
      [id]
    );
    return rows;
  });
};
