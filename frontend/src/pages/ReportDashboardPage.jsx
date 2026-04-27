// Đây sẽ là màn hình chính để hiển thị 6 yêu cầu trên. 
// Thay vì nhét chung vào trang quản lý Lịch chiếu, trang Dashboard này sẽ chứa các biểu đồ, bảng xếp hạng và các con số thống kê tổng quát.

// Ví dụ trong trang này: Sẽ có ô chọn bộ lọc (Từ ngày - Đến ngày, Chọn Rạp) để gọi các thủ tục thống kê Giờ vàng doanh thu hay Bắp nước bán chạy.
import { useState, useEffect } from 'react';
import { Film, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import StatCard from '../components/StatCard';
import DataChart from '../components/DataChart';
 
const trendData = [
  { month: 'T1', occupancy: 65 }, { month: 'T2', occupancy: 58 },
  { month: 'T3', occupancy: 72 }, { month: 'T4', occupancy: 76 },
  { month: 'T5', occupancy: 68 }, { month: 'T6', occupancy: 83 },
  { month: 'T7', occupancy: 79 }, { month: 'T8', occupancy: 71 },
  { month: 'T9', occupancy: 69 }, { month: 'T10', occupancy: 78 },
  { month: 'T11', occupancy: 74 }, { month: 'T12', occupancy: 81 },
];
 
const CINEMA_LIST = [
  { id: 'RAP001', name: 'RAP001' },
  { id: 'RAP002', name: 'RAP002' },
  { id: 'RAP003', name: 'RAP003' },
];
 
const ROOM_MAP = {
  RAP001: [{ id: 'P01', name: 'P01' }, { id: 'P02', name: 'P02' }],
  RAP002: [{ id: 'P01', name: 'P01' }, { id: 'P02', name: 'P02' }],
  RAP003: [{ id: 'P01', name: 'P01' }, { id: 'P02', name: 'P02' }],
};
 
async function apiFetch(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${path}`);
  return res.json();
}
 
export default function ReportDashboardPage() {
  const [showtimes, setShowtimes] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [stats, setStats] = useState({ status: '', totalShowtimes: 0, totalTicketsSold: 0 });
 
  const [filters, setFilters] = useState({
    cinemaId: 'RAP001',
    roomId:   'P01',
    month:    new Date().getMonth() + 1,
    year:     new Date().getFullYear(),
  });
 
  const rooms = ROOM_MAP[filters.cinemaId] || [];
 
 
  async function fetchReportData() {
    setLoading(true);
    const p = `cinemaId=${filters.cinemaId}&roomId=${filters.roomId}&month=${filters.month}&year=${filters.year}`;
    try {
      const [statusData, detailData] = await Promise.all([
        apiFetch(`/api/reports/status?${p}`),
        apiFetch(`/api/reports/details?${p}`),
      ]);
      setStats(statusData);
      setShowtimes(detailData);
    } catch (err) {
      setStats({ status: '', totalShowtimes: 0, totalTicketsSold: 0 });
      setShowtimes([]);
    } finally {
      setLoading(false);
    }
  }
 
  // Fetch ngay khi load trang
  useEffect(() => { fetchReportData(); }, []);
 
  // Reset roomId khi đổi rạp
  const handleCinemaChange = (val) => {
    const firstRoom = ROOM_MAP[val]?.[0]?.id || 'P01';
    setFilters(p => ({ ...p, cinemaId: val, roomId: firstRoom }));
  };
 
  const handleChange = (key, val) =>
    setFilters(p => ({ ...p, [key]: key === 'month' || key === 'year' ? parseInt(val) : val }));
 
  const isGood = stats.status.includes('TỐT');
  const isOk   = stats.status.includes('KHÁ');
 
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
 
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '12px', backgroundColor: '#e50914', borderRadius: '8px' }}>
          <Film color="white" size={32} />
        </div>
        <div>
          <h1 style={{ margin: '0 0 4px 0' }}>Báo Cáo Hiệu Suất Phòng Chiếu</h1>
          <p style={{ margin: 0, color: '#888' }}>Phân tích từ fn_PhanTichHieuSuatPhong · CineB Database</p>
        </div>
      </div>
 
 
      {/* Bộ lọc */}
      <div className="card-surface" style={{ padding: '24px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
 
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Chọn Rạp</label>
          <select value={filters.cinemaId} onChange={e => handleCinemaChange(e.target.value)}
            style={{ width: '100%', padding: '8px', backgroundColor: '#111', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}>
            {CINEMA_LIST.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
 
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Chọn Phòng</label>
          <select value={filters.roomId} onChange={e => handleChange('roomId', e.target.value)}
            style={{ width: '100%', padding: '8px', backgroundColor: '#111', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
 
        <div style={{ flex: '0 0 120px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Tháng</label>
          <select value={filters.month} onChange={e => handleChange('month', e.target.value)}
            style={{ width: '100%', padding: '8px', backgroundColor: '#111', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Tháng {m}</option>)}
          </select>
        </div>
 
        <div style={{ flex: '0 0 100px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Năm</label>
          <select value={filters.year} onChange={e => handleChange('year', e.target.value)}
            style={{ width: '100%', padding: '8px', backgroundColor: '#111', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
 
        <button className="primary-btn" onClick={fetchReportData} disabled={loading}
          style={{ height: '42px', minWidth: '110px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
          {loading ? <><RefreshCw size={14} /> Đang tải...</> : 'Áp Dụng'}
        </button>
      </div>
 
      {/* Banner trạng thái */}
      {stats.status ? (
        <div style={{
          padding: '16px', borderRadius: '8px', fontWeight: 'bold',
          display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px',
          backgroundColor: isGood ? '#1DB954' : isOk ? '#f59e0b' : '#e50914',
          color: isGood ? '#000' : '#fff',
        }}>
          <CheckCircle size={20} /> {stats.status}
        </div>
      ) : !loading && (
        <div style={{ padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', backgroundColor: '#1a1a1a', color: '#666' }}>
          <AlertCircle size={20} /> Không có dữ liệu cho tháng / phòng đã chọn.
        </div>
      )}
 
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <StatCard type="calendar" title="Tổng số suất chiếu" value={stats.totalShowtimes} subtitle="Trong tháng đã chọn" />
        <StatCard type="users"    title="Tổng vé đã bán"    value={(stats.totalTicketsSold || 0).toLocaleString('vi-VN')} subtitle="Dựa trên ghế ĐÃ CHỌN" />
      </div>
 
      <DataChart data={trendData} />
 
      {/* Bảng chi tiết */}
      <div className="card-surface" style={{ padding: '24px' }}>
        <h2 style={{ margin: '0 0 24px 0' }}>Bảng Chi Tiết Suất Chiếu</h2>
        {loading ? (
          <p style={{ color: '#555', textAlign: 'center', padding: '32px 0' }}>⏳ Đang tải...</p>
        ) : showtimes.length === 0 ? (
          <p style={{ color: '#555', textAlign: 'center', padding: '32px 0' }}>Không có suất chiếu nào trong tháng này.</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                <th style={{ paddingBottom: '12px', color: '#666', fontWeight: 500 }}>Mã Suất</th>
                <th style={{ paddingBottom: '12px', color: '#666', fontWeight: 500 }}>Phim</th>
                <th style={{ paddingBottom: '12px', color: '#666', fontWeight: 500 }}>Ngày / Giờ</th>
                <th style={{ paddingBottom: '12px', color: '#666', fontWeight: 500, textAlign: 'right' }}>Hiệu Suất</th>
              </tr>
            </thead>
            <tbody>
              {showtimes.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '14px 0', fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.id}</td>
                  <td style={{ padding: '14px 8px' }}>{item.movie}</td>
                  <td style={{ color: '#777', fontSize: '0.9rem' }}>{item.datetime}</td>
                  <td style={{
                    textAlign: 'right', fontWeight: 'bold', fontSize: '1rem',
                    color: item.perf >= 70 ? '#1DB954' : item.perf >= 40 ? '#f59e0b' : '#e50914',
                  }}>
                    {item.perf}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}