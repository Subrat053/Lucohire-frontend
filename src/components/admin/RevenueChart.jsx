import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const RevenueChart = ({ data = [] }) => {
  const [period, setPeriod] = useState('monthly');

  const chartData = data.map((item) => ({
    name: MONTHS[(item.month || 1) - 1] || 'N/A',
    revenue: item.revenue || 0,
    count: item.count || 0,
  }));

  // If no data, show placeholder
  if (chartData.length === 0) {
    for (let i = 0; i < 12; i++) {
      chartData.push({ name: MONTHS[i], revenue: 0, count: 0 });
    }
  }

  const formatCurrency = (val) => `₹${(val / 1000).toFixed(0)}K`;

  return (
    <div className="bg-white rounded-3xl border border-[#EAE7F2] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-extrabold text-gray-900 text-base">Revenue Trend</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Platform earnings over time (in lakhs ₹)</p>
        </div>
        <div className="flex gap-1 bg-white border border-[#EAE7F2] rounded-full p-1 shadow-sm">
          {['monthly', 'quarterly', 'yearly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                period === p
                  ? 'bg-gray-100 text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: '12px',
              }}
              formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#7C3AED"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#7C3AED', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
