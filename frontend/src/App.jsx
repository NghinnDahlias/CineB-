import { useState } from "react";
import AppShell from "./components/AppShell";
import ShowtimeCrudPage from "./pages/ShowtimeCrudPage";
import ShowtimeListPage from "./pages/ShowtimeListPage";
import AnalyticsPage from "./pages/AnalyticsPage";

const TABS = [
  {
    id: "crud",
    label: "3.1 CRUD Showtime",
    description: "Form for create, update, delete by procedure 2.1"
  },
  {
    id: "list",
    label: "3.2 List + Search",
    description: "Search, sort, list and row actions by procedure 2.3"
  },
  {
    id: "analytics",
    label: "3.3 Analytics",
    description: "Analytics dashboard by procedure/function in 2.3/2.4"
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("crud");
  const [selectedShowtime, setSelectedShowtime] = useState(null);

  return (
    <AppShell tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "crud" ? (
        <ShowtimeCrudPage selectedShowtime={selectedShowtime} />
      ) : null}

      {activeTab === "list" ? (
        <ShowtimeListPage
          onEditShowtime={(row) => {
            setSelectedShowtime(row);
            setActiveTab("crud");
          }}
        />
      ) : null}

      {activeTab === "analytics" ? <AnalyticsPage /> : null}
    </AppShell>
  );
}
