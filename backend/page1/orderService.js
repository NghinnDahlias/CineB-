/**
 * PAGE 1 — Truy vấn bảng ORDER + gọi sp_ThemOrder, sp_CapNhatOrder, sp_XoaOrder.
 * Chỉ dùng trong ./page1; Page 2/3 tạo service riêng trong thư mục của page.
 */
const sql = require("mssql");
const { poolPromise } = require("../db.js");

/**
 * Helper: Pad string với spaces để khớp với NCHAR(N) trong SQL
 * NCHAR yêu cầu đúng độ dài, nếu ít hơn thì pad spaces
 */
function padNChar(str, length) {
  if (!str) str = '';
  const s = String(str).trim();
  // Pad spaces từ bên phải
  return (s + ' '.repeat(length)).substring(0, length);
}

function nullIfEmptyString(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  return v;
}

/** Danh sách đơn (cho bảng frontend) */
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
      O.[NGÀY TẠO]         AS createdAt,
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
 * @param {{ maKhachHang: string}} p
 */
async function insertOrder(p) {
  const pool = await poolPromise;
  const request = pool.request();

  // Validate
  let maKhachHang = String(p.maKhachHang ?? "").trim();
  if (!maKhachHang) {
    throw new Error("Mã khách hàng là bắt buộc");
  }
  if (maKhachHang.length > 8) {
    throw new Error("Mã khách hàng tối đa 8 ký tự");
  }
 
  // Pad theo NCHAR(8) nếu SQL định nghĩa như vậy
  // Nếu SQL dùng NVARCHAR(8), bỏ padding
  // ⚠️ CHECK: xem procedure sp_ThemOrder định nghĩa @MaKhachHang sao
  const paddedMaKhachHang = padNChar(maKhachHang, 8);
  
  request.input("MaKhachHang", sql.NVarChar(8), paddedMaKhachHang);
  
  try {
    await request.execute("sp_ThemOrder");
  } catch (err) {
    // Nếu lỗi từ SQL (RAISERROR), extract message
    throw new Error(err.message || "Lỗi thêm đơn hàng");
  }
}

//   await request.execute("sp_ThemOrder");
// }

/**
 * UPDATE — EXEC dbo.sp_CapNhatOrder
 * NULL = giữ nguyên (theo procedure)
 * @param {{ maDonHang: string, trangThai?: string|null, maKhuyenMai?: string|null }} p
 */
async function updateOrder(p) {
  const pool = await poolPromise;
  const request = pool.request();
  // Validate maDonHang
  let maDonHang = String(p.maDonHang ?? "").trim();
  if (!maDonHang) {
    throw new Error("Mã đơn hàng là bắt buộc");
  }
  if (maDonHang.length > 6) {
    throw new Error("Mã đơn hàng tối đa 6 ký tự");
  }
 
  // Pad theo NCHAR(6)
  const paddedMaDonHang = padNChar(maDonHang, 6);
  request.input("MaDonHang", sql.NChar(6), paddedMaDonHang);
  
  const tt = nullIfEmptyString(p.trangThai);
  request.input("TrangThai", sql.NVarChar(15), tt);
  
  const mkm = nullIfEmptyString(p.maKhuyenMai);
  request.input("MaKhuyenMai", sql.NVarChar(4), mkm);
  
  try {
    await request.execute("sp_CapNhatOrder");
  } catch (err) {
    throw new Error(err.message || "Lỗi cập nhật đơn hàng");
  }
}

/**
 * DELETE — EXEC dbo.sp_XoaOrder
 * @param {string} maDonHang
 */
async function deleteOrder(maDonHang) {
  const pool = await poolPromise;
  const request = pool.request();
  // Validate
  let cleanId = String(maDonHang ?? "").trim();
  if (!cleanId) {
    throw new Error("Mã đơn hàng là bắt buộc");
  }
  if (cleanId.length > 6) {
    throw new Error("Mã đơn hàng tối đa 6 ký tự");
  }
 
  const paddedMaDonHang = padNChar(cleanId, 6);
  request.input("MaDonHang", sql.NChar(6), paddedMaDonHang);
  
  try {
    await request.execute("sp_XoaOrder");
  } catch (err) {
    throw new Error(err.message || "Lỗi xóa đơn hàng");
  }
}

module.exports = {
  listOrders,
  insertOrder,
  updateOrder,
  deleteOrder
};
