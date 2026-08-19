const express = require("express");
const bodyParser = require("body-parser");
const compression = require("compression");
const usersRoutes = require("./routes/users/gauswarn/usersRoutes");
const adminRoutes = require("./routes/admin/adminRoutes");
const rajlaxmiRoutes = require("./routes/users/rajlaxmi/rajlaxmiRoutes");
const visitorRoutes = require("./routes/users/gauswarn/visitorRoutes");
const { errorHandler } = require("./middlewares/errorHandler");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const app = express();

const port = process.env.PORT || 4000;
const {
  exportTableToExcel,
  exportTableByMonthToExcel,
} = require("./controllers/users/gauswarn/excelController");
const fs = require("fs");
const { connectToDatabase } = require("./config/dbConnection");
const metaFeedRoute = require("./routes/users/gauswarn/metaFeed");
const { default: axios } = require("axios");

// Middlewares
app.use(compression()); // Gzip compression — base64 responses ko compress karega

// ⚠️ Razorpay webhook needs RAW body for HMAC signature verification.
// Must be registered BEFORE express.json() so the raw bytes are preserved.
app.use("/users/webhook/razorpay", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 🔒 CORS — only allow your frontend domains
const allowedOrigins = [
  "https://admin.gauswarn.com",
  "https://gauswarn.com",
  "https://www.gauswarn.com",
  "http://localhost:3000",
  "http://localhost:3001",
];
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc in dev)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

// Routes
app.use("/users", usersRoutes);

app.use("/admin", adminRoutes);

app.use("/rajlaxmi", rajlaxmiRoutes);

app.use("/", metaFeedRoute);

app.use("/api", visitorRoutes);

app.get("/api/branded-content", async (req, res) => {
  try {
    const response = await axios.get(
      "https://graph.facebook.com/v25.0/branded_content_search",
      {
        params: {
          ig_username: "gauswarn", // required OR page_url
          creation_date_min: "2024-01-01",
          creation_date_max: "2026-01-01",
          access_token: process.env.FB_TOKEN,
        },
        timeout: 5000,
      },
    );

    return res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    // Error logged silently

    return res.status(500).json({
      success: false,
      message: "Failed to fetch branded content",
      error: error.response?.data || "Internal Server Error",
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// =============================================
// Auto Migration — columns ko LONGTEXT mein change karo (ek baar)
// =============================================
async function runMigrations() {
  let connection;
  try {
    connection = await connectToDatabase();

    const migrations = [
      {
        table: "gauswarn_home_banners",
        columns: ["banner1", "banner2", "banner3", "banner4"],
      },
      {
        table: "gauswarn_product",
        columns: ["product_images"],
      },
      {
        table: "rajlaxmi_product",
        columns: ["product_image"],
      },
    ];

    for (const { table, columns } of migrations) {
      // Check if table exists
      const [tables] = await connection.execute(
        `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [table]
      );

      if (tables.length === 0) {
        console.log(`⚠️  Migration skip: Table '${table}' not found`);
        continue;
      }

      for (const col of columns) {
        // Check current column type
        const [colInfo] = await connection.execute(
          `SELECT DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [table, col]
        );

        if (colInfo.length === 0) {
          console.log(`⚠️  Migration skip: Column '${col}' not found in '${table}'`);
          continue;
        }

        if (colInfo[0].DATA_TYPE === "longtext") {
          // Already migrated, skip
          continue;
        }

        // Alter column to LONGTEXT
        await connection.execute(
          `ALTER TABLE \`${table}\` MODIFY COLUMN \`${col}\` LONGTEXT NULL`
        );
        console.log(`✅ Migration: ${table}.${col} → LONGTEXT`);
      }
    }

    console.log("✅ Database migrations complete");
  } catch (err) {
    console.error("⚠️  Migration error (non-fatal):", err.message);
    // Non-fatal — server will still start
  } finally {
    if (connection) connection.end();
  }
}

// Start the server
async function startServer() {
  try {
    await connectToDatabase();
    await runMigrations();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    process.exit(1);
  }
}
startServer();

// Route to export a table to an Excel file

app.get("/download/:tableName", async (req, res) => {
  const { tableName } = req.params;
  // const tableName = `organic_farmer_table_payment`

  try {
    // Export the table to an Excel file
    const filePath = await exportTableToExcel(tableName);

    // Send the file for download
    res.download(filePath, `${tableName}.csv`, (err) => {
      if (err) {
        res.status(500).send("Error downloading the file.");
      }

      // Optional: Remove the file after sending it
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err.message);
      });
    });
  } catch (error) {
    res.status(500).send("Error exporting the table to Excel.");
  }
});
