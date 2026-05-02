import { Bell, Menu, Search, ChevronDown, CircleUserRound, Clapperboard } from "lucide-react";

export default function Navbar({ onMenuClick, searchValue, onSearchChange }) {
  return (
    <header className="app-navbar" aria-label="Thanh điều hướng trên cùng">
      <div className="app-navbar__left">
        <button
          type="button"
          className="app-navbar__menu-button"
          onClick={onMenuClick}
          aria-label="Mở menu"
        >
          <Menu size={18} />
        </button>

        <div className="app-navbar__brand" aria-label="CineB">
          <div className="app-navbar__brand-mark" aria-hidden="true">
            <Clapperboard size={18} />
          </div>
          <div className="app-navbar__title">
            <strong>CineB</strong>
            <span>Trung tâm quản lý giao dịch và hiệu suất rạp</span>
          </div>
        </div>
      </div>

      <div className="app-navbar__right">
        <button type="button" className="app-navbar__icon-button" aria-label="Thông báo">
          <Bell size={18} />
        </button>
        <button type="button" className="app-navbar__icon-button" aria-label="Menu người dùng">
          <CircleUserRound size={18} />
          <ChevronDown size={14} />
        </button>
      </div>
    </header>
  );
}
