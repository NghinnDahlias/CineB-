
// // Xuất ra dưới tên reportRoutes để khớp với file server.js của bạn
// module.exports = { reportRoutes: router };

// File: backend/reports.js (hoặc reportRoute.js)
const express = require("express");
const reportService = require("./reportService.js");

const router = express.Router();

/**
 * GET /api/reports/top-movies
 * Query params:
 *   month    - số tháng (1-12), bỏ trống = all-time
 *   year     - năm (VD: 2026), bỏ trống = all-time
 *   topN     - số phim muốn lấy (mặc định 5)
 *   minRevenue - doanh thu tối thiểu (mặc định 0)
 */
router.get("/top-movies", async (req, res) => {
  try {
    // Nếu frontend không gửi lên hoặc gửi chuỗi rỗng "" → để null (all-time)
    const month = req.query.month ? parseInt(req.query.month) : null;
    const year  = req.query.year  ? parseInt(req.query.year)  : null;

    // FE có thể gửi "topN" hoặc "top", ưu tiên topN
    const topN       = parseInt(req.query.topN || req.query.top) || 5;
    const minRevenue = parseInt(req.query.minRevenue) || 0;

    const data = await reportService.getTopMovies(month, year, topN, minRevenue);
    res.json(data);
  } catch (err) {
    console.error("❌ Lỗi GET /api/reports/top-movies:", err);
    res.status(500).json({ ok: false, error: err.message || "Lỗi lấy thống kê phim" });
  }
});

// Xuất ra dưới tên reportRoutes để khớp với server.js
module.exports = { reportRoutes: router };