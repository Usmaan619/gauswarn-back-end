const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

exports.authMiddleware = (req, res, next) => {
  try {
    const token = req.headers["authorization"] || req.headers["Authorization"];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        // Differentiate between expired and invalid tokens
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Token expired. Please login again.",
          });
        }
        return res.status(403).json({
          success: false,
          message: "Invalid token",
        });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};
