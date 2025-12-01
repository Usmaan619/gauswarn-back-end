const multer = require("multer");

const storage = multer.memoryStorage(); // Important for buffer upload

module.exports = multer({ storage });
