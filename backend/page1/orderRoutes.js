/**
 * PAGE 1 — REST khớp frontend src/page1/orderApi.js (base path /api/orders).
 * Mount trong server.js: app.use("/api/orders", orderRoutes).
 */
const express = require("express");
const orderService = require("./orderService.js");

const router = express.Router();

/** GET — đọc bảng ORDER (phục vụ UI; không nằm trong SQLQueryTask2.1) */
// router.get("/", async (req, res) => {
//   try {
//     const rows = await orderService.listOrders();
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ ok: false, error: err.message });
//   }
// });
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
 * body: { customerId, total, discount }  → sp_ThemOrder @MaKhachHang, @TongTien, @SoTienGiam
 */
// router.post("/", async (req, res) => {
//   try {
//     const { customerId } = req.body;
//     await orderService.insertOrder({
//       maKhachHang: String(customerId ?? "").trim(),
//     });
//     res.status(201).json({ ok: true });
//   } catch (err) {
//     res.status(400).json({ ok: false, error: err.message });
//   }
// });
/**
 * POST — INSERT
 * body: { customerId }  → sp_ThemOrder @MaKhachHang
 * 
 * ⚠️ FIX: Validate customerId (bắt buộc, max 8 ký tự)
 */
router.post("/", async (req, res) => {
  try {
    const { customerId } = req.body;
    
    // Validate
    const maKhachHang = String(customerId ?? "").trim();
    if (!maKhachHang) {
      return res.status(400).json({ 
        ok: false, 
        error: "Mã khách hàng là bắt buộc (VD: C0000001)" 
      });
    }
    if (maKhachHang.length > 8) {
      return res.status(400).json({ 
        ok: false, 
        error: "Mã khách hàng tối đa 8 ký tự" 
      });
    }
 
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
 * body: { total?, discount?, status? }  → sp_CapNhatOrder (NULL = giữ nguyên)
 */
// router.patch("/:orderId", async (req, res) => {
//   try {
//     const orderId = String(req.params.orderId ?? "").trim();
//     const { status, promoCode } = req.body;
//     const trangThai =
//       status === undefined || status === null || String(status).trim() === ""
//         ? null
//         : String(status).trim();
//     const maKhuyenMai =
//       promoCode === undefined || promoCode === null || String(promoCode).trim() === ""
//         ? null
//         : String(promoCode).trim();
//     await orderService.updateOrder({
//       maDonHang: orderId,
//       trangThai,
//       maKhuyenMai
//     });
//     res.json({ ok: true });
//   } catch (err) {
//     res.status(400).json({ ok: false, error: err.message });
//   }
// });
router.patch("/:orderId", async (req, res) => {
  try {
    const orderId = String(req.params.orderId ?? "").trim();
    if (!orderId) {
      return res.status(400).json({ 
        ok: false, 
        error: "Mã đơn hàng là bắt buộc" 
      });
    }
    if (orderId.length > 6) {
      return res.status(400).json({ 
        ok: false, 
        error: "Mã đơn hàng tối đa 6 ký tự" 
      });
    }
 
    const { status, promoCode } = req.body;
    
    // Convert undefined/null/empty to null
    const trangThai =
      status === undefined || status === null || String(status).trim() === ""
        ? null
        : String(status).trim();
    
    const maKhuyenMai =
      promoCode === undefined || promoCode === null || String(promoCode).trim() === ""
        ? null
        : String(promoCode).trim();
 
    // Validate status nếu có
    if (trangThai && trangThai.length > 15) {
      return res.status(400).json({ 
        ok: false, 
        error: "Trạng thái tối đa 15 ký tự" 
      });
    }
 
    // Validate promoCode nếu có
    if (maKhuyenMai && maKhuyenMai.length > 4) {
      return res.status(400).json({ 
        ok: false, 
        error: "Mã khuyến mãi tối đa 4 ký tự" 
      });
    }
 
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
 

/** DELETE — EXEC sp_XoaOrder */
// router.delete("/:orderId", async (req, res) => {
//   try {
//     const orderId = String(req.params.orderId ?? "").trim();
//     await orderService.deleteOrder(orderId);
//     res.json({ ok: true });
//   } catch (err) {
//     res.status(400).json({ ok: false, error: err.message });
//   }
// });
router.delete("/:orderId", async (req, res) => {
  try {
    const orderId = String(req.params.orderId ?? "").trim();
    if (!orderId) {
      return res.status(400).json({ 
        ok: false, 
        error: "Mã đơn hàng là bắt buộc" 
      });
    }
    if (orderId.length > 6) {
      return res.status(400).json({ 
        ok: false, 
        error: "Mã đơn hàng tối đa 6 ký tự" 
      });
    }
 
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

module.exports = router;
