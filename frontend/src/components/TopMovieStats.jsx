import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { reportService } from "../../services/reportService";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y",
  animation: false,
  plugins: {
    legend: { labels: { color: "#374151" } },
  },
  scales: {
    x: {
      ticks: { color: "#6b7280" },
      grid: { color: "rgba(229, 231, 235, 0.8)" },
    },
    y: {
      ticks: { color: "#6b7280" },
      grid: { color: "rgba(229, 231, 235, 0.8)" },
    },
  },
};

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

export default function TopMovieStats() {
  const [movies, setMovies]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear]   = useState("");

  /**
   * Gọi API: truyền month/year là số nguyên nếu có, bỏ trống = all-time
   * Backend route đọc: req.query.topN, req.query.month, req.query.year
   */
  const loadTopMovies = async (month, year) => {
    setLoading(true);
    setError("");
    try {
      // Chỉ thêm month/year khi có giá trị thực sự
      const params = { topN: 5 };
      if (month) params.month = Number(month);
      if (year)  params.year  = Number(year);

      const data = await reportService.getTopMovies(params);
      setMovies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(reportService.getErrorMessage(err, "Không tải được top phim."));
    } finally {
      setLoading(false);
    }
  };

  // Load lần đầu: all-time (không truyền month/year)
  useEffect(() => {
    loadTopMovies("", "");
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    loadTopMovies(filterMonth, filterYear);
  };

  /* ─── Chart data ─────────────────────────────────────────── */
  const chartData = useMemo(() => ({
    labels: movies.map((m) => m.movieName || "Chưa có tên"),
    datasets: [
      {
        label: "Doanh thu (đ)",
        data: movies.map((m) => Number(m.totalRevenue || 0)),
        backgroundColor: ["#14b8a6", "#3b82f6", "#5eead4", "#60a5fa", "#99f6e4"],
        borderRadius: 8,
      },
    ],
  }), [movies]);

  /* ─── Summary cards ──────────────────────────────────────── */
  const totalRevenue = useMemo(
    () => movies.reduce((acc, m) => acc + Number(m.totalRevenue || 0), 0),
    [movies]
  );

  const avgFillRate = useMemo(() => {
    if (!movies.length) return 0;
    return movies.reduce((acc, m) => acc + Number(m.occupancyRate || 0), 0) / movies.length;
  }, [movies]);

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <section className="page page--movies" aria-label="Thống kê phim bán chạy">

      {/* Header + bộ lọc */}
      <div className="page__header" style={{ marginBottom: "20px" }}>
        <div>
          <h1>Thống kê phim bán chạy</h1>
          <p>Mặc định hiển thị dữ liệu từ trước đến nay.</p>
        </div>

        <form
          onSubmit={handleFilter}
          style={{ display: "flex", gap: "10px", alignItems: "center" }}
        >
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
          >
            <option value="">Tất cả các tháng</option>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
          >
            <option value="">Tất cả các năm</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>

          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? "Đang tải..." : "Lọc dữ liệu"}
          </button>
        </form>
      </div>

      {/* Summary cards */}
      <div className="grid-3">
        <article className="stat-card">
          <div className="stat-card__label">Doanh thu phim số 1</div>
          <div className="stat-card__value">
            {movies[0] ? `${formatMoney(movies[0].totalRevenue)} đ` : "0 đ"}
          </div>
          <div className="stat-card__note">
            {movies[0]?.movieName || "Tựa phim hiệu quả nhất"}
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__label">Tổng doanh thu</div>
          <div className="stat-card__value">{formatMoney(totalRevenue)} đ</div>
          <div className="stat-card__note">Tổng {movies.length} phim đứng đầu</div>
        </article>

        <article className="stat-card">
          <div className="stat-card__label">Tỷ lệ lấp đầy TB</div>
          <div className="stat-card__value">{avgFillRate.toFixed(2)}%</div>
          <div className="stat-card__note">Tính trên {movies.length} phim dẫn đầu</div>
        </article>
      </div>

      {/* Error */}
      {error && (
        <div className="page-card" style={{ color: "#b91c1c" }}>{error}</div>
      )}

      {/* Biểu đồ + bảng */}
      <div className="grid-2">

        {/* Biểu đồ ngang */}
        <article className="page-card panel">
          <div className="section-head">
            <div>
              <h2>Xếp hạng doanh thu</h2>
              <p>Biểu đồ ngang — top {movies.length} phim.</p>
            </div>
          </div>
          <div className="chart-shell">
            {loading
              ? <div className="loading-state">Đang tải dữ liệu biểu đồ...</div>
              : <Bar data={chartData} options={chartOptions} />
            }
          </div>
        </article>

        {/* Bảng chi tiết */}
        <article className="page-card table-card">
          <div className="table-card__head">
            <div className="section-head" style={{ marginBottom: 0 }}>
              <div>
                <h2>Chi tiết phim</h2>
                <p>Doanh thu, số ghế bán và tỷ lệ lấp đầy.</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">Đang tải dữ liệu phim...</div>
          ) : movies.length === 0 ? (
            <div className="empty-state">Không có dữ liệu phim trong kỳ.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Phim</th>
                    <th>Ghế bán</th>
                    <th>Lấp đầy</th>
                    <th>Vé</th>
                    <th>Combo</th>
                    <th style={{ textAlign: "right" }}>Tổng DT</th>
                  </tr>
                </thead>
                <tbody>
                  {movies.map((movie, idx) => {
                    const rate = Number(movie.occupancyRate || 0);
                    const badgeClass =
                      rate >= 85 ? "badge--teal"
                      : rate >= 70 ? "badge--amber"
                      : "badge--red";

                    return (
                      <tr key={movie.movieId || movie.movieName}>
                        <td style={{ color: "#9ca3af", fontSize: "13px" }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{movie.movieName}</td>
                        <td>{Number(movie.ticketsSold || 0).toLocaleString("vi-VN")}</td>
                        <td>
                          <span className={`badge ${badgeClass}`}>
                            {rate.toFixed(2)}%
                          </span>
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          {formatMoney(movie.ticketRevenue)} đ
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          {formatMoney(movie.comboRevenue)} đ
                        </td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                          {formatMoney(movie.totalRevenue)} đ
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}