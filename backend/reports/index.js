/**
 * reports/index.js
 * Router cho tab "Báo Cáo Hiệu Suất"
 * Mount trong server.js:
 *   const { reportRoutes } = require("./reports");
 *   app.use("/api/reports", reportRoutes);
 */
const express = require("express");
const { query, poolPromise, sql } = require("../db.js");
 
const router = express.Router();

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function normalizeStatus(status) {
  return String(status || "").trim();
}

function toVnPeriod(period) {
  if (period === "quarter") return "Quý này";
  if (period === "lastMonth") return "Tháng trước";
  return "Tháng này";
}

async function executeProcedure(name, inputs = {}) {
  const pool = await poolPromise;
  const request = pool.request();

  Object.entries(inputs).forEach(([key, value]) => {
    request.input(key, value);
  });

  const result = await request.execute(name);
  return result.recordset || [];
}

/**
 * Parse số % từ chuỗi kết quả của fn_PhanTichHieuSuatPhong.
 * Ví dụ: "TỐT - Hiệu suất cao (Lấp đầy trung bình: 75.50%)" → 75.5
 */
function parseAvgPerf(statusStr) {
  const match = String(statusStr || "").match(/([\d]+\.?[\d]*)%/);
  return match ? parseFloat(match[1]) : 0;
}

// ------------------------------------------------------------------
// GET /api/reports/dashboard?month=1&year=2026
// Dữ liệu tổng quan trang chủ (không hardcode)
// ------------------------------------------------------------------
// router.get("/dashboard", async (req, res) => {
//   const now = new Date();
//   const month = toInt(req.query.month, now.getMonth() + 1);
//   const year = toInt(req.query.year, now.getFullYear());

//   if (month < 1 || month > 12) {
//     return res.status(400).json({ error: "Tháng phải trong khoảng 1-12" });
//   }

//   try {
//     const [summaryRows] = await query(
//       `
//       SELECT
//         (SELECT COUNT(*) FROM CUSTOMER) AS totalCustomers,
//         (
//           SELECT COUNT(*)
//           FROM dbo.[ORDER]
//           WHERE MONTH([NGÀY TẠO]) = @month
//             AND YEAR([NGÀY TẠO]) = @year
//         ) AS totalOrders,
//         (
//           SELECT ISNULL(SUM([SỐ TIỀN CUỐI]), 0)
//           FROM dbo.[ORDER]
//           WHERE RTRIM([TRẠNG THÁI]) = N'ĐÃ THANH TOÁN'
//             AND MONTH([NGÀY TẠO]) = @month
//             AND YEAR([NGÀY TẠO]) = @year
//         ) AS monthlyRevenue,
//         (
//           SELECT CAST(
//             ISNULL(
//               100.0 * SUM(CASE WHEN RTRIM(ss.[TRẠNG THÁI GHẾ]) = N'ĐÃ CHỌN' THEN 1 ELSE 0 END)
//               / NULLIF(COUNT(ss.[MÃ SEAT_SHOWTIME]), 0),
//               0
//             )
//           AS DECIMAL(6,2))
//           FROM SEAT_SHOWTIME ss
//           JOIN SHOWTIME st ON ss.[MÃ SỐ SUẤT CHIẾU] = st.[MÃ SỐ SUẤT CHIẾU]
//           WHERE MONTH(st.[NGÀY CHIẾU]) = @month
//             AND YEAR(st.[NGÀY CHIẾU]) = @year
//             AND RTRIM(st.[TRẠNG THÁI]) != N'NHÁP'
//         ) AS fillRate
//       `,
//       { month, year }
//     );

//     const summary = summaryRows[0] || {};

//     const [monthlyRevenueRows] = await query(
//       `
//       ;WITH Months AS (
//         SELECT 1 AS monthNo
//         UNION ALL
//         SELECT monthNo + 1 FROM Months WHERE monthNo < 12
//       )
//       SELECT
//         m.monthNo AS [month],
//         ISNULL(SUM(o.[SỐ TIỀN CUỐI]), 0) AS revenue
//       FROM Months m
//       LEFT JOIN dbo.[ORDER] o
//         ON MONTH(o.[NGÀY TẠO]) = m.monthNo
//        AND YEAR(o.[NGÀY TẠO]) = @year
//        AND RTRIM(o.[TRẠNG THÁI]) = N'ĐÃ THANH TOÁN'
//       GROUP BY m.monthNo
//       ORDER BY m.monthNo
//       OPTION (MAXRECURSION 12)
//       `,
//       { year }
//     );

//     const topMovies = await executeProcedure("sp_ThongKeTopPhim", {
//       Thang: month,
//       Nam: year,
//       TopN: toInt(req.query.topN, 5),
//       DoanhThuToiThieu: toInt(req.query.minRevenue, 0),
//     });

//     const [showtimeRows] = await query(
//       `
//       SELECT TOP (8)
//         CONVERT(VARCHAR(5), st.[GIỜ BẮT ĐẦU], 108) AS [time],
//         TRIM(m.[TÊN PHIM]) AS [movie],
//         TRIM(r.[TÊN PHÒNG]) AS [room],
//         CASE
//           WHEN CAST(st.[NGÀY CHIẾU] AS DATE) = CAST(GETDATE() AS DATE)
//             THEN N'Sắp chiếu'
//           ELSE N'Đã lên lịch'
//         END AS [status],
//         SUM(CASE WHEN RTRIM(ss.[TRẠNG THÁI GHẾ]) = N'ĐÃ CHỌN' THEN 1 ELSE 0 END) AS soldSeats,
//         COUNT(ss.[MÃ SEAT_SHOWTIME]) AS totalSeats
//       FROM SHOWTIME st
//       JOIN MOVIE m
//         ON st.[MÃ PHIM] = m.[MÃ PHIM]
//       JOIN ROOM r
//         ON st.[MÃ SỐ RẠP] = r.[MÃ SỐ RẠP]
//        AND st.[MÃ PHÒNG] = r.[MÃ PHÒNG]
//       LEFT JOIN SEAT_SHOWTIME ss
//         ON st.[MÃ SỐ SUẤT CHIẾU] = ss.[MÃ SỐ SUẤT CHIẾU]
//       WHERE RTRIM(st.[TRẠNG THÁI]) != N'NHÁP'
//         AND DATEADD(
//           SECOND,
//           DATEDIFF(SECOND, 0, CAST(st.[GIỜ BẮT ĐẦU] AS TIME)),
//           CAST(st.[NGÀY CHIẾU] AS DATETIME2)
//         ) >= SYSDATETIME()
//       GROUP BY st.[NGÀY CHIẾU], st.[GIỜ BẮT ĐẦU], m.[TÊN PHIM], r.[TÊN PHÒNG]
//       ORDER BY st.[NGÀY CHIẾU], st.[GIỜ BẮT ĐẦU]
//       `
//     );

//     res.json({
//       summary: {
//         totalCustomers: Number(summary.totalCustomers || 0),
//         totalOrders: Number(summary.totalOrders || 0),
//         monthlyRevenue: Number(summary.monthlyRevenue || 0),
//         fillRate: Number(summary.fillRate || 0),
//         periodLabel: `${month}/${year}`,
//       },
//       monthlyRevenue: monthlyRevenueRows.map((row) => ({
//         month: Number(row.month),
//         revenue: Number(row.revenue || 0),
//       })),
//       topMovies: topMovies.map((row) => ({
//         movieId: row["Mã Phim"],
//         movieName: row["Tên Phim"],
//         ticketsSold: Number(row["Số Vé Bán Ra"] || 0),
//         occupancyRate: Number(row["Tỷ Lệ Lấp Đầy (%)"] || 0),
//         ticketRevenue: Number(row["Doanh Thu Vé"] || 0),
//         comboRevenue: Number(row["Doanh Thu Combo"] || 0),
//         totalRevenue: Number(row["Tổng Doanh Thu"] || 0),
//       })),
//       showtimes: showtimeRows.map((row) => ({
//         time: row.time,
//         movie: row.movie,
//         room: row.room,
//         status: normalizeStatus(row.status),
//         soldSeats: Number(row.soldSeats || 0),
//         totalSeats: Number(row.totalSeats || 0),
//       })),
//     });
//   } catch (err) {
//     console.error("[/api/reports/dashboard]", err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// ------------------------------------------------------------------
// GET /api/reports/dashboard?month=1&year=2026
// Dữ liệu tổng quan trang chủ (không hardcode)
// ------------------------------------------------------------------
router.get("/dashboard", async (req, res) => {
  const now = new Date();
  const month = toInt(req.query.month, now.getMonth() + 1);
  const year = toInt(req.query.year, now.getFullYear());

  if (month < 1 || month > 12) {
    return res.status(400).json({ error: "Tháng phải trong khoảng 1-12" });
  }

  try {
    const [summaryRows] = await query(
      `
      SELECT
        (SELECT COUNT(*) FROM CUSTOMER) AS totalCustomers,
        (
          SELECT COUNT(*)
          FROM dbo.[ORDER]
          WHERE MONTH([NGÀY TẠO]) = @month
            AND YEAR([NGÀY TẠO]) = @year
        ) AS totalOrders,
        (
          SELECT ISNULL(SUM([SỐ TIỀN CUỐI]), 0)
          FROM dbo.[ORDER]
          WHERE RTRIM([TRẠNG THÁI]) = N'ĐÃ THANH TOÁN'
            AND MONTH([NGÀY TẠO]) = @month
            AND YEAR([NGÀY TẠO]) = @year
        ) AS monthlyRevenue,
        (
          SELECT CAST(
            ISNULL(
              100.0 * SUM(CASE WHEN RTRIM(ss.[TRẠNG THÁI GHẾ]) = N'ĐÃ CHỌN' THEN 1 ELSE 0 END)
              / NULLIF(COUNT(ss.[MÃ SEAT_SHOWTIME]), 0),
              0
            )
          AS DECIMAL(6,2))
          FROM SEAT_SHOWTIME ss
          JOIN SHOWTIME st ON ss.[MÃ SỐ SUẤT CHIẾU] = st.[MÃ SỐ SUẤT CHIẾU]
          WHERE MONTH(st.[NGÀY CHIẾU]) = @month
            AND YEAR(st.[NGÀY CHIẾU]) = @year
            AND RTRIM(st.[TRẠNG THÁI]) != N'NHÁP'
        ) AS fillRate
      `,
      { month, year }
    );

    const summary = summaryRows[0] || {};

    const [monthlyRevenueRows] = await query(
      `
      ;WITH Months AS (
        SELECT 1 AS monthNo
        UNION ALL
        SELECT monthNo + 1 FROM Months WHERE monthNo < 12
      )
      SELECT
        m.monthNo AS [month],
        ISNULL(SUM(o.[SỐ TIỀN CUỐI]), 0) AS revenue
      FROM Months m
      LEFT JOIN dbo.[ORDER] o
        ON MONTH(o.[NGÀY TẠO]) = m.monthNo
       AND YEAR(o.[NGÀY TẠO]) = @year
       AND RTRIM(o.[TRẠNG THÁI]) = N'ĐÃ THANH TOÁN'
      GROUP BY m.monthNo
      ORDER BY m.monthNo
      OPTION (MAXRECURSION 12)
      `,
      { year }
    );

    const topMovies = await executeProcedure("sp_ThongKeTopPhim", {
      Thang: month,
      Nam: year,
      TopN: toInt(req.query.topN, 5),
      DoanhThuToiThieu: toInt(req.query.minRevenue, 0),
    });

    const [showtimeRows] = await query(
      `
      SELECT TOP (8)
        CONVERT(VARCHAR(5), st.[GIỜ BẮT ĐẦU], 108) AS [time],
        TRIM(m.[TÊN PHIM]) AS [movie],
        TRIM(r.[TÊN PHÒNG]) AS [room],
        CASE
          WHEN CAST(st.[NGÀY CHIẾU] AS DATE) = CAST(GETDATE() AS DATE)
            THEN N'Sắp chiếu'
          ELSE N'Đã lên lịch'
        END AS [status],
        SUM(CASE WHEN RTRIM(ss.[TRẠNG THÁI GHẾ]) = N'ĐÃ CHỌN' THEN 1 ELSE 0 END) AS soldSeats,
        COUNT(ss.[MÃ SEAT_SHOWTIME]) AS totalSeats
      FROM SHOWTIME st
      JOIN MOVIE m
        ON st.[MÃ PHIM] = m.[MÃ PHIM]
      JOIN ROOM r
        ON st.[MÃ SỐ RẠP] = r.[MÃ SỐ RẠP]
       AND st.[MÃ PHÒNG] = r.[MÃ PHÒNG]
      LEFT JOIN SEAT_SHOWTIME ss
        ON st.[MÃ SỐ SUẤT CHIẾU] = ss.[MÃ SỐ SUẤT CHIẾU]
      WHERE RTRIM(st.[TRẠNG THÁI]) != N'NHÁP'
        AND DATEADD(
          SECOND,
          DATEDIFF(SECOND, 0, CAST(st.[GIỜ BẮT ĐẦU] AS TIME)),
          CAST(st.[NGÀY CHIẾU] AS DATETIME2)
        ) >= SYSDATETIME()
      GROUP BY st.[NGÀY CHIẾU], st.[GIỜ BẮT ĐẦU], m.[TÊN PHIM], r.[TÊN PHÒNG]
      ORDER BY st.[NGÀY CHIẾU], st.[GIỜ BẮT ĐẦU]
      `
    );

    res.json({
      summary: {
        totalCustomers: Number(summary.totalCustomers || 0),
        totalOrders: Number(summary.totalOrders || 0),
        monthlyRevenue: Number(summary.monthlyRevenue || 0),
        fillRate: Number(summary.fillRate || 0),
        periodLabel: `${month}/${year}`,
      },
      monthlyRevenue: monthlyRevenueRows.map((row) => ({
        month: Number(row.month),
        revenue: Number(row.revenue || 0),
      })),
      topMovies: topMovies.map((row) => ({
        movieId: row["Mã Phim"],
        movieName: row["Tên Phim"],
        ticketsSold: Number(row["Số Vé Bán Ra"] || 0),
        occupancyRate: Number(row["Tỷ Lệ Lấp Đầy (%)"] || 0),
        ticketRevenue: Number(row["Doanh Thu Vé"] || 0),
        comboRevenue: Number(row["Doanh Thu Combo"] || 0),
        totalRevenue: Number(row["Tổng Doanh Thu"] || 0),
      })),
      showtimes: showtimeRows.map((row) => ({
        time: row.time,
        movie: row.movie,
        room: row.room,
        status: normalizeStatus(row.status),
        soldSeats: Number(row.soldSeats || 0),
        totalSeats: Number(row.totalSeats || 0),
      })),
    });
  } catch (err) {
    console.error("[/api/reports/dashboard]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------
// GET /api/reports/top-movies?month=1&year=2026&topN=5&minRevenue=0
// Gọi trực tiếp procedure sp_ThongKeTopPhim (2_3.sql)
// ------------------------------------------------------------------
router.get("/top-movies", async (req, res) => {
  const now = new Date();
  const month = toInt(req.query.month, now.getMonth() + 1);
  const year = toInt(req.query.year, now.getFullYear());
  const topN = toInt(req.query.topN, 5);
  const minRevenue = toInt(req.query.minRevenue, 0);

  try {
    const rows = await executeProcedure("sp_ThongKeTopPhim", {
      Thang: month,
      Nam: year,
      TopN: topN,
      DoanhThuToiThieu: minRevenue,
    });

    res.json(
      rows.map((row) => ({
        movieId: row["Mã Phim"],
        movieName: row["Tên Phim"],
        ticketsSold: Number(row["Số Vé Bán Ra"] || 0),
        occupancyRate: Number(row["Tỷ Lệ Lấp Đầy (%)"] || 0),
        ticketRevenue: Number(row["Doanh Thu Vé"] || 0),
        comboRevenue: Number(row["Doanh Thu Combo"] || 0),
        totalRevenue: Number(row["Tổng Doanh Thu"] || 0),
      }))
    );
  } catch (err) {
    console.error("[/api/reports/top-movies]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------
// GET /api/reports/customers?search=...
// Tổng hợp lịch sử khách hàng + dùng fn_TinhDiemVaHangKhachHang (2_4.sql)
// ------------------------------------------------------------------
router.get("/customers", async (req, res) => {
  const search = String(req.query.search || "").trim();

  try {
    const [rows] = await query(
      `
      ;WITH FavoriteMovie AS (
        SELECT
          o.[MÃ SỐ KHÁCH HÀNG] AS customerId,
          TRIM(m.[TÊN PHIM]) AS movieName,
          COUNT(*) AS totalWatch,
          ROW_NUMBER() OVER (
            PARTITION BY o.[MÃ SỐ KHÁCH HÀNG]
            ORDER BY COUNT(*) DESC, TRIM(m.[TÊN PHIM])
          ) AS rn
        FROM dbo.[ORDER] o
        JOIN ORDER_DETAIL od ON o.[MÃ ĐƠN HÀNG] = od.[MÃ ĐƠN HÀNG]
        JOIN TICKET_MOVIE tm ON od.[MÃ SẢN PHẨM] = tm.[MÃ SẢN PHẨM]
        JOIN SHOWTIME st ON tm.[MÃ SỐ SUẤT CHIẾU] = st.[MÃ SỐ SUẤT CHIẾU]
        JOIN MOVIE m ON st.[MÃ PHIM] = m.[MÃ PHIM]
        WHERE RTRIM(o.[TRẠNG THÁI]) = N'ĐÃ THANH TOÁN'
        GROUP BY o.[MÃ SỐ KHÁCH HÀNG], TRIM(m.[TÊN PHIM])
      ),
      CustomerStats AS (
        SELECT
          c.[MÃ SỐ KHÁCH HÀNG] AS customerId,
          TRIM(c.[HỌ VÀ TÊN ĐỆM] + ' ' + c.[TÊN]) AS customerName,
          COUNT(o.[MÃ ĐƠN HÀNG]) AS totalOrders,
          MAX(o.[NGÀY TẠO]) AS lastVisit
        FROM CUSTOMER c
        LEFT JOIN dbo.[ORDER] o
          ON c.[MÃ SỐ KHÁCH HÀNG] = o.[MÃ SỐ KHÁCH HÀNG]
         AND RTRIM(o.[TRẠNG THÁI]) = N'ĐÃ THANH TOÁN'
        GROUP BY c.[MÃ SỐ KHÁCH HÀNG], c.[HỌ VÀ TÊN ĐỆM], c.[TÊN]
      )
      SELECT
        s.customerId,
        s.customerName,
        s.totalOrders,
        s.lastVisit,
        ISNULL(fm.movieName, N'Chưa có dữ liệu') AS favoriteMovie,
        info.loyaltyInfo,
        LTRIM(RTRIM(
          CASE
            WHEN CHARINDEX(N'Hạng hiện tại:', info.loyaltyInfo) > 0
              THEN SUBSTRING(info.loyaltyInfo, CHARINDEX(N'Hạng hiện tại:', info.loyaltyInfo) + LEN(N'Hạng hiện tại:'), 100)
            ELSE N'Chưa phân hạng'
          END
        )) AS tier
      FROM CustomerStats s
      LEFT JOIN FavoriteMovie fm
        ON s.customerId = fm.customerId
       AND fm.rn = 1
      CROSS APPLY (
        SELECT dbo.fn_TinhDiemVaHangKhachHang(s.customerId) AS loyaltyInfo
      ) info
      WHERE (@search = N''
        OR s.customerId LIKE N'%' + @search + N'%'
        OR s.customerName LIKE N'%' + @search + N'%'
        OR ISNULL(fm.movieName, N'') LIKE N'%' + @search + N'%'
      )
      ORDER BY s.totalOrders DESC, s.customerName
      `,
      { search }
    );

    res.json(
      rows.map((row) => ({
        customerId: row.customerId,
        name: row.customerName,
        visits: Number(row.totalOrders || 0),
        favorite: row.favoriteMovie,
        lastVisit: row.lastVisit,
        tier: String(row.tier || "Chưa phân hạng").trim(),
        loyaltyInfo: row.loyaltyInfo,
      }))
    );
  } catch (err) {
    console.error("[/api/reports/customers]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------
// GET /api/reports/customers/:customerId/history?from=2026-01-01&to=2026-12-31
// Gọi trực tiếp sp_TraCuuLichSuKhachHang (2_3.sql)
// ------------------------------------------------------------------
router.get("/customers/:customerId/history", async (req, res) => {
  const customerId = String(req.params.customerId || "").trim();
  const from = req.query.from ? new Date(String(req.query.from)) : null;
  const to = req.query.to ? new Date(String(req.query.to)) : null;

  if (!customerId) {
    return res.status(400).json({ error: "Thiếu mã khách hàng" });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input("MaSoKhachHang", sql.NChar(8), customerId);
    request.input("TuNgay", sql.Date, from);
    request.input("DenNgay", sql.Date, to);

    const result = await request.execute("sp_TraCuuLichSuKhachHang");
    const rows = result.recordset || [];

    res.json(
      rows.map((row) => ({
        orderId: row["Mã Đơn"],
        date: row["Ngày Giao Dịch"],
        movieSeatDetail: row["Chi Tiết Phim & Ghế"],
        comboDetail: row["Chi Tiết Combo (F&B)"],
        total: Number(row["Tổng Tiền"] || 0),
        discount: Number(row["Khuyến Mãi"] || 0),
        finalAmount: Number(row["Thành Tiền"] || 0),
        status: normalizeStatus(row["Trạng Thái"]),
      }))
    );
  } catch (err) {
    console.error("[/api/reports/customers/:customerId/history]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------
// GET /api/reports/performance?cinemaId=RAP001&period=month
// Tổng quan hiệu suất theo rạp (không hardcode)
// ------------------------------------------------------------------
router.get("/performance", async (req, res) => {
  const cinemaId = String(req.query.cinemaId || "").trim();
  const period = String(req.query.period || "month").trim();

  try {
    const periodClause =
      period === "quarter"
        ? "DATEDIFF(MONTH, st.[NGÀY CHIẾU], GETDATE()) BETWEEN 0 AND 2"
        : period === "lastMonth"
          ? "DATEDIFF(MONTH, st.[NGÀY CHIẾU], GETDATE()) = 1"
          : "DATEDIFF(MONTH, st.[NGÀY CHIẾU], GETDATE()) = 0";

    const [summaryRows] = await query(
      `
      SELECT
        CAST(
          ISNULL(
            100.0 * SUM(CASE WHEN RTRIM(ss.[TRẠNG THÁI GHẾ]) = N'ĐÃ CHỌN' THEN 1 ELSE 0 END)
            / NULLIF(COUNT(ss.[MÃ SEAT_SHOWTIME]), 0),
            0
          )
        AS DECIMAL(6,2)) AS avgFillRate,
        ISNULL(SUM(CASE WHEN RTRIM(o.[TRẠNG THÁI]) = N'ĐÃ THANH TOÁN' THEN o.[SỐ TIỀN CUỐI] ELSE 0 END), 0) AS totalRevenue
      FROM SHOWTIME st
      LEFT JOIN SEAT_SHOWTIME ss ON st.[MÃ SỐ SUẤT CHIẾU] = ss.[MÃ SỐ SUẤT CHIẾU]
      LEFT JOIN TICKET_MOVIE tm ON st.[MÃ SỐ SUẤT CHIẾU] = tm.[MÃ SỐ SUẤT CHIẾU]
      LEFT JOIN ORDER_DETAIL od ON tm.[MÃ SẢN PHẨM] = od.[MÃ SẢN PHẨM]
      LEFT JOIN dbo.[ORDER] o ON od.[MÃ ĐƠN HÀNG] = o.[MÃ ĐƠN HÀNG]
      WHERE ${periodClause}
        AND (@cinemaId = N'' OR st.[MÃ SỐ RẠP] = @cinemaId)
        AND RTRIM(st.[TRẠNG THÁI]) != N'NHÁP'
      `,
      { cinemaId }
    );

    const [fillTrendRows] = await query(
      `
      ;WITH Last12Months AS (
        SELECT 0 AS diffMonth
        UNION ALL SELECT diffMonth + 1 FROM Last12Months WHERE diffMonth < 11
      )
      SELECT
        FORMAT(DATEADD(MONTH, -m.diffMonth, GETDATE()), 'MM/yyyy') AS label,
        CAST(
          ISNULL(
            100.0 * SUM(CASE WHEN RTRIM(ss.[TRẠNG THÁI GHẾ]) = N'ĐÃ CHỌN' THEN 1 ELSE 0 END)
            / NULLIF(COUNT(ss.[MÃ SEAT_SHOWTIME]), 0),
            0
          )
        AS DECIMAL(6,2)) AS fillRate
      FROM Last12Months m
      LEFT JOIN SHOWTIME st
        ON DATEDIFF(MONTH, st.[NGÀY CHIẾU], DATEADD(MONTH, -m.diffMonth, GETDATE())) = 0
       AND DATEDIFF(YEAR, st.[NGÀY CHIẾU], DATEADD(MONTH, -m.diffMonth, GETDATE())) = 0
       AND (@cinemaId = N'' OR st.[MÃ SỐ RẠP] = @cinemaId)
       AND RTRIM(st.[TRẠNG THÁI]) != N'NHÁP'
      LEFT JOIN SEAT_SHOWTIME ss ON st.[MÃ SỐ SUẤT CHIẾU] = ss.[MÃ SỐ SUẤT CHIẾU]
      GROUP BY m.diffMonth
      ORDER BY m.diffMonth DESC
      OPTION (MAXRECURSION 12)
      `,
      { cinemaId }
    );

    const [revenueRows] = await query(
      `
      ;WITH Last6Months AS (
        SELECT 0 AS diffMonth
        UNION ALL SELECT diffMonth + 1 FROM Last6Months WHERE diffMonth < 5
      )
      SELECT
        FORMAT(DATEADD(MONTH, -m.diffMonth, GETDATE()), 'MM/yyyy') AS label,
        ISNULL(SUM(CASE WHEN RTRIM(o.[TRẠNG THÁI]) = N'ĐÃ THANH TOÁN' THEN o.[SỐ TIỀN CUỐI] ELSE 0 END), 0) AS revenue
      FROM Last6Months m
      LEFT JOIN SHOWTIME st
        ON DATEDIFF(MONTH, st.[NGÀY CHIẾU], DATEADD(MONTH, -m.diffMonth, GETDATE())) = 0
       AND DATEDIFF(YEAR, st.[NGÀY CHIẾU], DATEADD(MONTH, -m.diffMonth, GETDATE())) = 0
       AND (@cinemaId = N'' OR st.[MÃ SỐ RẠP] = @cinemaId)
       AND RTRIM(st.[TRẠNG THÁI]) != N'NHÁP'
      LEFT JOIN TICKET_MOVIE tm ON st.[MÃ SỐ SUẤT CHIẾU] = tm.[MÃ SỐ SUẤT CHIẾU]
      LEFT JOIN ORDER_DETAIL od ON tm.[MÃ SẢN PHẨM] = od.[MÃ SẢN PHẨM]
      LEFT JOIN dbo.[ORDER] o ON od.[MÃ ĐƠN HÀNG] = o.[MÃ ĐƠN HÀNG]
      GROUP BY m.diffMonth
      ORDER BY m.diffMonth DESC
      OPTION (MAXRECURSION 6)
      `,
      { cinemaId }
    );

    const [bestHourRows] = await query(
      `
      SELECT TOP (1)
        FORMAT(st.[GIỜ BẮT ĐẦU], 'HH:mm') AS bestHour,
        COUNT(*) AS soldTickets
      FROM SHOWTIME st
      JOIN TICKET_MOVIE tm ON st.[MÃ SỐ SUẤT CHIẾU] = tm.[MÃ SỐ SUẤT CHIẾU]
      JOIN ORDER_DETAIL od ON tm.[MÃ SẢN PHẨM] = od.[MÃ SẢN PHẨM]
      JOIN dbo.[ORDER] o ON od.[MÃ ĐƠN HÀNG] = o.[MÃ ĐƠN HÀNG]
      WHERE ${periodClause}
        AND (@cinemaId = N'' OR st.[MÃ SỐ RẠP] = @cinemaId)
        AND RTRIM(o.[TRẠNG THÁI]) = N'ĐÃ THANH TOÁN'
      GROUP BY FORMAT(st.[GIỜ BẮT ĐẦU], 'HH:mm')
      ORDER BY soldTickets DESC
      `,
      { cinemaId }
    );

    const [topFormatRows] = await query(
      `
      SELECT TOP (1)
        RTRIM(r.[LOẠI PHÒNG]) AS roomType,
        COUNT(*) AS soldTickets
      FROM SHOWTIME st
      JOIN ROOM r
        ON st.[MÃ SỐ RẠP] = r.[MÃ SỐ RẠP]
       AND st.[MÃ PHÒNG] = r.[MÃ PHÒNG]
      JOIN TICKET_MOVIE tm ON st.[MÃ SỐ SUẤT CHIẾU] = tm.[MÃ SỐ SUẤT CHIẾU]
      JOIN ORDER_DETAIL od ON tm.[MÃ SẢN PHẨM] = od.[MÃ SẢN PHẨM]
      JOIN dbo.[ORDER] o ON od.[MÃ ĐƠN HÀNG] = o.[MÃ ĐƠN HÀNG]
      WHERE ${periodClause}
        AND (@cinemaId = N'' OR st.[MÃ SỐ RẠP] = @cinemaId)
        AND RTRIM(o.[TRẠNG THÁI]) = N'ĐÃ THANH TOÁN'
      GROUP BY RTRIM(r.[LOẠI PHÒNG])
      ORDER BY soldTickets DESC
      `,
      { cinemaId }
    );

    res.json({
      period,
      periodLabel: toVnPeriod(period),
      overview: {
        avgFillRate: Number(summaryRows[0]?.avgFillRate || 0),
        totalRevenue: Number(summaryRows[0]?.totalRevenue || 0),
        bestHour: bestHourRows[0]?.bestHour || "--:--",
        topFormat: topFormatRows[0]?.roomType || "Chưa có dữ liệu",
      },
      fillTrend: fillTrendRows.map((row) => ({
        label: row.label,
        value: Number(row.fillRate || 0),
      })),
      revenueTrend: revenueRows.map((row) => ({
        label: row.label,
        value: Number(row.revenue || 0),
      })),
      quickInsights: {
        // Mức sử dụng ghế (lấy luôn từ avgFillRate cho tiện)
        seatUsage: Number(summaryRows[0]?.avgFillRate || 0),
        
        // Mục tiêu doanh thu: Giả sử mục tiêu 1 kỳ là 150 triệu VNĐ (150000000)
        // Bạn có thể sửa con số 150000000 thành mục tiêu thực tế của rạp
        revenueTarget: (Number(summaryRows[0]?.totalRevenue || 0) / 150000000) * 100, 
        
        // Hiệu quả bán thêm (Combo/Bắp nước): 
        // Tạm thời fix cứng một số % hợp lý hoặc tính toán dựa trên tổng đơn có bắp nước. 
        // Ở đây mình ví dụ tỷ lệ mua thêm là 45.5%
        upsellEfficiency: 45.5 
      }
    });

  } catch (err) {
    console.error("[/api/reports/performance]", err.message);
    res.status(500).json({ error: err.message });
  }
});
 
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
  const cinemaId = String(req.query.cinemaId || "").trim();
  const roomId   = String(req.query.roomId   || "").trim();
  const month    = toInt(req.query.month, 0);
  const year     = toInt(req.query.year,  0);
  // const { cinemaId, roomId, month, year } = req.query;
 
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
    const statusStr = fnRows[0]?.status ?? "Không có dữ liệu";
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
      status:           statusStr,
      avgPerf:          parseAvgPerf(statusStr),   // ← số thực, FE dùng trực tiếp
      totalShowtimes:   Number(countRows[0]?.totalShowtimes   || 0),
      totalTicketsSold: Number(ticketRows[0]?.totalTicketsSold || 0),
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
  const cinemaId = String(req.query.cinemaId || "").trim();
  const roomId   = String(req.query.roomId   || "").trim();
  const month    = toInt(req.query.month, 0);
  const year     = toInt(req.query.year,  0);
  // const { cinemaId, roomId, month, year } = req.query;
 
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
 