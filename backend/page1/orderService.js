/**
 * PAGE 1 — Truy vấn bảng ORDER + gọi sp_ThemOrder, sp_CapNhatOrder, sp_XoaOrder.
 * Chỉ dùng trong ./page1; Page 2/3 tạo service riêng trong thư mục của page.
 */
const sql = require("mssql");
const { poolPromise } = require("../db.js");

function nullIfEmptyString(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  return v;
}

/** Danh sách đơn (cho bảng frontend) */
async function listOrders() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT
      [MÃ ĐƠN HÀNG]     AS orderId,
      [MÃ SỐ KHÁCH HÀNG] AS customerId,
      [TỔNG TIỀN]       AS totalAmount,
      [SỐ TIỀN GIẢM]    AS discountAmount,
      [SỐ TIỀN CUỐI]    AS finalAmount,
      [NGÀY TẠO]        AS createdAt,
      [TRẠNG THÁI]      AS status,
      [MÃ KHUYẾN MÃI]   AS promoCode
    FROM dbo.[ORDER]
    ORDER BY [MÃ ĐƠN HÀNG];
  `);
  return result.recordset;
}

/**
 * INSERT — EXEC dbo.sp_ThemOrder
 * @param {{ maKhachHang: string, tongTien: number, soTienGiam: number }} p
 */
async function insertOrder(p) {
  const pool = await poolPromise;
  const request = pool.request();
  request.input("MaKhachHang", sql.NVarChar(8), p.maKhachHang);
  request.input("TongTien", sql.Decimal(18, 0), p.tongTien);
  request.input("SoTienGiam", sql.Decimal(18, 0), p.soTienGiam);
  await request.execute("sp_ThemOrder");
}

/**
 * UPDATE — EXEC dbo.sp_CapNhatOrder
 * NULL = giữ nguyên (theo procedure)
 * @param {{ maDonHang: string, tongTien?: number|null, soTienGiam?: number|null, trangThai?: string|null }} p
 */
async function updateOrder(p) {
  const pool = await poolPromise;
  const request = pool.request();
  request.input("MaDonHang", sql.NVarChar(6), p.maDonHang);
  request.input(
    "TongTien",
    sql.Decimal(18, 0),
    p.tongTien === undefined || p.tongTien === null ? null : p.tongTien
  );
  request.input(
    "SoTienGiam",
    sql.Decimal(18, 0),
    p.soTienGiam === undefined || p.soTienGiam === null ? null : p.soTienGiam
  );
  const tt = nullIfEmptyString(p.trangThai);
  request.input("TrangThai", sql.NVarChar(15), tt);
  await request.execute("sp_CapNhatOrder");
}

/**
 * DELETE — EXEC dbo.sp_XoaOrder
 * @param {string} maDonHang
 */
async function deleteOrder(maDonHang) {
  const pool = await poolPromise;
  const request = pool.request();
  request.input("MaDonHang", sql.NVarChar(6), maDonHang);
  await request.execute("sp_XoaOrder");
}

module.exports = {
  listOrders,
  insertOrder,
  updateOrder,
  deleteOrder
};
