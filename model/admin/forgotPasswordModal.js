const {
  forgetPasswordTemplate,
} = require("../../emailTemplates/forgetPasswordTemplate");
const { createEmailTransporter, withConnection } = require("../../utils/helper");

// Generate OTP 6 digits
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

// Send OTP email
exports.sendOTPEmail = async (to, hostname) => {
  try {
    const otp = generateOTP();
    const transporter = await createEmailTransporter();

    const mailOptions = {
      from: process.env.SMTP_SIW_USER,
      to,
      subject: "Forget Password",
      text: `Your OTP for resetting your password is: ${otp}`,
      html: forgetPasswordTemplate(otp, hostname),
    };

    const info = await transporter.sendMail(mailOptions);

    await setForgotPasswordOtp(to, otp);

    return info;
  } catch (error) {
    throw error;
  }
};

// 🔒 FIXED: Changed from organic_farmer_admin_user → gauswarn_admin_user
exports.findUserByEmail = async (email) => {
  try {
    return await withConnection(async (connection) => {
      const query = `SELECT * FROM gauswarn_admin_user WHERE email = ?`;
      const [rows] = await connection.execute(query, [email]);
      return rows[0] || null;
    });
  } catch (error) {
    throw error;
  }
};

// 🔒 FIXED: Changed from organic_farmer_admin_user → gauswarn_admin_user
exports.findUserOTP = async (otp) => {
  try {
    return await withConnection(async (connection) => {
      const query = `SELECT * FROM gauswarn_admin_user WHERE otp = ?`;
      const [rows] = await connection.execute(query, [otp]);
      return rows[0] || null;
    });
  } catch (error) {
    throw error;
  }
};

// 🔒 FIXED: Changed from organic_farmer_admin_user → gauswarn_admin_user
exports.resetPassword = async (email, otp, hashedPassword) => {
  try {
    return await withConnection(async (connection) => {
      const query = `UPDATE gauswarn_admin_user SET password = ? ,otp = NULL WHERE email = ? AND otp = ?`;
      const [rows] = await connection.execute(query, [
        hashedPassword,
        email,
        otp,
      ]);
      if (rows.affectedRows > 0) {
        return { message: "Password reset sucessfully" };
      }
    });
  } catch (error) {
    throw error;
  }
};

// 🔒 FIXED: Changed from organic_farmer_admin_user → gauswarn_admin_user
const setForgotPasswordOtp = async (email, otp) => {
  try {
    return await withConnection(async (connection) => {
      const query = `UPDATE gauswarn_admin_user SET otp = ? WHERE email = ?`;
      const [rows] = await connection.execute(query, [otp, email]);
      if (rows.affectedRows > 0) {
        return { message: "save otp sucessfully" };
      }
    });
  } catch (error) {
    throw error;
  }
};
