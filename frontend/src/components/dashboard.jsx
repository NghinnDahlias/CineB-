import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarRange,
  CircleDollarSign,
  Ticket,
  Users,
  ChevronDown,
} from "lucide-react";
import { reportService } from "../../services/reportService";

ChartJS.register(
  CategoryScale, LinearScale, LineElement, BarElement,
  PointElement, Filler, Tooltip, Legend
);

/* ─── helpers ──────────────────────────────────────────────────── */
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { labels: { color: "#374151" } } },
  scales: {
    x: { ticks: { color: "#6b7280" }, grid: { color: "rgba(229,231,235,.8)" } },
    y: { ticks: { color: "#6b7280" }, grid: { color: "rgba(229,231,235,.8)" } },
  },
};

function formatNumber(v) { return Number(v || 0).toLocaleString("vi-VN"); }
function formatMoney(v)  { return `${formatNumber(v)} đ`; }

function StatusBadge({ children, tone }) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}

/* ─── period options ────────────────────────────────────────────── */
const now = new Date();
const CUR_MONTH = now.getMonth() + 1;
const CUR_YEAR  = now.getFullYear();

// Quarter helper: trả về {months:[1,2,3], label:"Q1 2026"}
function quarterRange(q, year) {
  const start = (q - 1) * 3 + 1;
  return { months: [start, start + 1, start + 2], label: `Q${q} ${year}` };
}

// Danh sách preset filter
function buildPeriods() {
  const periods = [
    { id: "all",      label: "Tất cả thời gian",   month: null,      year: null },
    { id: "thisMonth",label: `Tháng ${CUR_MONTH}/${CUR_YEAR}`, month: CUR_MONTH, year: CUR_YEAR },
  ];

  // Tháng trước
  const prevM = CUR_MONTH === 1 ? 12 : CUR_MONTH - 1;
  const prevY = CUR_MONTH === 1 ? CUR_YEAR - 1 : CUR_YEAR;
  periods.push({ id: "prevMonth", label: `Tháng ${prevM}/${prevY}`, month: prevM, year: prevY });

  // Quý hiện tại
  const curQ = Math.ceil(CUR_MONTH / 3);
  periods.push({ id: "thisQ", label: `Q${curQ} ${CUR_YEAR} (hiện tại)`, quarter: curQ, year: CUR_YEAR });

  // Quý trước
  const prevQ = curQ === 1 ? 4 : curQ - 1;
  const prevQY = curQ === 1 ? CUR_YEAR - 1 : CUR_YEAR;
  periods.push({ id: "prevQ", label: `Q${prevQ} ${prevQY} (trước)`, quarter: prevQ, year: prevQY });

  periods.push({ id: "thisYear",  label: `Năm ${CUR_YEAR}`,       month: null, year: CUR_YEAR });
  periods.push({ id: "prevYear",  label: `Năm ${CUR_YEAR - 1}`,   month: null, year: CUR_YEAR - 1 });

  return periods;
}
const PERIODS = buildPeriods();

/* ─── Component ─────────────────────────────────────────────────── */
export default function Dashboard() {
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [periodId, setPeriodId]         = useState("thisMonth");

  const activePeriod = useMemo(
    () => PERIODS.find(p => p.id === periodId) || PERIODS[0],
    [periodId]
  );

  /* ── load data khi period thay đổi ── */
  useEffect(() => {
    let mounted = true;
    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const p = activePeriod;

        // Với quý: gọi getTopMovies cho từng tháng rồi gộp lại
        // Với tháng/năm/all: gọi 1 lần
        let topMoviesData;

        if (p.quarter) {
          // Gọi 3 tháng trong quý song song, gộp và sort
          const { months, } = quarterRange(p.quarter, p.year);
          const results = await Promise.all(
            months.map(m =>
              reportService.getTopMovies({ month: m, year: p.year, topN: 5 }).catch(() => [])
            )
          );
          // Gộp theo movieId, cộng dồn doanh thu
          const map = {};
          results.flat().forEach(movie => {
            const key = movie.movieId || movie.movieName;
            if (!map[key]) {
              map[key] = { ...movie };
            } else {
              map[key].totalRevenue  = (Number(map[key].totalRevenue)  || 0) + (Number(movie.totalRevenue)  || 0);
              map[key].ticketsSold   = (Number(map[key].ticketsSold)   || 0) + (Number(movie.ticketsSold)   || 0);
              map[key].ticketRevenue = (Number(map[key].ticketRevenue) || 0) + (Number(movie.ticketRevenue) || 0);
              map[key].comboRevenue  = (Number(map[key].comboRevenue)  || 0) + (Number(movie.comboRevenue)  || 0);
            }
          });
          topMoviesData = Object.values(map)
            .sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue))
            .slice(0, 5);
        } else {
          // Tháng cụ thể hoặc năm hoặc all-time
          const params = { topN: 5 };
          if (p.month) params.month = p.month;
          if (p.year)  params.year  = p.year;
          topMoviesData = await reportService.getTopMovies(params);
        }

        // Dashboard summary — truyền month/year nếu có
        const dashParams = {};
        if (activePeriod.month) dashParams.month = activePeriod.month;
        if (activePeriod.year)  dashParams.year  = activePeriod.year;
        const dashData = await reportService.getDashboard(dashParams).catch(() => ({}));

        if (mounted) {
          setDashboardData({ ...dashData, topMovies: topMoviesData });
        }
      } catch (err) {
        if (mounted) setError("Không tải được dữ liệu dashboard.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDashboard();
    return () => { mounted = false; };
  }, [periodId]);

  /* ── derived state ── */
//   const stats = useMemo(() => {
//     const s = dashboardData?.summary || {};
//     return [
//       { label: "Tổng khách hàng", value: formatNumber(s.totalCustomers), note: activePeriod.label, icon: Users },
//       { label: "Tổng đơn hàng",   value: formatNumber(s.totalOrders),    note: "Đơn phát sinh trong kỳ", icon: Ticket },
//       { label: "Doanh thu",        value: formatMoney(s.monthlyRevenue),  note: "Đơn đã thanh toán",      icon: CircleDollarSign },
//       { label: "% Lấp đầy",        value: `${Number(s.fillRate||0).toFixed(1)}%`, note: "Tỷ lệ ghế đã chọn", icon: CalendarRange },
//     ];
//   }, [dashboardData, activePeriod]);
	// Thay đoạn `const stats = useMemo(...)` trong dashboard.jsx bằng đoạn này:

  const stats = useMemo(() => {
    const s = dashboardData?.summary || {};
    const total      = Number(s.totalCustomers     || 0);
    const newC       = Number(s.newCustomers        || 0);
    const returning  = Number(s.returningCustomers  || 0);

    // Note hiển thị dưới card khách hàng
    const customerNote = total === 0
      ? "Không có khách trong kỳ"
      : `${newC} mới · ${returning} quay lại`;

    return [
      {
        label: "Khách hàng active",
        value: formatNumber(total),
        note: customerNote,           // "3 mới · 5 quay lại"
        icon: Users,
      },
      {
        label: "Tổng đơn hàng",
        value: formatNumber(s.totalOrders),
        note: "Đơn phát sinh trong kỳ",
        icon: Ticket,
      },
      {
        label: "Doanh thu",
        value: formatMoney(s.monthlyRevenue),
        note: "Đơn đã thanh toán",
        icon: CircleDollarSign,
      },
      {
        label: "% Lấp đầy",
        value: `${Number(s.fillRate || 0).toFixed(1)}%`,
        note: "Tỷ lệ ghế đã chọn",
        icon: CalendarRange,
      },
    ];
  }, [dashboardData, activePeriod]);

  const revenueChartData = useMemo(() => ({
    labels: (dashboardData?.monthlyRevenue || []).map(item => `T${item.month}`),
    datasets: [{
      label: "Doanh thu",
      data: (dashboardData?.monthlyRevenue || []).map(item => Number(item.revenue || 0)),
      borderColor: "#14b8a6",
      backgroundColor: "rgba(20,184,166,.14)",
      pointBackgroundColor: "#14b8a6",
      pointRadius: 3,
      tension: 0.35,
      fill: true,
    }],
  }), [dashboardData]);

  const topMoviesChartData = useMemo(() => ({
    labels: (dashboardData?.topMovies || []).map(m => m.movieName || "—"),
    datasets: [{
      label: "Doanh thu",
      data: (dashboardData?.topMovies || []).map(m => Number(m.totalRevenue || 0)),
      backgroundColor: ["#14b8a6", "#3b82f6", "#5eead4", "#60a5fa", "#99f6e4"],
      borderRadius: 8,
    }],
  }), [dashboardData]);

  const showtimes = dashboardData?.showtimes || [];
  const hasTopMovies = (dashboardData?.topMovies || []).length > 0;

  /* ── render ── */
  return (
    <section className="page page--dashboard" aria-label="Trang chủ">

      {/* ── Header ── */}
      <div className="page__header">
        <div>
          <h1>Trang chủ</h1>
          <p>Tổng quan vận hành rạp chiếu phim.</p>
        </div>

        <div className="page__actions" style={{ alignItems: "center" }}>
          {/* Period picker */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <select
              value={periodId}
              onChange={e => setPeriodId(e.target.value)}
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                padding: "8px 36px 8px 14px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                background: "#fff",
                color: "#374151",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                minWidth: "200px",
              }}
            >
              {PERIODS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{
                position: "absolute", right: 10, top: "50%",
                transform: "translateY(-50%)", pointerEvents: "none",
                color: "#6b7280",
              }}
            />
          </div>

          <button type="button" className="btn btn--secondary">Xuất báo cáo</button>
          <button type="button" className="btn btn--primary">Suất chiếu mới</button>
        </div>
      </div>

      {/* ── Period label badge ── */}
      <div style={{ marginBottom: "12px" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: "#f0fdfa", color: "#0f766e", border: "1px solid #99f6e4",
          borderRadius: "20px", padding: "4px 12px", fontSize: "13px", fontWeight: 500,
        }}>
          <CalendarRange size={13} />
          Đang xem: {activePeriod.label}
        </span>
      </div>

      {error && <div className="page-card" style={{ color: "#b91c1c" }}>{error}</div>}

      {/* ── Stat cards ── */}
      <div className="stat-grid" aria-label="Key metrics">
        {stats.map(item => {
          const Icon = item.icon;
          return (
            <article className="stat-card" key={item.label}>
              <div className="stat-card__top">
                <div>
                  <div className="stat-card__label">{item.label}</div>
                  <div className="stat-card__value">{item.value}</div>
                </div>
                <div className="stat-card__icon" aria-hidden="true"><Icon size={18} /></div>
              </div>
              <div className="stat-card__note">{item.note}</div>
            </article>
          );
        })}
      </div>

      {/* ── Charts ── */}
      <div className="grid-2">
        <article className="page-card panel">
          <div className="section-head">
            <div>
              <h2>Biểu đồ doanh thu 12 tháng</h2>
              <p>Xu hướng doanh thu cả năm.</p>
            </div>
            <ArrowUpRight size={18} color="#14b8a6" />
          </div>
          <div className="chart-shell">
            {loading
              ? <div className="loading-state">Đang tải dữ liệu biểu đồ...</div>
              : <Line data={revenueChartData} options={chartOptions} />
            }
          </div>
        </article>

        <article className="page-card panel">
          <div className="section-head">
            <div>
              <h2>Top 5 phim bán chạy</h2>
              <p>{activePeriod.label}</p>
            </div>
          </div>
          <div className="chart-shell">
            {loading ? (
              <div className="loading-state">Đang tải top phim...</div>
            ) : !hasTopMovies ? (
              <div className="empty-state" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "8px", color: "#9ca3af" }}>
                <span style={{ fontSize: "32px" }}>🎬</span>
                <span>Không có dữ liệu cho kỳ này</span>
                <button
                  className="btn btn--secondary"
                  style={{ fontSize: "12px", padding: "4px 12px", marginTop: "4px" }}
                  onClick={() => setPeriodId("all")}
                >
                  Xem all-time
                </button>
              </div>
            ) : (
              <Bar
                data={topMoviesChartData}
                options={{
                  ...chartOptions,
                  indexAxis: "y",
                  plugins: { ...chartOptions.plugins, legend: { display: false } },
                }}
              />
            )}
          </div>
        </article>
      </div>

      {/* ── Showtimes table ── */}
      <article className="page-card table-card">
        <div className="table-card__head">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <div>
              <h2>Phim sắp tới</h2>
              <p>Các suất chiếu sắp diễn ra và sức chứa hiện tại.</p>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="loading-state">Đang tải lịch chiếu...</div>
        ) : showtimes.length === 0 ? (
          <div className="empty-state">Không có suất chiếu sắp tới.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Giờ</th>
                  <th>Phim</th>
                  <th>Phòng</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: "right" }}>Sức chứa</th>
                </tr>
              </thead>
              <tbody>
                {showtimes.map(item => {
                  const tone = item.status === "Sắp chiếu" ? "badge--teal" : "badge--amber";
                  return (
                    <tr key={`${item.time}-${item.movie}`}>
                      <td>{item.time}</td>
                      <td>{item.movie}</td>
                      <td>{item.room}</td>
                      <td><StatusBadge tone={tone}>{item.status}</StatusBadge></td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {formatNumber(item.soldSeats)} / {formatNumber(item.totalSeats)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}