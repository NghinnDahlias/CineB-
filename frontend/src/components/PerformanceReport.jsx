import { useEffect, useMemo, useState } from "react";
import { reportService } from "../../services/reportService";
import DataChart from "./DataChart";

const periods = [
  { id: "month", label: "Tháng này" },
  { id: "lastMonth", label: "Tháng trước" },
  { id: "quarter", label: "Quý này" },
];

export default function PerformanceReport() {
  const [cinemas, setCinemas] = useState([]);
  const [cinema, setCinema] = useState("");
  const [period, setPeriod] = useState(periods[0].id);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadCinemas() {
      try {
        const items = await reportService.getCinemas();
        if (mounted) setCinemas(items);
      } catch (err) {
        if (mounted) setError("Không tải được danh sách rạp.");
      }
    }
    loadCinemas();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadPerformance() {
      setLoading(true);
      setError("");
      try {
        const data = await reportService.getPerformance({ cinemaId: cinema, period });
        if (mounted) setReportData(data);
      } catch (err) {
        if (mounted) setError("Không tải được dữ liệu hiệu suất.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadPerformance();
    return () => { mounted = false; };
  }, [cinema, period]);

  const filteredOverview = useMemo(() => {
    const overview = reportData?.overview || {};
    return [
      { label: "Tỷ lệ lấp đầy trung bình", value: `${Number(overview.avgFillRate || 0).toFixed(2)}%` },
      { label: "Tổng doanh thu", value: `${Number(overview.totalRevenue || 0).toLocaleString("vi-VN")} đ` },
      { label: "Giờ tốt nhất", value: overview.bestHour || "--:--" },
      { label: "Định dạng bán chạy", value: overview.topFormat || "Chưa có dữ liệu" },
    ];
  }, [reportData]);

  const currentPeriodLabel = reportData?.periodLabel || periods.find((item) => item.id === period)?.label || "Tháng này";

  return (
    <section className="page page--performance" aria-label="Báo cáo hiệu suất">
      <div className="page__header">
        <div>
          <h1>Báo cáo hiệu suất</h1>
          <p>Theo dõi các chỉ số vận hành và doanh thu cốt lõi của hệ thống rạp.</p>
        </div>
        <div className="page__actions">
          <button type="button" className="btn btn--secondary">Xuất PDF</button>
          <button type="button" className="btn btn--primary">Áp dụng bộ lọc</button>
        </div>
      </div>

      {error ? <div className="page-card" style={{ color: "#b91c1c" }}>{error}</div> : null}

      <div className="page-card toolbar">
        <div className="toolbar__filters">
          <div className="field toolbar__select">
            <label htmlFor="report-cinema">Rạp</label>
            <select id="report-cinema" value={cinema} onChange={(event) => setCinema(event.target.value)}>
              <option value="">Tất cả rạp</option>
              {cinemas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div className="field toolbar__select">
            <label htmlFor="report-period">Thời gian</label>
            <select id="report-period" value={period} onChange={(event) => setPeriod(event.target.value)}>
              {periods.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </div>
        </div>
        <div className="badge badge--blue">Cập nhật trực tiếp</div>
      </div>

      <div className="grid-3">
        {filteredOverview.map((item) => (
          <article className="stat-card" key={item.label}>
            <div className="stat-card__label">{item.label}</div>
            <div className="stat-card__value">{item.value}</div>
            <div className="stat-card__note">Dựa trên {String(currentPeriodLabel).toLowerCase()}</div>
          </article>
        ))}
      </div>

      <div className="grid-2">
        <article className="page-card panel" style={{ backgroundColor: '#141414', border: 'none', padding: 0 }}>
          {loading ? (
            <div className="loading-state">Đang tải dữ liệu biểu đồ...</div>
          ) : (
            <DataChart 
              data={reportData?.fillTrend || []} 
              title="Xu hướng lấp đầy" 
              subtitle="Biến động công suất sử dụng phòng chiếu."
              type="line"
              color="#092ee5" 
            />
          )}
        </article>

        <article className="page-card panel" style={{ backgroundColor: '#141414', border: 'none', padding: 0 }}>
          {loading ? (
            <div className="loading-state">Đang tải dữ liệu doanh thu...</div>
          ) : (
            <DataChart 
              data={reportData?.revenueTrend || []} 
              title="Doanh thu theo giai đoạn" 
              subtitle="Tăng trưởng doanh thu dựa trên bộ lọc."
              type="bar"
              color="#3b82f6" 
            />
          )}
        </article>
        
        <article className="page-card">
          <div className="section-head">
            <div>
              <h2>Tiến độ doanh thu</h2>
              <p>Tỷ lệ đạt KPI</p>
            </div>
          </div>
          <div className="progress-list">
            <div className="progress-item">
              <div className="progress-item__row"><span>Công suất lấp đầy</span><strong>{Number(reportData?.overview?.avgFillRate || 0).toFixed(2)}%</strong></div>
              <div className="progress-bar"><div className="progress-bar__fill" style={{ width: `${Math.min(100, Number(reportData?.overview?.avgFillRate || 0))}%` }} /></div>
            </div>
            <div className="progress-item">
              <div className="progress-item__row"><span>Tiến độ doanh thu</span><strong>{Math.min(100, (Number(reportData?.overview?.totalRevenue || 0) / 100000000) * 100).toFixed(1)}%</strong></div>
              <div className="progress-bar"><div className="progress-bar__fill" style={{ width: `${Math.min(100, (Number(reportData?.overview?.totalRevenue || 0) / 100000000) * 100)}%` }} /></div>
            </div>
            <div className="progress-item">
              <div className="progress-item__row"><span>Tỷ lệ bán Combo</span><strong>{reportData?.overview?.topFormat ? "100%" : "0%"}</strong></div>
              <div className="progress-bar"><div className="progress-bar__fill" style={{ width: reportData?.overview?.topFormat ? "100%" : "0%" }} /></div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}