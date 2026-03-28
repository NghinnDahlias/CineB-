// Bộ khung LAYOUT chính của ứng dụng, bao gồm header, navigation và phần nội dung chính
// Bạn phải sửa file này để thêm một tab mới tên là "Thống kê" hoặc "Báo cáo" vào thanh điều hướng (Navigation Nav) 
// để người dùng có thể click chuyển sang trang ReportDashboardPage.

export default function AppShell({ tabs, activeTab, onTabChange, children }) {
  return (
    <div className="app-root">
      <header className="top-bar card-surface">
        <div>
          <p className="eyebrow">CineB Project</p>
          <h1>Frontend Skeleton for BTL2</h1>
          <p className="muted">Only frontend scaffold. SQL stays unchanged.</p>
        </div>
        <div className="pill">Mode: FE Skeleton</div>
      </header>

      <nav className="tab-nav card-surface" aria-label="Main tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            <span>{tab.label}</span>
            <small>{tab.description}</small>
          </button>
        ))}
      </nav>

      <main className="page-wrap">{children}</main>
    </div>
  );
}
