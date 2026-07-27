const asyncHandler = require("express-async-handler");
const forgotPasswordModal = require("../../../model/users/rajlaxmi/forgotPasswordModel");
const bcrypt = require("bcryptjs");

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { user_email } = req.body;
  const hostname = req.hostname;
  try {
    const user = await forgotPasswordModal.findUserByEmail(user_email);
    if (!user) {
      return res.json({ message: "Email not found" });
    }
    // console.log(user)

    const otp = await forgotPasswordModal.sendOTPEmail(
      user?.user_email,
      hostname
    );
    
    res.json({ message: "OTP sent your email successfully."});
  } catch (error) {
    res.json({ message: "Server error" , error });
    // throw error;
  }
});



// //   Re-set password
exports.passwordReset = asyncHandler(async (req, res) => {
  const { otp, newPassword } = req.body;


// Validation: Check if newPassword 
if (!newPassword) {
  return res.json({ message: "New password is required" });
}

const reset = await forgotPasswordModal.findUserOTP(otp);
if (!reset) {
  return res.json({ message: "OTP does not found" });
}
try {
    //check otp same or not
    if (reset.otp !== otp) {
      return res.json({ message: "OTP does not same" });
    }

    // Hash the new password before saving it
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    await forgotPasswordModal.resetPassword(reset.otp, hashedPassword);


    // await user.save();
    res.json({ message: "password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
