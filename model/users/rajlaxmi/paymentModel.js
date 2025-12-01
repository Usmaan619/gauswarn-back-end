// paymentModel
const { connectToDatabase } = require("../../../config/dbConnection");

exports.userPayment = async (payment) => {
  const {
    uid,
    user_name,
    user_number,
    user_email,
    user_state,
    user_city,
    user_country,
    user_landmark,
    user_house_number,
    user_total_amount,
    purchase_price,
    product_quantity 
  } = payment;

  try {
    const connection = await connectToDatabase();
    
    // Insert payment details 
    const insertPaymentQuery = `
      INSERT INTO rajlaxmi_payment (
        uid, 
        user_name, 
        user_number, 
        user_email, 
        user_state, 
        user_city, 
        user_country, 
        user_landmark, 
        user_house_number, 
        user_total_amount, 
        purchase_price, 
        product_quantity
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    // Execute the insert query 
    const [paymentResult] = await connection.execute(insertPaymentQuery, [
      uid, 
      user_name, 
      user_number, 
      user_email, 
      user_state, 
      user_city, 
      user_country, 
      user_landmark, 
      user_house_number, 
      user_total_amount, 
      purchase_price, 
      product_quantity
    ]);

    // Return a successful response
    return {
      success: true,
      message: "Payment done successfully",
    //   addtocart, 
      billing_details: {
        user_state,
        user_city,
        user_country,
        user_landmark,
        user_house_number,
        total_amount: user_total_amount
      }
    };
  } catch (error) {
    console.error("Error during payment process:", error);
    throw error; 
  }
};
