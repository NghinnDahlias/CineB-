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
    x: { ticks: { color: "#6b7280" }, grid: { color: "rgba(229, 231, 235, 0.8)" } },
    y: { ticks: { color: "#6b7280" }, grid: { color: "rgba(229, 231, 235, 0.8)" } },
  },
};

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

export default function TopMovieStats() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadTopMovies() {
      setLoading(true);
      setError("");

      try {
        const now = new Date();
        const data = await reportService.getTopMovies({
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          topN: 5,
        });
        if (mounted) {
          setMovies(data);
        }
      } catch (err) {
        if (mounted) {
          setError(reportService.getErrorMessage(err, "Không tải được top phim."));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTopMovies();
    return () => {
      mounted = false;
    };
  }, []);

  const chartData = useMemo(() => ({
    labels: movies.map((movie) => movie.title),
    datasets: [
      {
        label: "Doanh thu",
        data: movies.map((movie) => Number(movie.totalRevenue || 0)),
        backgroundColor: ["#14b8a6", "#3b82f6", "#5eead4", "#60a5fa", "#99f6e4"],
        borderRadius: 8,
      },
    ],
  }), [movies]);

  const summary = useMemo(() => movies.reduce((acc, movie) => acc + Number(movie.totalRevenue || 0), 0), [movies]);
  const avgFillRate = useMemo(() => {
    if (movies.length === 0) return 0;
    const total = movies.reduce((acc, movie) => acc + Number(movie.fillRate || 0), 0);
    return total / movies.length;
  }, [movies]);

  return (
    <section className="page page--movies" aria-label="Thống kê phim bán chạy">
      <div className="page__header">
        <div>
          <h1>Thống kê phim bán chạy</h1>
          <p>Giao diện xếp hạng gọn gàng với biểu đồ doanh thu và bảng rõ ràng.</p>
        </div>
        <div className="page__actions">
          <button type="button" className="btn btn--secondary">So sánh tuần</button>
          <button type="button" className="btn btn--primary">Tải báo cáo</button>
        </div>
      </div>

      <div className="grid-3">
        <article className="stat-card">
          <div className="stat-card__label">Doanh thu phim số 1</div>
          <div className="stat-card__value">{movies[0] ? `${formatMoney(movies[0].totalRevenue)} đ` : "0 đ"}</div>
          <div className="stat-card__note">Tựa phim hiệu quả nhất</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Tổng doanh thu</div>
          <div className="stat-card__value">{formatMoney(summary)} đ</div>
          <div className="stat-card__note">Tổng 5 phim đứng đầu</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Tỷ lệ lấp đầy trung bình</div>
          <div className="stat-card__value">{avgFillRate.toFixed(2)}%</div>
          <div className="stat-card__note">Tính trên 5 phim dẫn đầu</div>
        </article>
      </div>

      {error ? <div className="page-card" style={{ color: "#b91c1c" }}>{error}</div> : null}

      <div className="grid-2">
        <article className="page-card panel">
          <div className="section-head">
            <div>
              <h2>Xếp hạng doanh thu</h2>
              <p>Biểu đồ ngang với tông xanh teal và blue.</p>
            </div>
          </div>
          <div className="chart-shell">
            {loading ? <div className="loading-state">Đang tải dữ liệu biểu đồ...</div> : <Bar data={chartData} options={chartOptions} />}
          </div>
        </article>

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
                  <th>Phim</th>
                  <th>Ghế bán</th>
                  <th>Tỷ lệ lấp đầy</th>
                  <th style={{ textAlign: "right" }}>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((movie) => (
                  <tr key={movie.title}>
                    <td style={{ fontWeight: 600 }}>{movie.title}</td>
                    <td>{Number(movie.tickets || 0).toLocaleString("vi-VN")}</td>
                    <td><span className={`badge ${movie.fillRate >= 85 ? "badge--teal" : movie.fillRate >= 70 ? "badge--amber" : "badge--red"}`}>{Number(movie.fillRate || 0).toFixed(2)}%</span></td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatMoney(movie.totalRevenue)} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </article>
      </div>
    </section>
  );
}
