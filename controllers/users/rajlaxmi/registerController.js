// controllers/registerController.js
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const registerModel = require("../../../model/users/rajlaxmi/registerModel");

// register
exports.userRegister = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, mobileNumber } = req.body;

  // Validate request data

  if (!firstName || !lastName || !email || !password || !mobileNumber) {
    return res.json({ message: "Please required all fields" });
  }
  try {
    // Check if user already exists (by email)
    const userExistsByEmail = await registerModel.findUserByEmail(email);

    if (userExistsByEmail) {
      return res.json({ success: false, message: "Email already exists" });
    }

    // Check if user already exists (by phone number)
    const userExistsByPhone = await registerModel.findUserByPhone(mobileNumber);

    if (userExistsByPhone) {
      return res.json({
        success: false,
        message: "Phone number already exists",
      });
    }

    // // Generate code based on , firstName(2) , mobile last 4 digit of mobile number
    // let numberString = String(mobileNumber);
    // const code = firstName.slice(0, 4) + numberString.slice(-5);

    // Generate a unique user code (firstName(2-4 letters) + last 4-5 digits of mobile number)
    let numberString = String(mobileNumber);
    const code =
      firstName.slice(0, Math.min(4, firstName.length)) +
      numberString.slice(-Math.min(5, numberString.length));

    // // Hash the password
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the new user object
    const newUser = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      mobileNumber,
      uid: code,
    };

    // Save the new user to the database
    await registerModel.registerUser(newUser);
    res
      .status(201)
      .json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});
