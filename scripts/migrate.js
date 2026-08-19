require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { withConnection } = require("../utils/helper");

const migrations = [
  {
    name: "paymentDetails",
    sql: "ALTER TABLE gauswarn_payment ADD COLUMN IF NOT EXISTS paymentDetails LONGTEXT DEFAULT NULL",
  },
  {
    name: "razorpay_payment_id",
    sql: "ALTER TABLE gauswarn_payment ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100) DEFAULT NULL",
  },
  {
    name: "cart_data",
    sql: "ALTER TABLE gauswarn_payment ADD COLUMN IF NOT EXISTS cart_data LONGTEXT DEFAULT NULL",
  },
  {
    name: "coupon_code",
    sql: "ALTER TABLE gauswarn_payment ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(100) DEFAULT NULL",
  },
  {
    name: "discount_amount",
    sql: "ALTER TABLE gauswarn_payment ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0.00",
  },
  {
    name: "final_payable_amount",
    sql: "ALTER TABLE gauswarn_payment ADD COLUMN IF NOT EXISTS final_payable_amount DECIMAL(10,2) DEFAULT NULL",
  },
];

async function runMigrations() {
  console.log("🚀 Running gauswarn_payment migrations...\n");

  for (const migration of migrations) {
    try {
      await withConnection((conn) => conn.execute(migration.sql));
      console.log(`  ✅ Column '${migration.name}' — OK`);
    } catch (err) {
      // MySQL 5.x doesn't support IF NOT EXISTS for ALTER TABLE
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log(`  ⏭️  Column '${migration.name}' — already exists, skipped`);
      } else {
        console.error(`  ❌ Column '${migration.name}' — FAILED: ${err.message}`);
        process.exit(1);
      }
    }
  }

  // Verify final schema
  const [rows] = await withConnection((conn) =>
    conn.execute("DESCRIBE gauswarn_payment")
  );
  const columns = rows.map((r) => r.Field);

  console.log("\n📋 Current gauswarn_payment columns:");
  columns.forEach((c) => console.log(`    - ${c}`));
  console.log("\n🎉 Migration complete!\n");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
