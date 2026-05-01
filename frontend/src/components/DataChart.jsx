import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';

export default function DataChart({ data, title, subtitle, type = 'line', color = '#e50914' }) {
  return (
    <div style={{ padding: '24px', backgroundColor: '#141414', borderRadius: '8px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '1.25rem' }}>{title}</h2>
          <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>{subtitle}</p>
        </div>
        {type === 'line' ? <TrendingUp color={color} /> : <DollarSign color={color} />}
      </div>
      
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              
              {/* ✅ ĐÃ ĐỔI tick fill thành #fff (Màu trắng) */}
              <XAxis dataKey="label" stroke="#333" tick={{ fill: '#fff', fontSize: '0.8rem' }} />
              <YAxis stroke="#333" domain={[0, 100]} tick={{ fill: '#fff', fontSize: '0.8rem' }} />
              
              <Tooltip
                contentStyle={{ backgroundColor: '#222', borderColor: '#444', color: '#fff' }}
                itemStyle={{ color: color }}
              />
              <Line
                type="monotone"
                dataKey="value"
                name="Tỷ lệ lấp đầy (%)"
                stroke={color}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              
              {/* ✅ ĐÃ ĐỔI tick fill thành #fff (Màu trắng) */}
              <XAxis dataKey="label" stroke="#333" tick={{ fill: '#fff', fontSize: '0.8rem' }} />
              <YAxis 
                stroke="#333" 
                tickFormatter={(val) => `${val / 1000000}tr`} 
                tick={{ fill: '#fff', fontSize: '0.8rem' }} 
              />
              
              <Tooltip
                contentStyle={{ backgroundColor: '#222', borderColor: '#444', color: '#fff' }}
                itemStyle={{ color: color }}
                formatter={(val) => `${Number(val).toLocaleString('vi-VN')} đ`}
              />
              <Bar dataKey="value" name="Doanh thu" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}