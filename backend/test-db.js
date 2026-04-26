require("dotenv").config();
const { query } = require("./db.js");

async function main() {
  try {
    const [rows] = await query(`
      SELECT DB_NAME() AS currentDatabase,
             SUSER_SNAME() AS loginName;
    `);
    console.log("Kết nối SQL Server OK.");
    console.log(rows[0]);
    process.exit(0);
  } catch (err) {
    console.error("Kết nối thất bại:", err.message);
    process.exit(1);
  }
}

main();
