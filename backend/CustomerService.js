const sql = require("mssql");
const { poolPromise } = require("./db.js");

// 1. Gọi SP Tìm kiếm khách hàng
async function searchCustomers(keyword) {
  const pool = await poolPromise;
  const request = pool.request();
  
  request.input("TuKhoa", sql.NVarChar(100), keyword || "");
  
  const result = await request.execute("sp_TimKiemKhachHang");
  return result.recordset;
}

// 2. Gọi SP Tra cứu lịch sử bằng ID
async function getCustomerHistory(customerId, fromDate, toDate) {
  const pool = await poolPromise;
  const request = pool.request();
  
  // NCHAR(8) cần đảm bảo padding nếu SQL Server yêu cầu, hàm trim() để làm sạch
  const cleanId = String(customerId || "").trim();
  const paddedId = (cleanId + '        ').substring(0, 8); 
  
  request.input("MaSoKhachHang", sql.NChar(8), paddedId);
  if (fromDate) request.input("TuNgay", sql.Date, fromDate);
  if (toDate) request.input("DenNgay", sql.Date, toDate);

  const result = await request.execute("sp_TraCuuLichSuKhachHang");
  
  // Format lại tên cột cho giống với chuẩn CamelCase của Frontend đang dùng
  return result.recordset.map(row => ({
    orderId: row["Mã Đơn"],
    date: row["Ngày Giao Dịch"],
    movieSeatDetail: row["Chi Tiết Phim & Ghế"],
    comboDetail: row["Chi Tiết Combo (F&B)"],
    total: row["Tổng Tiền"],
    discount: row["Khuyến Mãi"],
    finalAmount: row["Thành Tiền"],
    status: row["Trạng Thái"]
  }));
}

module.exports = {
  searchCustomers,
  getCustomerHistory
};