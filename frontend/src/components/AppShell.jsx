// Bộ khung LAYOUT chung (sidebar + header + vùng nội dung). Không chứa logic từng page.
// Tab Page 1 mount từ src/page1; Page 2/3 — App.jsx.

export default function AppShell({ tabs, activeTab, onTabChange, children }) {
  return (
    <div className="app-root app-root--sidebar">
      <aside className="sidebar card-surface" aria-label="Điều hướng">
        <div className="sidebar-brand">
          <p className="eyebrow">CineB Project</p>
          <h1 className="sidebar-title">BTL2</h1>
          <div className="pill pill--compact">Skeleton</div>
        </div>

        <nav className="tab-nav tab-nav--column" aria-label="Main tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn tab-btn--compact tab-btn--column ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => onTabChange(tab.id)}
              type="button"
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="app-main-column">
        <header className="top-bar card-surface top-bar--compact top-bar--main">
          <div className="top-bar-brand">
            <p className="eyebrow">Đang xem</p>
            <h1>{tabs.find((t) => t.id === activeTab)?.label ?? ""}</h1>
          </div>
        </header>

        <main className="page-wrap">{children}</main>
      </div>
    </div>
  );
}
