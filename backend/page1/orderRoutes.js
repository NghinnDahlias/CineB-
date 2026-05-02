/**
 * PAGE 1 — REST khớp frontend src/page1/orderApi.js (base path /api/orders).
 * Mount trong server.js: app.use("/api/orders", orderRoutes).
 */
const express = require("express");
const orderService = require("./orderService.js");

const router = express.Router();

/** GET — đọc bảng ORDER (phục vụ UI) */
router.get("/", async (req, res) => {
  try {
    const rows = await orderService.listOrders();
    res.json(rows);
  } catch (err) {
    console.error("GET /api/orders error:", err);
    res.status(500).json({ ok: false, error: err.message || "Lỗi server" });
  }
});

/**
 * POST — INSERT
 * Đã xóa validation ở Backend để nhấn mạnh vai trò kiểm tra của Database.
 */
router.post("/", async (req, res) => {
  try {
    const { customerId } = req.body;
    const maKhachHang = String(customerId ?? "").trim();
    
    await orderService.insertOrder({
      maKhachHang
    });
    
    res.status(201).json({ ok: true, message: "✅ Thêm đơn hàng thành công" });
  } catch (err) {
    console.error("❌ POST /api/orders error:", err);
    res.status(400).json({ 
      ok: false, 
      error: err.message || "Lỗi thêm đơn hàng" 
    });
  }
});

/**
 * PATCH — UPDATE
 * Đã xóa validation ở Backend để nhấn mạnh vai trò kiểm tra của Database.
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
    
    res.json({ ok: true, message: "✅ Cập nhật đơn hàng thành công" });
  } catch (err) {
    console.error("❌ PATCH /api/orders/:orderId error:", err);
    res.status(400).json({ 
      ok: false, 
      error: err.message || "Lỗi cập nhật đơn hàng" 
    });
  }
});

/** 
 * DELETE — EXEC sp_XoaOrder 
 * Đã xóa validation ở Backend để nhấn mạnh vai trò kiểm tra của Database.
 */
router.delete("/:orderId", async (req, res) => {
  try {
    const orderId = String(req.params.orderId ?? "").trim();
    await orderService.deleteOrder(orderId);
    res.json({ ok: true, message: "✅ Xóa đơn hàng thành công" });
  } catch (err) {
    console.error("❌ DELETE /api/orders/:orderId error:", err);
    res.status(400).json({ 
      ok: false, 
      error: err.message || "Lỗi xóa đơn hàng" 
    });
  }
});

/** GET — danh sách mã khuyến mãi */
router.get("/promotions", async (req, res) => {
  try {
    const rows = await orderService.listPromotions();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** GET — danh sách chi tiết đơn hàng */
router.get("/:orderId/details", async (req, res) => {
  try {
    const orderId = String(req.params.orderId ?? "").trim();
    const rows = await orderService.getOrderDetails(orderId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
