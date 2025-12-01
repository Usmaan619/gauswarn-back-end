const { withConnection } = require("../../../utils/helper");

exports.addWishlist = async ({
  uid,
  product_id,
  product_name,
  product_price,
  product_quantity,
  product_image, // Added product_image
}) => {
  try {
    return await withConnection(async (connection) => {
      const query = `INSERT INTO rajlaxmi_wishlist (uid, product_id, product_name, product_price, product_quantity, product_image) VALUES (?, ?, ?, ?, ?, ?)`; // Updated query

      // Executing the insert query
      const [result] = await connection.execute(query, [
        uid,
        product_id,
        product_name,
        product_price,
        product_quantity,
        product_image, // Added product_image
      ]);

      return {
        message: "Wishlist item added successfully",
        insertId: result.insertId,
      };
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    throw error; // Ensure the error propagates to the controller
  }
};

// Get All Wishlist
exports.getAllWishlistAll = async () => {
  try {
    return await withConnection(async (connection) => {
      const query = `SELECT * FROM rajlaxmi_wishlist WHERE uid = ?`;
      const [products] = await connection.execute(query);
      return products;
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getAllWishlist = async (id) => {
  try {
    return await withConnection(async (connection) => {
      const [rows] = await connection.query(
        `SELECT * FROM rajlaxmi_wishlist WHERE uid = ?`,
        [id]
      );
      return rows;
    });
  } catch (error) {
    console.log("error: ", error);
    throw error;
  }
};

// Remove wishlist
// exports.removeFromWishlist = async (uid) => {
//     try {
//         return await withConnection(async (connection) => {
//             const query = `DELETE FROM rajlaxmi_wishlist WHERE uid = ?`;

//             // Executing the delete query
//             const [result] = await connection.execute(query, [uid]);

//             // Check if any rows were affected (deleted)
//             if (result.affectedRows === 0) {
//                 return null;  // No wishlist item was removed
//             }

//             return { message: "Wishlist item removed successfully", affectedRows: result.affectedRows };
//         });
//     } catch (error) {
//         console.error("Error removing wishlist", error);
//     }
// };

exports.removeFromWishlist = async (uid, product_id) => {
  try {
    return await withConnection(async (connection) => {
      const query = `DELETE FROM rajlaxmi_wishlist WHERE uid = ? AND product_id = ?`;

      // Executing the delete query
      const [result] = await connection.execute(query, [uid, product_id]);

      // Check if any rows were affected (deleted)
      if (result.affectedRows === 0) {
        return null; // No wishlist item was removed
      }

      return {
        message: "Wishlist item removed successfully",
        affectedRows: result.affectedRows,
      };
    });
  } catch (error) {
    console.error("Error removing wishlist:", error);
    throw error; // Ensure the error propagates to the calling function
  }
};
