const { withConnection } = require("../../utils/helper");

// Fetch all getAllUserInfo reviews Ghee-web-app single-page payment-table
exports.getAllUserInfo = async () => {
  try {
    // Ensure limit is a safe positive integer

    return await withConnection(async (connection) => {
      const query = `
        SELECT 
          user_id,
          user_name,
          user_email,
          user_state,
          user_city,
          user_country,
          user_house_number,
          user_landmark,
          user_pincode,
          user_mobile_num,
          user_total_amount,
          date,
          time
        FROM gauswarn_payment WHERE STATUS = 'captured';
      `;

      const [rows] = await connection.execute(query);
      return rows;
    });
  } catch (error) {
    console.error("Error in getAllUserInfo:", error);
    throw error;
  }
};

// Fetch all getAllUserInfo Ghee-web-app single-page payment-table
exports.getAllOrderDetails = async () => {
  try {
    return await withConnection(async (connection) => {
      const query = `
        SELECT user_id, user_name, user_email, user_state, user_city, user_country, user_house_number, user_landmark, user_pincode, user_mobile_num, user_total_amount, STATUS , paymentDetails, isPaymentPaid, id, DATE, TIME FROM gauswarn_payment WHERE STATUS = 'captured';
      `;

      const [rows] = await connection.execute(query);
      return rows;
    });
  } catch (error) {
    console.error("Error in getAllOrderDetails:", error);
    throw error;
  }
};
