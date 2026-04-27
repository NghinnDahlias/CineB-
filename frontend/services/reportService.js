// Nơi chứa các hàm fetch gọi API xuống Backend để lấy dữ liệu kết quả từ 6 câu truy vấn SQL kia.
import axios from 'axios';
 
// Đổi BASE_URL nếu backend chạy cổng khác
const BASE_URL = 'http://localhost:3001';
 
export const reportService = {
 
  // Lấy danh sách rạp cho dropdown
  getCinemas: async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/cinemas`);
      return res.data; // [{ id: 'RAP001', name: 'Rạp Galaxy Nguyễn Du' }, ...]
    } catch (err) {
      console.error('Lỗi getCinemas:', err);
      return [];
    }
  },
 
  // Lấy danh sách phòng theo rạp
  getRooms: async (cinemaId) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/rooms`, { params: { cinemaId } });
      return res.data; // [{ id: 'P01', name: 'Phòng 01' }, ...]
    } catch (err) {
      console.error('Lỗi getRooms:', err);
      return [];
    }
  },
 
  // Gọi fn_PhanTichHieuSuatPhong — trả về status + thống kê
  getRoomPerformanceStatus: async (cinemaId, roomId, month, year) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/reports/status`, {
        params: { cinemaId, roomId, month, year }
      });
      return {
        status:           res.data?.status           || 'Không có dữ liệu',
        totalShowtimes:   Number(res.data?.totalShowtimes)   || 0,
        totalTicketsSold: Number(res.data?.totalTicketsSold) || 0,
      };
    } catch (err) {
      console.error('Lỗi getRoomPerformanceStatus:', err);
      return { status: 'Lỗi kết nối Backend', totalShowtimes: 0, totalTicketsSold: 0 };
    }
  },
 
  // Lấy bảng chi tiết suất chiếu
  getShowtimeDetails: async (cinemaId, roomId, month, year) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/reports/details`, {
        params: { cinemaId, roomId, month, year }
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Lỗi getShowtimeDetails:', err);
      return [];
    }
  },
};