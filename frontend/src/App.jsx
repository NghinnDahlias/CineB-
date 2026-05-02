import { useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/dashboard";
import OrderManagement from "./components/OrderManagement";
import PerformanceReport from "./components/PerformanceReport";
import CustomerHistory from "./components/CustomerHistory";
import TopMovieStats from "./components/TopMovieStats";
import ReportDashboardPage from "./components/ReportDashboardPage";

const NAV_ITEMS = [
  { id: "dashboard", label: "Trang chủ", icon: "dashboard" },
  { id: "orders", label: "Đơn hàng", icon: "orders" },
  { id: "performance", label: "Hiệu suất", icon: "performance" },
  // Thêm mục này vào:
  { id: "room-performance", label: "Hiệu suất phòng", icon: "room" }, 
  { id: "customers", label: "Khách hàng", icon: "customers" },
  { id: "movies", label: "Phim", icon: "movies" },
];



const PAGE_COMPONENTS = {
  dashboard: Dashboard,
  orders: OrderManagement,
  "room-performance": ReportDashboardPage,
  performance: PerformanceReport,
  customers: CustomerHistory,
  movies: TopMovieStats,
};

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const ActivePage = useMemo(() => PAGE_COMPONENTS[activePage] ?? Dashboard, [activePage]);

  return (
    <div className="app-shell">
      <Sidebar
        items={NAV_ITEMS}
        activePage={activePage}
        onNavigate={(pageId) => {
          setActivePage(pageId);
          setSidebarOpen(false);
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="app-shell__content">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        <main className="app-main">
          <ActivePage searchValue={searchValue} />
        </main>

        <footer className="app-footer">
          <span>CineManager © 2026</span>
        </footer>
      </div>
    </div>
  );
}