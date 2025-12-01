const { connectToDatabase } = require("../../../config/dbConnection");

// Add Product
const { v4: uuidv4 } = require("uuid"); // Import UUID package
const { withConnection, shortenUUID } = require("../../../utils/helper");

exports.addProduct = async (productData) => {
  try {
    let {
      product_name,
      product_description,
      product_price,
      product_weight, // Array: [ 5KG, 10KG, 15KG, 20KG ]
      product_stock,
      product_category,
      product_image,
      product_tax,
      product_final_price,
      purchase_price,
    } = productData;

    // Generate a unique product_id
    // const product_id_long = uuidv4();
    // const product_id = shortenUUID(product_id_long);

    return await withConnection(async (connection) => {
      const query = `
        INSERT INTO rajlaxmi_product 
        (product_name, product_description, product_price, product_weight, product_stock, product_category, product_image, product_tax, product_final_price, purchase_price) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await connection.execute(query, [
        product_name || null, // Ensure null for missing values
        product_description || null,
        product_price || null,
        (product_weight = JSON.stringify(product_weight) || null),
        product_stock || null,
        product_category || null,
        product_image || null,
        product_tax || null,
        product_final_price || null,
        purchase_price || null,
      ]);

      return result.insertId;
    });
  } catch (error) {
    console.log("=====error: ", error);
    throw new Error(error.message);
  }
};

// Get All Products
exports.getAllProducts = async () => {
  try {
    const connection = await connectToDatabase();
    const query = `SELECT * FROM rajlaxmi_product`;
    const [products] = await connection.execute(query);
    return products;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getAllProductsWithFeedback = async () => {
  try {
    const connection = await connectToDatabase();
    const query = `
      SELECT 
        p.id,
        p.product_id,
        p.product_name,
        p.product_description,
        p.product_price,
        p.product_weight,
        p.product_stock,
        p.product_category,
        p.product_image,
        p.product_tax,
        GROUP_CONCAT(f.rating SEPARATOR ', ') AS feedback_ratings,
        GROUP_CONCAT(f.feedback SEPARATOR ', ') AS feedbacks,
        GROUP_CONCAT(f.user_name SEPARATOR ', ') AS feedback_user_names,
        GROUP_CONCAT(f.user_email SEPARATOR ', ') AS feedback_user_emails
      FROM rajlaxmi_product p
      LEFT JOIN rajlaxmi_feedback f ON p.product_id = f.product_id
      GROUP BY p.product_id
    `;
    const [productsWithFeedback] = await connection.execute(query);

    productsWithFeedback.forEach((product) => {
      const feedback_ratings = product.feedback_ratings
        .split(", ")
        .map((rating) => rating.trim());
      const feedbacks = product.feedbacks
        .split(", ")
        .map((feedback) => feedback.trim());
      const feedback_user_names = product.feedback_user_names
        .split(", ")
        .map((name) => name.trim());
      const feedback_user_emails = product.feedback_user_emails
        .split(", ")
        .map((email) => email.trim());

      const feedbacksArray = feedback_ratings.map((rating, index) => ({
        feedback_ratings: rating,
        feedbacks: feedbacks[index] || "",
        feedback_user_names: feedback_user_names[index] || "",
        feedback_user_emails: feedback_user_emails[index] || "",
      }));

      product.feedbacks = feedbacksArray;
      delete product.feedback_ratings;
      delete product.feedback_user_names;
      delete product.feedback_user_emails;
    });

    return productsWithFeedback;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.updateProduct = async (productData) => {
  try {
    let {
      product_id,
      product_name,
      product_description,
      product_price,
      product_weight,
      product_stock,
      product_category,
      product_image,
      product_tax,
      purchase_price,
    } = productData;

    return await withConnection(async (connection) => {
      const query = `UPDATE
    rajlaxmi_product
SET
    product_name = ?,
    product_description = ?,
    product_price = ?,
    product_weight = ?,
    product_stock = ?,
    product_category = ?,
    product_image = ?,
    product_tax = ?,
    purchase_price = ?
WHERE
    product_id = ?;`;

      const [result] = await connection.execute(query, [
        product_name,
        product_description,
        product_price,
        product_weight,
        product_stock,
        product_category,
        product_image,
        product_tax,
        purchase_price,
        product_id,
      ]);

      if (result.affectedRows === 0) {
        throw new Error("Product not found or no changes made");
      }

      return product_id;
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.deleteProduct = async (product_id) => {
  try {
    return await withConnection(async (connection) => {
      const query = "DELETE FROM rajlaxmi_product WHERE product_id = ?";
      const [result] = await connection.execute(query, [product_id]);
      return result.affectedRows > 0;
    });
  } catch (error) {
    throw new Error(error.message);
  }
};
