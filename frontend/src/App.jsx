/**
 * Điều hướng tab: mỗi tab nên gắn một thư mục feature riêng.
 * - page1 → src/page1 (ORDER, /api/orders) — không trộn code với page khác.
 * - page2 / page3 → placeholder trong ./pages; khi làm bài hãy tách ./page2, ./page3 tương tự page1.
 */
import { useState } from "react";
import AppShell from "./components/AppShell";
import { Page1OrderView } from "./page1";
import Page2 from "./pages/Page2";
import Page3 from "./pages/Page3";
// 1. Import trang mới
import ReportDashboardPage from "./pages/ReportDashboardPage";

// 2. Thêm tab Báo cáo
const TABS = [
  { id: "page1", label: "Page 1 (Order)" },
  { id: "page2", label: "Page 2" },
  { id: "page3", label: "Page 3" },
  { id: "report", label: "Báo Cáo Hiệu Suất" } 
];

export default function App() {
  const [activeTab, setActiveTab] = useState("page1");

  return (
    <AppShell tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "page1" ? <Page1OrderView /> : null}
      {activeTab === "page2" ? <Page2 /> : null}
      {activeTab === "page3" ? <Page3 /> : null}
      
      {/* 3. Render trang báo cáo khi tab được chọn */}
      {activeTab === "report" ? <ReportDashboardPage /> : null}
    </AppShell>
  );
}