//  Component để hiển thị những con số nổi bật dạng thẻ 
// (Ví dụ: Thẻ "Rạp doanh thu cao nhất: CGV Sư Vạn Hạnh - 500tr", "Giờ vàng: 19h-21h").
//  Component để hiển thị những con số nổi bật dạng thẻ 
// (Ví dụ: Thẻ "Rạp doanh thu cao nhất: CGV Sư Vạn Hạnh - 500tr", "Giờ vàng: 19h-21h").
import { Calendar, Users } from "lucide-react";

export default function StatCard({ type, title, value, subtitle }) {
  const Icon = type === 'calendar' ? Calendar : Users;
  
  return (
    <div className="card-surface" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', marginBottom: '16px' }}>
        <Icon size={20} color="#e50914" />
        <span>{title}</span>
      </div>
      <h3 style={{ fontSize: '2rem', margin: '0 0 8px 0', color: '#fff' }}>{value}</h3>
      <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>{subtitle}</p>
    </div>
  );
}