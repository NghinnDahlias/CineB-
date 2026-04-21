/**
 * PAGE 1 — REST khớp frontend src/page1/orderApi.js (base path /api/orders).
 * Mount trong server.js: app.use("/api/orders", orderRoutes).
 */
const express = require("express");
const orderService = require("./orderService.js");

const router = express.Router();

/** GET — đọc bảng ORDER (phục vụ UI; không nằm trong SQLQueryTask2.1) */
router.get("/", async (req, res) => {
  try {
    const rows = await orderService.listOrders();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST — INSERT
 * body: { customerId, total, discount }  → sp_ThemOrder @MaKhachHang, @TongTien, @SoTienGiam
 */
router.post("/", async (req, res) => {
  try {
    const { customerId } = req.body;
    await orderService.insertOrder({
      maKhachHang: String(customerId ?? "").trim(),
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * PATCH — UPDATE
 * body: { total?, discount?, status? }  → sp_CapNhatOrder (NULL = giữ nguyên)
 */
router.patch("/:orderId", async (req, res) => {
  try {
    const orderId = String(req.params.orderId ?? "").trim();
    const { status, promoCode } = req.body;
    const trangThai =
      status === undefined || status === null || String(status).trim() === ""
        ? null
        : String(status).trim();
    const maKhuyenMai =
      promoCode === undefined || promoCode === null || String(promoCode).trim() === ""
        ? null
        : String(promoCode).trim();
    await orderService.updateOrder({
      maDonHang: orderId,
      trangThai,
      maKhuyenMai
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/** DELETE — EXEC sp_XoaOrder */
router.delete("/:orderId", async (req, res) => {
  try {
    const orderId = String(req.params.orderId ?? "").trim();
    await orderService.deleteOrder(orderId);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

module.exports = router;
