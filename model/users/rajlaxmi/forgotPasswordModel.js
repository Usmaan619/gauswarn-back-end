const {
  forgetPasswordTemplate,
} = require("../../../emailTemplates/forgetPasswordTemplate");
const {
  createEmailTransporter,
  connectToDatabase,
} = require("../../../utils/helper");

//generate OTP 6 digits
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

const forgotPassword = async (otp) => {
  try {
    const connection = await connectToDatabase();
    const query = `INSERT INTO rajlaxmi_user (otp) VALUES (?)`;
    await connection.execute(query, [otp]);
    console.log("OTP stored successfully");
  } catch (error) {
    console.log("Error storing OTP in database:", error);
    throw error;
  }
};

//send OTP email
exports.sendOTPEmail = async (to, hostname) => {
  try {
    const otp = generateOTP(); // Generate OTP
    const transporter = await createEmailTransporter();

    const mailOptions = {
      from: process.env.SMTP_SIW_USER,
      to: "",
      subject: "Forget Password",
      text: `Your OTP for resetting your password is: ${otp}`,
      html: forgetPasswordTemplate(otp, hostname),
      //   to: "donotreply-cloustest@medtronic.com",
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("info:", info);

    await forgotPassword(otp);

    return otp;
  } catch (error) {
    console.log("Error sending OTP email:", error);
    throw error;
  }
};

exports.findUserByEmail = async (user_email) => {
  try {
    const connection = await connectToDatabase();
    const query = `SELECT * FROM rajlaxmi_user WHERE email = ?`;
    const [rows] = await connection.execute(query, [user_email]);
    return rows[0] || null;
  } catch (error) {
    console.log("Error ", error);
    return error;
  }
};

exports.findUserOTP = async (otp) => {
  try {
    const connection = await connectToDatabase();
    const query = `SELECT * FROM rajlaxmi_user WHERE otp = ?`;
    const [rows] = await connection.execute(query, [otp]);
    return rows[0] || null;
  } catch (error) {
    console.log("error: ", error);
    throw error;
  }
};

/// Re-set password
exports.resetPassword = async (user_email, hashedPassword) => {
  const query = `UPDATE rajlaxmi_user SET password = ? ,otp = ? , WHERE email = ? `;
  const [rows] = await dbConnection
    .promise()
    .query(query, [hashedPassword, user_email]);
  if (rows.affectedRows > 0) {
    return { message: "Password reset sucessfully" };
  }
  try {
  } catch (error) {
    console.log("Error :", error);
    throw error;
  }
};
