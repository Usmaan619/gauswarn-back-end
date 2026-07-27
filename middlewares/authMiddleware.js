const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

exports.authMiddleware = (req, res, next) => {
  try {
    let token = req.headers["authorization"] || req.headers["Authorization"];
    console.log("==> Incoming Headers:", req.headers);
    console.log("==> Extracted Token before split:", token);

    if (token && token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }
    console.log("==> Final Token after split:", token);

    if (!token) {
      console.log("==> Error: No token provided");
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        console.log("==> JWT Verify Error:", err.message);
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

      console.log("==> JWT Decoded Payload:", decoded);
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
