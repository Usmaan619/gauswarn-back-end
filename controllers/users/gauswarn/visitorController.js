const { withConnection } = require("../../../utils/helper");
const requestIp = require("request-ip");
const UAParser = require("ua-parser-js");
const axios = require("axios");
const asyncHandler = require("express-async-handler");

const trackVisitor = asyncHandler(async (req, res) => {
  const clientIp = requestIp.getClientIp(req);
  const userAgent = req.headers["user-agent"];
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser().name || "Unknown";
  const device = parser.getDevice().type || "Desktop";
  const pageUrl = req.body.page_url || req.headers.referer || "Unknown";

  let city = "Unknown";
  let country = "Unknown";

  // Use a reliable IP for testing if clientIp is local
  const ipToTrack =
    clientIp === "::1" || clientIp === "127.0.0.1" ? "8.8.8.8" : clientIp;

  try {
    const geoResponse = await axios.get(`http://ip-api.com/json/${ipToTrack}`);
    if (geoResponse.data && geoResponse.data.status === "success") {
      city = geoResponse.data.city;
      country = geoResponse.data.country;
    }
  } catch (geoError) {
  }

  try {
    await withConnection(async (connection) => {
      // Check if IP already exists
      const [rows] = await connection.query(
        "SELECT id FROM website_visitors WHERE ip_address = ?",
        [clientIp],
      );

      if (rows.length === 0) {
        // New visitor
        const visitTime = new Date();
        await connection.query(
          "INSERT INTO website_visitors (ip_address, city, country, device, browser, page_url, visit_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [clientIp, city, country, device, browser, pageUrl, visitTime],
        );

        // Trigger WhatsApp Alert
        const whatsappText = `New Website Visitor 🚀\n\nWebsite: gauswarn.com\nIP: ${clientIp}\nCity: ${city}\nDevice: ${device}\nPage: ${pageUrl}\nTime: ${visitTime.toLocaleString()}`;

        const bhashSmsUrl = "http://bhashsms.com/api/sendmsg.php";
        const params = {
          user: process.env.BHASHSMS_USER,
          pass: process.env.BHASHSMS_PASS,
          sender: "BUZWAP",
          phone: process.env.BHASHSMS_PHONE,
          text: whatsappText,
          priority: "wa",
          stype: "normal",
        };

        // Only try to send if credentials are provided
        if (
          process.env.BHASHSMS_USER &&
          process.env.BHASHSMS_USER !== "YOUR_USERNAME"
        ) {
          try {
            await axios.get(bhashSmsUrl, { params });
          } catch (smsError) {
          }
        } else {
        }
      }
    });

    res.status(200).json({ success: true, message: "Visitor tracked" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

const listVisitors = async (req, res) => {
  try {
    const visitors = await getAllVisitors();
    res.json({ success: true, visitors });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteVisitor = async (req, res) => {
  const { id } = req.params;
  try {
    await withConnection(async (connection) => {
      await connection.query("DELETE FROM website_visitors WHERE id = ?", [id]);
    });
    res.json({ success: true, message: "Visitor deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const clearAllVisitors = async (req, res) => {
  try {
    await withConnection(async (connection) => {
      await connection.query("DELETE FROM website_visitors");
    });
    res.json({ success: true, message: "All visitors cleared successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getAllVisitors = async () => {
  return withConnection(async (connection) => {
    const query = "SELECT * FROM website_visitors ORDER BY id DESC";
    const [rows] = await connection.execute(query);
    return rows;
  });
};

module.exports = { trackVisitor, listVisitors, deleteVisitor, clearAllVisitors };
