const { withConnection } = require("../../../utils/helper");

// Create (Add Review)
exports.addReview = async (
  user_name,
  user_email,
  rating,
  product_id,
  feedback
) => {
  try {
    return await withConnection(async (connection) => {
      const query = `
        INSERT INTO rajlaxmi_feedback ( user_name, user_email, rating, product_id, feedback)
        VALUES ( ?, ?, ?, ?, ?)
      `;
      const [result] = await connection.execute(query, [
        user_name,
        user_email,
        rating,
        product_id,
        feedback,
      ]);
      return result.insertId;
    });
  } catch (error) {
    console.error("Database Error:", error.message);
    throw error;
  }
};

// Read (Get All Reviews)
exports.getAllReviews = async () => {
  return await withConnection(async (connection) => {
    const [rows] = await connection.query(`SELECT * FROM rajlaxmi_feedback`);
    return rows;
  });
};

// Read (Single Review by ID)
exports.getReviewById = async (id) => {
  return await withConnection(async (connection) => {
    const [rows] = await connection.query(
      `SELECT * FROM rajlaxmi_feedback WHERE id = ?`,
      [id]
    );
    return rows[0];
  });
};

// Update Review
exports.updateReview = async (id, updatedData) => {
  const { user_name, user_email, rating, product_id, feedback } = updatedData;
  return await withConnection(async (connection) => {
    const query = `
      UPDATE rajlaxmi_feedback 
      SET user_name = ?, user_email = ?, rating = ?, product_id = ?, feedback = ?
      WHERE id = ?
    `;
    const [result] = await connection.execute(query, [
      user_name,
      user_email,
      rating,
      product_id,
      feedback,
      id,
    ]);
    return result;
  });
};

// Delete Review
exports.deleteReview = async (id) => {
  return await withConnection(async (connection) => {
    const [result] = await connection.execute(
      `DELETE FROM rajlaxmi_feedback WHERE id = ?`,
      [id]
    );
    return result;
  });
};
