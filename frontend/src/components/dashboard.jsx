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
import { ArrowUpRight, CalendarRange, CircleDollarSign, Ticket, Users } from "lucide-react";
import { reportService } from "../../services/reportService";

ChartJS.register(CategoryScale, LinearScale, LineElement, BarElement, PointElement, Filler, Tooltip, Legend);

const chartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	animation: false,
	plugins: {
		legend: {
			labels: {
				color: "#374151",
			},
		},
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
function formatNumber(value) {
	return Number(value || 0).toLocaleString("vi-VN");
}

function formatMoney(value) {
	return `${formatNumber(value)} đ`;
}

function StatusBadge({ children, tone }) {
	return <span className={`status-badge ${tone}`}>{children}</span>;
}

export default function Dashboard() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [dashboardData, setDashboardData] = useState(null);

	useEffect(() => {
		let mounted = true;

		async function loadDashboard() {
			setLoading(true);
			setError("");
			try {
				const now = new Date();
				const data = await reportService.getDashboard({
					month: now.getMonth() + 1,
					year: now.getFullYear(),
					topN: 5,
				});
				if (mounted) {
					setDashboardData(data);
				}
			} catch (err) {
				if (mounted) {
					setError(reportService.getErrorMessage(err, "Không tải được dữ liệu dashboard."));
				}
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		}

		loadDashboard();
		return () => {
			mounted = false;
		};
	}, []);

	const stats = useMemo(() => {
		const summary = dashboardData?.summary || {};
		return [
			{ label: "Tổng khách hàng", value: formatNumber(summary.totalCustomers), note: `Kỳ ${summary.periodLabel || "hiện tại"}`, icon: Users },
			{ label: "Tổng đơn hàng", value: formatNumber(summary.totalOrders), note: "Đơn phát sinh trong kỳ", icon: Ticket },
			{ label: "Doanh thu tháng", value: formatMoney(summary.monthlyRevenue), note: "Đơn đã thanh toán", icon: CircleDollarSign },
			{ label: "% Lấp đầy", value: `${Number(summary.fillRate || 0).toFixed(1)}%`, note: "Tỷ lệ ghế đã chọn", icon: CalendarRange },
		];
	}, [dashboardData]);

	const revenueData = useMemo(() => ({
		labels: (dashboardData?.monthlyRevenue || []).map((item) => `T${item.month}`),
		datasets: [
			{
				label: "Doanh thu",
				data: (dashboardData?.monthlyRevenue || []).map((item) => Number(item.revenue || 0)),
				borderColor: "#14b8a6",
				backgroundColor: "rgba(20, 184, 166, 0.14)",
				pointBackgroundColor: "#14b8a6",
				pointRadius: 3,
				tension: 0.35,
				fill: true,
			},
		],
	}), [dashboardData]);

	const topMoviesData = useMemo(() => ({
		labels: (dashboardData?.topMovies || []).map((movie) => movie.title),
		datasets: [
			{
				label: "Doanh thu",
				data: (dashboardData?.topMovies || []).map((movie) => Number(movie.totalRevenue || 0)),
				backgroundColor: ["#14b8a6", "#3b82f6", "#14b8a6", "#60a5fa", "#99f6e4"],
				borderRadius: 8,
			},
		],
	}), [dashboardData]);

	const showtimes = dashboardData?.showtimes || [];

	return (
		<section className="page page--dashboard" aria-label="Trang chủ">
			<div className="page__header">
				<div>
					<h1>Trang chủ</h1>
					<p>Tổng quan vận hành rạp chiếu phim.</p>
				</div>
				<div className="page__actions">
					<button type="button" className="btn btn--secondary">Xuất báo cáo</button>
					<button type="button" className="btn btn--primary">Suất chiếu mới</button>
				</div>
			</div>

			{error ? <div className="page-card" style={{ color: "#b91c1c" }}>{error}</div> : null}
			<div className="stat-grid" aria-label="Key metrics">
				{stats.map((item) => {
					const Icon = item.icon;
					return (
						<article className="stat-card" key={item.label}>
							<div className="stat-card__top">
								<div>
									<div className="stat-card__label">{item.label}</div>
									<div className="stat-card__value">{item.value}</div>
								</div>
								<div className="stat-card__icon" aria-hidden="true">
									<Icon size={18} />
								</div>
							</div>
							<div className="stat-card__note">{item.note}</div>
						</article>
					);
				})}
			</div>

			<div className="grid-2">
				<article className="page-card panel">
					<div className="section-head">
						<div>
							<h2>Biểu đồ doanh thu 12 tháng</h2>
							<p>Xu hướng doanh thu sạch, gọn, nền sáng.</p>
						</div>
						<ArrowUpRight size={18} color="#14b8a6" />
					</div>
					<div className="chart-shell">
						{loading ? <div className="loading-state">Đang tải dữ liệu biểu đồ...</div> : <Line data={revenueData} options={chartOptions} />}
					</div>
				</article>

				<article className="page-card panel">
					<div className="section-head">
						<div>
							<h2>Top 5 phim bán chạy</h2>
							<p>Xếp hạng doanh thu cho giai đoạn hiện tại.</p>
						</div>
					</div>
					<div className="chart-shell">
						{loading ? (
							<div className="loading-state">Đang tải top phim...</div>
						) : (
							<Bar
								data={topMoviesData}
								options={{
									...chartOptions,
									indexAxis: "y",
									plugins: {
										...chartOptions.plugins,
										legend: { display: false },
									},
								}}
							/>
						)}
					</div>
				</article>
			</div>

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
							{showtimes.map((item) => {
								const tone = item.status === "Sắp chiếu" ? "badge--teal" : "badge--amber";
								return (
									<tr key={`${item.time}-${item.movie}`}>
										<td>{item.time}</td>
										<td>{item.movie}</td>
										<td>{item.room}</td>
										<td><StatusBadge tone={tone}>{item.status}</StatusBadge></td>
										<td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatNumber(item.soldSeats)} / {formatNumber(item.totalSeats)}</td>
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