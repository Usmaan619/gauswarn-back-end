require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { withConnection } = require("../utils/helper");

// Columns to add: { name, type }
const migrations = [
  { name: "paymentDetails",        type: "LONGTEXT DEFAULT NULL" },
  { name: "razorpay_payment_id",   type: "VARCHAR(100) DEFAULT NULL" },
  { name: "cart_data",             type: "LONGTEXT DEFAULT NULL" },
  { name: "coupon_code",           type: "VARCHAR(100) DEFAULT NULL" },
  { name: "discount_amount",       type: "DECIMAL(10,2) DEFAULT 0.00" },
  { name: "final_payable_amount",  type: "DECIMAL(10,2) DEFAULT NULL" },
];

async function columnExists(conn, table, column) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS cnt
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = ?
       AND COLUMN_NAME  = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function runMigrations() {
  console.log("🚀 Running gauswarn_payment migrations...\n");

  for (const { name, type } of migrations) {
    await withConnection(async (conn) => {
      const exists = await columnExists(conn, "gauswarn_payment", name);

      if (exists) {
        console.log(`  ⏭️  Column '${name}' — already exists, skipped`);
        return;
      }

      await conn.execute(
        `ALTER TABLE gauswarn_payment ADD COLUMN \`${name}\` ${type}`
      );
      console.log(`  ✅ Column '${name}' — added`);
    });
  }

  // Show final schema
  const [rows] = await withConnection((conn) =>
    conn.execute("DESCRIBE gauswarn_payment")
  );

  console.log("\n📋 Current gauswarn_payment columns:");
  rows.forEach((r) => console.log(`    - ${r.Field}  (${r.Type})`));
  console.log("\n🎉 Migration complete!\n");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
