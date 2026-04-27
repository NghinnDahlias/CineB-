/**
 * reports/index.js
 * Router cho tab "Báo Cáo Hiệu Suất"
 * Mount trong server.js:
 *   const { reportRoutes } = require("./reports");
 *   app.use("/api/reports", reportRoutes);
 */
const express = require("express");
const { query } = require("../db.js");   // dùng chung db pool của project
 
const router = express.Router();
 
// ------------------------------------------------------------------
// GET /api/reports/cinemas
// Trả danh sách rạp đang HOẠT ĐỘNG — dùng cho dropdown Chọn Rạp
// ------------------------------------------------------------------
router.get("/cinemas", async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT [MÃ SỐ RẠP] AS id, [TÊN RẠP] AS name
      FROM   CINEMA
      WHERE  [TRẠNG THÁI] = N'HOẠT ĐỘNG'
      ORDER  BY [MÃ SỐ RẠP]
    `);
    res.json(rows);
  } catch (err) {
    console.error("[/api/reports/cinemas]", err.message);
    res.status(500).json({ error: err.message });
  }
});
 
// ------------------------------------------------------------------
// GET /api/reports/rooms?cinemaId=RAP001
// Trả danh sách phòng theo rạp — dùng cho dropdown Chọn Phòng
// ------------------------------------------------------------------
router.get("/rooms", async (req, res) => {
  const { cinemaId } = req.query;
  if (!cinemaId)
    return res.status(400).json({ error: "Thiếu tham số cinemaId" });
 
  try {
    const [rows] = await query(
      `
      SELECT [MÃ PHÒNG] AS id, [TÊN PHÒNG] AS name
      FROM   ROOM
      WHERE  [MÃ SỐ RẠP] = @cinemaId
        AND  [TRẠNG THÁI] = N'HOẠT ĐỘNG'
      ORDER  BY [MÃ PHÒNG]
      `,
      { cinemaId }
    );
    res.json(rows);
  } catch (err) {
    console.error("[/api/reports/rooms]", err.message);
    res.status(500).json({ error: err.message });
  }
});
 
// ------------------------------------------------------------------
// GET /api/reports/status?cinemaId=RAP001&roomId=P01&month=1&year=2026
// Gọi scalar fn_PhanTichHieuSuatPhong + đếm suất chiếu + vé đã bán
// ------------------------------------------------------------------
router.get("/status", async (req, res) => {
  const { cinemaId, roomId, month, year } = req.query;
 
  if (!cinemaId || !roomId || !month || !year)
    return res
      .status(400)
      .json({ error: "Thiếu tham số: cinemaId, roomId, month, year" });
 
  const m = parseInt(month);
  const y = parseInt(year);
 
  try {
    // 1. Gọi scalar function
    const [fnRows] = await query(
      `SELECT dbo.fn_PhanTichHieuSuatPhong(@cinemaId, @roomId, @month, @year) AS [status]`,
      { cinemaId, roomId, month: m, year: y }
    );
 
    // 2. Đếm suất chiếu trong tháng
    const [countRows] = await query(
      `
      SELECT COUNT(*) AS totalShowtimes
      FROM   SHOWTIME
      WHERE  [MÃ SỐ RẠP]           = @cinemaId
        AND  [MÃ PHÒNG]             = @roomId
        AND  MONTH([NGÀY CHIẾU])    = @month
        AND  YEAR([NGÀY CHIẾU])     = @year
        AND  RTRIM([TRẠNG THÁI])   != N'NHÁP'
      `,
      { cinemaId, roomId, month: m, year: y }
    );
 
    // 3. Đếm tổng ghế ĐÃ CHỌN
    const [ticketRows] = await query(
      `
      SELECT COUNT(*) AS totalTicketsSold
      FROM   SEAT_SHOWTIME  ss
      JOIN   SHOWTIME        st ON ss.[MÃ SỐ SUẤT CHIẾU] = st.[MÃ SỐ SUẤT CHIẾU]
      WHERE  st.[MÃ SỐ RẠP]        = @cinemaId
        AND  st.[MÃ PHÒNG]          = @roomId
        AND  MONTH(st.[NGÀY CHIẾU]) = @month
        AND  YEAR(st.[NGÀY CHIẾU])  = @year
        AND  RTRIM(ss.[TRẠNG THÁI GHẾ]) = N'ĐÃ CHỌN'
      `,
      { cinemaId, roomId, month: m, year: y }
    );
 
    res.json({
      status:           fnRows[0]?.status           ?? "Không có dữ liệu",
      totalShowtimes:   countRows[0]?.totalShowtimes  ?? 0,
      totalTicketsSold: ticketRows[0]?.totalTicketsSold ?? 0,
    });
  } catch (err) {
    console.error("[/api/reports/status]", err.message);
    res.status(500).json({ error: err.message });
  }
});
 
// ------------------------------------------------------------------
// GET /api/reports/details?cinemaId=RAP001&roomId=P01&month=1&year=2026
// Bảng chi tiết suất chiếu + % hiệu suất lấp đầy
// ------------------------------------------------------------------
router.get("/details", async (req, res) => {
  const { cinemaId, roomId, month, year } = req.query;
 
  if (!cinemaId || !roomId || !month || !year)
    return res.status(400).json({ error: "Thiếu tham số" });
 
  const m = parseInt(month);
  const y = parseInt(year);
 
  try {
    const [rows] = await query(
      `
      SELECT
        st.[MÃ SỐ SUẤT CHIẾU]                                       AS id,
        m.[TÊN PHIM]                                                 AS movie,
        CONVERT(NVARCHAR, st.[NGÀY CHIẾU], 103)
          + N' '
          + CONVERT(NVARCHAR, st.[GIỜ BẮT ĐẦU], 108)                AS datetime,
        ISNULL(
          CAST(
            ROUND(
              100.0
              * SUM(CASE WHEN RTRIM(ss.[TRẠNG THÁI GHẾ]) = N'ĐÃ CHỌN' THEN 1 ELSE 0 END)
              / NULLIF(COUNT(ss.[MÃ SỐ GHẾ]), 0),
            0)
          AS INT)
        , 0)                                                         AS perf
      FROM  SHOWTIME st
      JOIN  MOVIE          m  ON st.[MÃ PHIM]            = m.[MÃ PHIM]
      LEFT  JOIN SEAT_SHOWTIME ss ON ss.[MÃ SỐ SUẤT CHIẾU] = st.[MÃ SỐ SUẤT CHIẾU]
      WHERE  st.[MÃ SỐ RẠP]        = @cinemaId
        AND  st.[MÃ PHÒNG]          = @roomId
        AND  MONTH(st.[NGÀY CHIẾU]) = @month
        AND  YEAR(st.[NGÀY CHIẾU])  = @year
        AND  RTRIM(st.[TRẠNG THÁI]) != N'NHÁP'
      GROUP  BY
        st.[MÃ SỐ SUẤT CHIẾU],
        m.[TÊN PHIM],
        st.[NGÀY CHIẾU],
        st.[GIỜ BẮT ĐẦU]
      ORDER  BY st.[NGÀY CHIẾU], st.[GIỜ BẮT ĐẦU]
      `,
      { cinemaId, roomId, month: m, year: y }
    );
    res.json(rows);
  } catch (err) {
    console.error("[/api/reports/details]", err.message);
    res.status(500).json({ error: err.message });
  }
});
 
module.exports = { reportRoutes: router };
 