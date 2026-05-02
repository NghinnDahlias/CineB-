/**
 * PAGE 1 — Truy vấn bảng ORDER + gọi sp_ThemOrder, sp_CapNhatOrder, sp_XoaOrder.
 * Chỉ dùng trong ./page1; Page 2/3 tạo service riêng trong thư mục của page.
 */
const sql = require("mssql");
const { poolPromise } = require("../db.js");

/**
 * Helper: Pad string với spaces để khớp với NCHAR(N) trong SQL
 */
function padNChar(str, length) {
  if (!str) str = '';
  const s = String(str).trim();
  return (s + ' '.repeat(length)).substring(0, length);
}

function nullIfEmptyString(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  return v;
}

/** Danh sách đơn (có kèm tên khách hàng) */
async function listOrders() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT
      O.[MÃ ĐƠN HÀNG]      AS orderId,
      O.[MÃ SỐ KHÁCH HÀNG] AS customerId,
      (C.[HỌ VÀ TÊN ĐỆM] + ' ' + C.[TÊN]) AS customerName, 
      O.[TỔNG TIỀN]        AS totalAmount,
      O.[SỐ TIỀN GIẢM]     AS discountAmount,
      O.[SỐ TIỀN CUỐI]     AS finalAmount,
      CONVERT(VARCHAR, O.[NGÀY TẠO], 120) AS createdAt,
      O.[TRẠNG THÁI]       AS status,
      O.[MÃ KHUYẾN MÃI]    AS promoCode
    FROM dbo.[ORDER] O
    LEFT JOIN dbo.CUSTOMER C ON O.[MÃ SỐ KHÁCH HÀNG] = C.[MÃ SỐ KHÁCH HÀNG] 
    ORDER BY O.[MÃ ĐƠN HÀNG] DESC;
  `);
  return result.recordset;
}

/**
 * INSERT — EXEC dbo.sp_ThemOrder
 * Đã xóa bỏ các Error check của Node.js để SQL Server tự kiểm tra và quăng lỗi (RAISERROR/THROW).
 */
async function insertOrder(p) {
  const pool = await poolPromise;
  const request = pool.request();

  let maKhachHang = String(p.maKhachHang ?? "").trim();
  
  // Vẫn thực hiện padding để đúng định dạng tham số procedure yêu cầu
  const paddedMaKhachHang = padNChar(maKhachHang, 8);
  request.input("MaKhachHang", sql.NVarChar(8), paddedMaKhachHang);
  
  await request.execute("sp_ThemOrder");
}

/**
 * UPDATE — EXEC dbo.sp_CapNhatOrder
 * Đã xóa bỏ các Error check của Node.js để SQL Server tự kiểm tra và quăng lỗi.
 */
async function updateOrder(p) {
  const pool = await poolPromise;
  const request = pool.request();
  
  let maDonHang = String(p.maDonHang ?? "").trim();
  const paddedMaDonHang = padNChar(maDonHang, 6);
  request.input("MaDonHang", sql.NChar(6), paddedMaDonHang);
  
  const tt = nullIfEmptyString(p.trangThai);
  request.input("TrangThai", sql.NVarChar(15), tt);
  
  const mkm = nullIfEmptyString(p.maKhuyenMai);
  request.input("MaKhuyenMai", sql.NVarChar(4), mkm);
  
  await request.execute("sp_CapNhatOrder");
}

/**
 * DELETE — EXEC dbo.sp_XoaOrder
 * Đã xóa bỏ các Error check của Node.js để SQL Server tự kiểm tra và quăng lỗi.
 */
async function deleteOrder(maDonHang) {
  const pool = await poolPromise;
  const request = pool.request();
  
  let cleanId = String(maDonHang ?? "").trim();
  const paddedMaDonHang = padNChar(cleanId, 6);
  request.input("MaDonHang", sql.NChar(6), paddedMaDonHang);
  
  await request.execute("sp_XoaOrder");
}

/** Lấy danh sách mã khuyến mãi đang hoạt động */
async function listPromotions() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT [MÃ KHUYẾN MÃI] AS promoCode, [TÊN CHƯƠNG TRÌNH] AS promoName
    FROM dbo.PROMOTION
    WHERE [TRẠNG THÁI] = N'HOẠT ĐỘNG'
    ORDER BY [MÃ KHUYẾN MÃI] ASC;
  `);
  return result.recordset;
}

/** Lấy chi tiết đơn hàng bằng Stored Procedure */
async function getOrderDetails(maDonHang) {
  const pool = await poolPromise;
  const request = pool.request();
  
  // Sử dụng NVarChar(6) thay vì NChar(6) để tránh lỗi padding
  let cleanId = String(maDonHang ?? "").trim();
  if (cleanId && !cleanId.startsWith("O")) {
    cleanId = "O" + cleanId;
  }
  request.input("MaDonHang", sql.NVarChar(6), cleanId);
  
  // Gọi procedure sp_GetOrderDetails
  const result = await request.execute("sp_GetOrderDetails");
  return result.recordset;
}

module.exports = {
  listOrders,
  insertOrder,
  updateOrder,
  deleteOrder,
  listPromotions,
  getOrderDetails
};
