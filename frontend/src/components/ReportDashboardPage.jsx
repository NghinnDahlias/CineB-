/**
 * frontend/src/components/ReportDashboardPage.jsx
 *
 * Trang "Hiệu suất phòng" — hoàn toàn dynamic, không hardcode.
 *
 * API sử dụng:
 *   GET /api/reports/cinemas                              → dropdown Rạp
 *   GET /api/reports/rooms?cinemaId=...                   → dropdown Phòng
 *   GET /api/reports/status?cinemaId=&roomId=&month=&year= → banner + stats
 *   GET /api/reports/details?cinemaId=&roomId=&month=&year=→ bảng + biểu đồ
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Film,
  TicketCheck,
  PercentCircle,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(v) {
  return Number(v || 0).toLocaleString("vi-VN");
}

async function apiFetch(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${path}`);
  return res.json();
}

/**
 * Từ chuỗi status của fn_PhanTichHieuSuatPhong, xác định tone:
 * "TỐT..." → good, "KHÁ..." → ok, còn lại → bad
 */
function getTone(status = "") {
  if (status.includes("TỐT")) return "good";
  if (status.includes("KHÁ")) return "ok";
  return "bad";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBanner({ status, loading }) {
  if (loading) return null;
  if (!status) {
    return (
      <div
        className="page-card"
        style={{ display: "flex", alignItems: "center", gap: 10, color: "#6b7280" }}
      >
        <AlertTriangle size={18} />
        Không có dữ liệu cho bộ lọc đã chọn — hoặc chưa có suất chiếu nào được ghi nhận.
      </div>
    );
  }

  const styles = {
    good: { bg: "#ecfdf5", border: "#6ee7b7", color: "#065f46", Icon: CheckCircle2 },
    ok:   { bg: "#fffbeb", border: "#fcd34d", color: "#92400e", Icon: AlertTriangle },
    bad:  { bg: "#fef2f2", border: "#fca5a5", color: "#991b1b", Icon: XCircle },
  }[getTone(status)];

  const { bg, border, color, Icon } = styles;

  return (
    <div
      className="page-card"
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        color,
        fontWeight: 600,
        fontSize: "0.95rem",
      }}
    >
      <Icon size={20} />
      {status}
    </div>
  );
}

function PerfBadge({ value }) {
  const n = Number(value || 0);
  const cls = n >= 70 ? "badge--teal" : n >= 40 ? "badge--amber" : "badge--red";
  return <span className={`badge ${cls}`}>{n}%</span>;
}

// ─── Component chính ──────────────────────────────────────────────────────────

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS  = [2024, 2025, 2026, 2027];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: { labels: { color: "#374151" } },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.raw}% lấp đầy`,
      },
    },
  },
  scales: {
    x: { ticks: { color: "#6b7280", maxRotation: 45 }, grid: { color: "rgba(229,231,235,0.8)" } },
    y: {
      min: 0, max: 100,
      ticks: { color: "#6b7280", callback: (v) => `${v}%` },
      grid: { color: "rgba(229,231,235,0.8)" },
    },
  },
};

export default function ReportDashboardPage() {
  const now = new Date();

  // ── Dropdown data ───────────────────────────────────────────────────────────
  const [cinemas, setCinemas]   = useState([]);
  const [rooms,   setRooms]     = useState([]);

  // ── Bộ lọc ─────────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    cinemaId: "",
    roomId:   "",
    month:    now.getMonth() + 1,
    year:     now.getFullYear(),
  });

  // ── Kết quả ─────────────────────────────────────────────────────────────────
  const [stats,     setStats]     = useState(null);  // từ /status
  const [showtimes, setShowtimes] = useState([]);    // từ /details
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  // ── Tải danh sách rạp khi mount ────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    apiFetch("/api/reports/cinemas")
      .then((data) => {
        if (!alive) return;
        setCinemas(data);
        if (data.length > 0) {
          setFilters((prev) => ({ ...prev, cinemaId: data[0].id }));
        }
      })
      .catch((err) => {
        if (alive) setError("Không tải được danh sách rạp: " + err.message);
      });
    return () => { alive = false; };
  }, []);

  // ── Khi cinema thay đổi → load rooms ───────────────────────────────────────
  useEffect(() => {
    if (!filters.cinemaId) return;
    let alive = true;
    apiFetch(`/api/reports/rooms?cinemaId=${encodeURIComponent(filters.cinemaId)}`)
      .then((data) => {
        if (!alive) return;
        setRooms(data);
        setFilters((prev) => ({ ...prev, roomId: data.length > 0 ? data[0].id : "" }));
      })
      .catch(() => {
        if (alive) setRooms([]);
      });
    return () => { alive = false; };
  }, [filters.cinemaId]);

  // ── Fetch dữ liệu chính ─────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!filters.cinemaId || !filters.roomId) return;

    setLoading(true);
    setError("");

    const q = new URLSearchParams({
      cinemaId: filters.cinemaId,
      roomId:   filters.roomId,
      month:    filters.month,
      year:     filters.year,
    }).toString();

    try {
      const [statusData, detailData] = await Promise.all([
        apiFetch(`/api/reports/status?${q}`),
        apiFetch(`/api/reports/details?${q}`),
      ]);
      setStats(statusData);
      setShowtimes(Array.isArray(detailData) ? detailData : []);
    } catch (err) {
      setError("Không tải được dữ liệu. Vui lòng thử lại.");
      setStats(null);
      setShowtimes([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ── Auto-fetch khi roomId sẵn sàng ─────────────────────────────────────────
  useEffect(() => {
    if (filters.cinemaId && filters.roomId) fetchData();
  }, [filters.roomId]); // chỉ trigger khi roomId thay đổi (sau khi load rooms)

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleChange = (key, val) =>
    setFilters((prev) => ({
      ...prev,
      [key]: key === "month" || key === "year" ? parseInt(val, 10) : val,
      // Khi đổi cinema, reset roomId (sẽ được set lại bởi useEffect rooms)
      ...(key === "cinemaId" ? { roomId: "" } : {}),
    }));

  // ── Biểu đồ ─────────────────────────────────────────────────────────────────
  const chartData = useMemo(() => ({
    labels: showtimes.map((s) => s.id || s.datetime || "Suất"),
    datasets: [
      {
        label: "Hiệu suất lấp đầy (%)",
        data: showtimes.map((s) => Number(s.perf || 0)),
        backgroundColor: showtimes.map((s) => {
          const v = Number(s.perf || 0);
          if (v >= 70) return "rgba(20,184,166,0.85)";
          if (v >= 40) return "rgba(245,158,11,0.85)";
          return "rgba(239,68,68,0.85)";
        }),
        borderRadius: 6,
      },
    ],
  }), [showtimes]);

  // ── Stat cards ───────────────────────────────────────────────────────────────
  const statCards = useMemo(() => {
    const goodCount = showtimes.filter((s) => Number(s.perf) >= 70).length;
    const goodPct   = showtimes.length > 0
      ? ((goodCount / showtimes.length) * 100).toFixed(1)
      : "0.0";

    return [
      {
        label: "Tổng suất chiếu",
        value: formatNumber(stats?.totalShowtimes),
        note:  "Trong tháng đã chọn",
        Icon:  Film,
      },
      {
        label: "Tổng vé đã bán",
        value: formatNumber(stats?.totalTicketsSold),
        note:  "Ghế trạng thái ĐÃ CHỌN",
        Icon:  TicketCheck,
      },
      {
        label: "Hiệu suất trung bình",
        value: `${Number(stats?.avgPerf || 0).toFixed(1)}%`,
        note:  "",
        Icon:  PercentCircle,
      },
      {
        label: "Suất đạt ngưỡng TỐT",
        value: `${goodCount} / ${showtimes.length}`,
        note:  `Tốt nếu tỉ lệ suất ≥ 70% lấp đầy`,
        Icon:  CheckCircle2,
      },
    ];
  }, [stats, showtimes]);

  // ── Progress bars ─────────────────────────────────────────────────────────
  const progress = useMemo(() => {
    const avgPerf = Number(stats?.avgPerf || 0);
    const goodPct = showtimes.length > 0
      ? (showtimes.filter((s) => Number(s.perf) >= 70).length / showtimes.length) * 100
      : 0;
    const capacity = stats?.totalShowtimes > 0
      ? Math.min(100, (Number(stats.totalTicketsSold || 0) / (Number(stats.totalShowtimes) * 100)) * 100)
      : 0;

    return [
      { label: "Hiệu suất trung bình",       pct: Math.min(100, avgPerf), display: `${avgPerf.toFixed(1)}%` },
      { label: "Tỷ lệ suất đạt ngưỡng TỐT",  pct: goodPct,               display: `${goodPct.toFixed(1)}%` },
      { label: "Công suất bán vé",            pct: capacity,              display: `${capacity.toFixed(1)}%` },
    ];
  }, [stats, showtimes]);

  // ── Hiển thị tên rạp/phòng đang chọn ────────────────────────────────────
  const selectedCinemaName = cinemas.find((c) => c.id === filters.cinemaId)?.name || filters.cinemaId;
  const selectedRoomName   = rooms.find((r) => r.id === filters.roomId)?.name    || filters.roomId;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <section className="page page--room-performance" aria-label="Hiệu suất phòng chiếu">

      {/* Header */}
      <div className="page__header">
        <div>
          <h1>Hiệu suất phòng</h1>
          <p>Phân tích từ vận hành trực tiếp</p>
        </div>
        <div className="page__actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={fetchData}
            disabled={loading || !filters.cinemaId || !filters.roomId}
          >
            <RefreshCw size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
            {loading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="page-card" style={{ color: "#b91c1c" }}>{error}</div>
      )}

      {/* Toolbar bộ lọc */}
      <div className="page-card toolbar">
        <div className="toolbar__filters">

          {/* Rạp */}
          <div className="field toolbar__select">
            <label htmlFor="rp-cinema">Rạp</label>
            <select
              id="rp-cinema"
              value={filters.cinemaId}
              onChange={(e) => handleChange("cinemaId", e.target.value)}
              disabled={cinemas.length === 0}
            >
              {cinemas.length === 0
                ? <option value="">Đang tải...</option>
                : cinemas.map((c) => <option key={c.id} value={c.id}>{c.name || c.id}</option>)
              }
            </select>
          </div>

          {/* Phòng */}
          <div className="field toolbar__select">
            <label htmlFor="rp-room">Phòng</label>
            <select
              id="rp-room"
              value={filters.roomId}
              onChange={(e) => handleChange("roomId", e.target.value)}
              disabled={rooms.length === 0}
            >
              {rooms.length === 0
                ? <option value="">Đang tải...</option>
                : rooms.map((r) => <option key={r.id} value={r.id}>{r.name || r.id}</option>)
              }
            </select>
          </div>

          {/* Tháng */}
          <div className="field toolbar__select">
            <label htmlFor="rp-month">Tháng</label>
            <select
              id="rp-month"
              value={filters.month}
              onChange={(e) => handleChange("month", e.target.value)}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
          </div>

          {/* Năm */}
          <div className="field toolbar__select">
            <label htmlFor="rp-year">Năm</label>
            <select
              id="rp-year"
              value={filters.year}
              onChange={(e) => handleChange("year", e.target.value)}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn btn--primary"
            onClick={fetchData}
            disabled={loading || !filters.cinemaId || !filters.roomId}
          >
            {loading ? "Đang tải..." : "Áp dụng"}
          </button>
        </div>

        {filters.cinemaId && filters.roomId && (
          <div className="badge badge--blue">
            {selectedCinemaName} — {selectedRoomName} — T{filters.month}/{filters.year}
          </div>
        )}
      </div>

      {/* Banner kết quả fn_PhanTichHieuSuatPhong */}
      <StatusBanner status={stats?.status} loading={loading} />

      {/* Stat cards */}
      <div className="stat-grid">
        {statCards.map(({ label, value, note, Icon }) => (
          <article className="stat-card" key={label}>
            <div className="stat-card__top">
              <div>
                <div className="stat-card__label">{label}</div>
                <div className="stat-card__value">
                  {loading
                    ? <span style={{ color: "#d1d5db" }}>—</span>
                    : (stats ? value : "—")
                  }
                </div>
              </div>
              <div className="stat-card__icon" aria-hidden="true">
                <Icon size={18} />
              </div>
            </div>
            <div className="stat-card__note">{note}</div>
          </article>
        ))}
      </div>

      {/* Biểu đồ + Bảng chi tiết */}
      <div className="grid-2">

        {/* Biểu đồ cột */}
        <article className="page-card panel">
          <div className="section-head">
            <div>
              <h2>Hiệu suất từng suất chiếu</h2>
              <p>Tỷ lệ lấp đầy ghế, phân màu theo ngưỡng.</p>
            </div>
          </div>
          <div className="chart-shell">
            {loading ? (
              <div className="loading-state">Đang tải biểu đồ...</div>
            ) : showtimes.length === 0 ? (
              <div className="empty-state">Không có suất chiếu nào trong tháng này.</div>
            ) : (
              <Bar data={chartData} options={chartOptions} />
            )}
          </div>

          {/* Legend */}
          {!loading && showtimes.length > 0 && (
            <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "#6b7280" }}>
              {[
                { color: "#14b8a6", label: "≥ 70% — TỐT" },
                { color: "#f59e0b", label: "40–69% — KHÁ" },
                { color: "#ef4444", label: "< 40% — KÉM" },
              ].map(({ color, label }) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />
                  {label}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Bảng chi tiết */}
        <article className="page-card table-card">
          <div className="table-card__head">
            <div className="section-head" style={{ marginBottom: 0 }}>
              <div>
                <h2>Chi tiết suất chiếu</h2>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">Đang tải dữ liệu...</div>
          ) : showtimes.length === 0 ? (
            <div className="empty-state">Không có suất chiếu nào trong tháng này.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã suất</th>
                    <th>Phim</th>
                    <th>Ngày / Giờ</th>
                    <th style={{ textAlign: "right" }}>Hiệu suất</th>
                  </tr>
                </thead>
                <tbody>
                  {showtimes.map((item, idx) => (
                    <tr key={item.id ?? idx}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{item.id}</td>
                      <td>{item.movie}</td>
                      <td style={{ color: "#6b7280", fontSize: "0.9rem" }}>{item.datetime}</td>
                      <td style={{ textAlign: "right" }}>
                        <PerfBadge value={item.perf} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>

      {/* KPI Progress */}
      {!loading && stats && (
        <article className="page-card">
          <div className="section-head">
            <div>
              <h2>Tiến độ KPI phòng chiếu</h2>
              <p>Dựa trên dữ liệu thực của tháng {filters.month}/{filters.year}.</p>
            </div>
          </div>
          <div className="progress-list">
            {progress.map(({ label, pct, display }) => (
              <div className="progress-item" key={label}>
                <div className="progress-item__row">
                  <span>{label}</span>
                  <strong>{display}</strong>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar__fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      )}
    </section>
  );
}