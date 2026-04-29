import axios from 'axios';
 
const BASE_URL = 'http://localhost:3000';

function getErrorMessage(error, fallback) {
  return error?.response?.data?.error || error?.message || fallback;
}
 
export const reportService = {
  getDashboard: async (params = {}) => {
    const res = await axios.get(`${BASE_URL}/api/reports/dashboard`, { params });
    return res.data;
  },

  getTopMovies: async (params = {}) => {
    const res = await axios.get(`${BASE_URL}/api/reports/top-movies`, { params });
    return Array.isArray(res.data) ? res.data : [];
  },

  getPerformance: async (params = {}) => {
    const res = await axios.get(`${BASE_URL}/api/reports/performance`, { params });
    return res.data;
  },

  getCustomers: async (params = {}) => {
    const res = await axios.get(`${BASE_URL}/api/reports/customers`, { params });
    return Array.isArray(res.data) ? res.data : [];
  },

  getCustomerHistory: async (customerId, params = {}) => {
    const res = await axios.get(`${BASE_URL}/api/reports/customers/${customerId}/history`, { params });
    return Array.isArray(res.data) ? res.data : [];
  },
 
  getCinemas: async () => {
    const res = await axios.get(`${BASE_URL}/api/reports/cinemas`);
    return Array.isArray(res.data) ? res.data : [];
  },
 
  getRooms: async (cinemaId) => {
    const res = await axios.get(`${BASE_URL}/api/reports/rooms`, { params: { cinemaId } });
    return Array.isArray(res.data) ? res.data : [];
  },
 
  getRoomPerformanceStatus: async (cinemaId, roomId, month, year) => {
    const res = await axios.get(`${BASE_URL}/api/reports/status`, {
      params: { cinemaId, roomId, month, year }
    });
    return {
      status: res.data?.status || 'Không có dữ liệu',
      totalShowtimes: Number(res.data?.totalShowtimes) || 0,
      totalTicketsSold: Number(res.data?.totalTicketsSold) || 0,
    };
  },
 
  getShowtimeDetails: async (cinemaId, roomId, month, year) => {
    const res = await axios.get(`${BASE_URL}/api/reports/details`, {
      params: { cinemaId, roomId, month, year }
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  getErrorMessage,
};