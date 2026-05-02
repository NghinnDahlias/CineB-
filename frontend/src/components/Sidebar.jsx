import {
  ChartColumnIncreasing,
  Clapperboard,
  LayoutDashboard,
  LogOut,
  Settings,
  Ticket,
  Users,
  X,
  ReceiptText,
} from "lucide-react";

const ICONS = {
  dashboard: LayoutDashboard,
  orders: Ticket,
  performance: ChartColumnIncreasing,
  customers: Users,
  movies: Clapperboard,
};

export default function Sidebar({ items, activePage, onNavigate, open, onClose }) {
  return (
    <>
      {open ? <div className="sidebar__overlay" onClick={onClose} aria-hidden="true" /> : null}

      <aside className={`app-shell__sidebar ${open ? "is-open" : ""}`} aria-label="Điều hướng bên trái">
        <div className="sidebar">
          <div className="sidebar__brand">
            <div className="sidebar__logo" aria-hidden="true">
              <Clapperboard size={20} />
            </div>
            <div className="sidebar__brand-text">
              <strong>CineB</strong>
              <span>Trung tâm quản lý giao dịch và hiệu suất rạp</span>
            </div>

            <button type="button" className="icon-btn sidebar__mobile-close" onClick={onClose} aria-label="Đóng menu">
              <X size={18} />
            </button>
          </div>

          <nav className="sidebar__nav" aria-label="Menu chính">
            <div className="sidebar__section-label">Khu làm việc</div>
            {items.map((item) => {
              const Icon = ICONS[item.icon] ?? ReceiptText;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar__link ${activePage === item.id ? "is-active" : ""}`}
                  onClick={() => onNavigate(item.id)}
                  aria-current={activePage === item.id ? "page" : undefined}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="sidebar__footer">
            <div className="sidebar__section-label">Hệ thống</div>
            <button type="button" className="sidebar__link">
              <Settings size={18} />
              <span>Cài đặt</span>
            </button>
            <button type="button" className="sidebar__link">
              <LogOut size={18} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
