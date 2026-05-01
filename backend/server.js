/**
 * Entry Express — dùng chung: CORS, JSON, /api/health.
 * Page 1: app.use("/api/orders", …) từ ./page1 (ORDER).
 * Page 2/3: thêm app.use("/api/...", require("./page2/...")) tương tự; không gộp logic vào đây.
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { query } = require("./db.js");
const { orderRoutes } = require("./page1");
const { reportRoutes } = require("./reports");
const customerApi = require("./customerApi.js");

const sql = require('mssql');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT DB_NAME() AS currentDatabase;
    `);
    res.json({ ok: true, database: rows[0]?.currentDatabase ?? null });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use("/api/orders", orderRoutes);
app.use("/api/reports", reportRoutes);

app.use("/api/customers", customerApi);

app.listen(PORT, () => {
  console.log(`\n[CineB backend] http://localhost:${PORT}`);
  console.log("  GET    /api/health");
  console.log("  GET    /api/orders");
  console.log("  POST   /api/orders");
  console.log("  PATCH  /api/orders/:orderId");
  console.log("  DELETE /api/orders/:orderId\n");
});
