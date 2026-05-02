// // DÀNH CHO BACKEND (Node.js)
// const sql = require("mssql");
// const { poolPromise } = require("./db.js");

// async function getTopMovies(thang, nam, topN = 5, doanhThuToiThieu = 0) {
//   const pool = await poolPromise;
//   const request = pool.request();
  
//   // Dùng sql.Int cho null
//   request.input("Thang", sql.Int, thang);
//   request.input("Nam", sql.Int, nam);
//   request.input("TopN", sql.Int, topN);
//   request.input("DoanhThuToiThieu", sql.Numeric(18, 0), doanhThuToiThieu);

//   const result = await request.execute("sp_ThongKeTopPhim");
  
//   return result.recordset.map(row => ({
//     movieId: row["Mã Phim"],
//     movieName: row["Tên Phim"],
//     ticketsSold: row["Số Vé Bán Ra"],
//     occupancyRate: row["Tỷ Lệ Lấp Đầy (%)"], 
//     ticketRevenue: row["Doanh Thu Vé"],
//     comboRevenue: row["Doanh Thu Combo"],
//     totalRevenue: row["Tổng Doanh Thu"]
//   }));
// }

// module.exports = {
//   getTopMovies
// };

// DÀNH CHO BACKEND (Node.js)
const sql = require("mssql");
const { poolPromise } = require("./db.js");

/**
 * Gọi SP sp_ThongKeTopPhim
 * @param {number|null} thang  - null = all-time
 * @param {number|null} nam    - null = all-time
 * @param {number}      topN
 * @param {number}      doanhThuToiThieu
 */
async function getTopMovies(thang, nam, topN = 5, doanhThuToiThieu = 0) {
  const pool = await poolPromise;
  const request = pool.request();

  // Truyền NULL đúng cách cho mssql khi không có tháng/năm
  request.input("Thang",            sql.Int,          thang ?? null);
  request.input("Nam",              sql.Int,          nam   ?? null);
  request.input("TopN",             sql.Int,          topN);
  request.input("DoanhThuToiThieu", sql.Numeric(18,0), doanhThuToiThieu);

  const result = await request.execute("sp_ThongKeTopPhim");

  return result.recordset.map(row => ({
    movieId:       row["Mã Phim"],
    movieName:     row["Tên Phim"],
    ticketsSold:   row["Số Vé Bán Ra"],
    occupancyRate: row["Tỷ Lệ Lấp Đầy (%)"],
    ticketRevenue: row["Doanh Thu Vé"],
    comboRevenue:  row["Doanh Thu Combo"],
    totalRevenue:  row["Tổng Doanh Thu"],
  }));
}

module.exports = { getTopMovies };