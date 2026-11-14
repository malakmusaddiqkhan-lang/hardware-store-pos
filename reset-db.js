// reset-db.js
const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const dbPath = path.join(__dirname, "dev.db");
const db = new DatabaseSync(dbPath);

try {
  console.log("🧹 Clearing test data from dev.db...");

  db.exec(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM SaleItem;
    DELETE FROM Sale;
    DELETE FROM Product;
    DELETE FROM Customer;
    DELETE FROM Expense;
    PRAGMA foreign_keys = ON;
  `);

  console.log("✅ All test records cleared successfully!");
  console.log("🔒 Your owner login credentials in the User table remain intact.");
} catch (error) {
  console.error("❌ Error clearing database:", error);
} finally {
  db.close();
}