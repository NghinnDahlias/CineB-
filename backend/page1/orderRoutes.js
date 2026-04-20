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
    const { customerId, total, discount } = req.body;
    const tongTien = Number(total);
    const soTienGiam = Number(discount);
    if (!Number.isFinite(tongTien) || !Number.isFinite(soTienGiam)) {
      res.status(400).json({ ok: false, error: "Tổng tiền và số tiền giảm phải là số hợp lệ." });
      return;
    }
    await orderService.insertOrder({
      maKhachHang: String(customerId ?? "").trim(),
      tongTien,
      soTienGiam
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
    const { total, discount, status } = req.body;

    const tongTien =
      total === undefined || total === null || String(total).trim() === ""
        ? null
        : Number(total);
    const soTienGiam =
      discount === undefined || discount === null || String(discount).trim() === ""
        ? null
        : Number(discount);
    const trangThai =
      status === undefined || status === null || String(status).trim() === ""
        ? null
        : String(status).trim();

    await orderService.updateOrder({
      maDonHang: orderId,
      tongTien: Number.isFinite(tongTien) ? tongTien : null,
      soTienGiam: Number.isFinite(soTienGiam) ? soTienGiam : null,
      trangThai
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
