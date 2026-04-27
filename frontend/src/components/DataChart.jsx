// Nếu nhóm có xài thư viện vẽ biểu đồ (như recharts hoặc chart.js) 
// thì tách riêng component này ra để vẽ biểu đồ cột cho tỉ lệ lấp đầy hoặc doanh thu theo khung giờ.
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { TrendingUp } from 'lucide-react';
 
export default function DataChart({ data }) {
  return (
    <div className="card-surface" style={{ padding: '24px', marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0' }}>Xu Hướng Tỷ Lệ Lấp Đầy</h2>
          <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>Biểu đồ so sánh hiệu suất theo tháng</p>
        </div>
        <TrendingUp color="#e50914" />
      </div>
      {/* ✅ Fix recharts warning: thêm minHeight + width tường minh */}
      <div style={{ width: '100%', minHeight: '300px', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="month" stroke="#888" />
            <YAxis stroke="#888" domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#222', borderColor: '#444' }}
              itemStyle={{ color: '#e50914' }}
            />
            <ReferenceLine x="T5" stroke="#fff" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="occupancy"
              name="Tỷ lệ lấp đầy (%)"
              stroke="#e50914"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}