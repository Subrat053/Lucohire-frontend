import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { 
  HiOutlineServer, HiOutlineChip, HiOutlineDatabase, 
  HiOutlineBriefcase, HiOutlineUsers, HiOutlineLightningBolt
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import DashboardStatsCard from '../../components/admin/DashboardStatsCard';

const HealthDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState(7);

  useEffect(() => {
    fetchMetrics(daysFilter);
    const interval = setInterval(() => fetchMetrics(daysFilter), 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [daysFilter]);

  const fetchMetrics = async (days = daysFilter) => {
    try {
      const response = await adminAPI.getHealthMetrics({ days });
      if (response.data.success) {
        setMetrics(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch health metrics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-sm font-medium text-gray-500">Loading System Metrics...</div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50/50 min-h-screen">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#0F172A] flex items-center gap-2">
            Health & Cost Monitor
          </h1>
          <p className="text-[13px] font-medium text-gray-500 mt-0.5">Real-time system operational metrics and infrastructure health</p>
        </div>
      </div>

      {/* KPI Cards Row (6 cols) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <DashboardStatsCard 
          icon={HiOutlineChip} 
          label="CPU Load (1m)" 
          value={metrics.infrastructure.cpu.loadAverage[0].toFixed(2)} 
          bgClass="bg-indigo-50"
          colorClass="text-indigo-500"
          sparklineColor="#6366F1"
        />
        <DashboardStatsCard 
          icon={HiOutlineDatabase} 
          label="RAM Usage" 
          value={`${metrics.infrastructure.memory.percentage}%`} 
          bgClass="bg-amber-50"
          colorClass="text-amber-500"
          sparklineColor="#F59E0B"
        />
        <DashboardStatsCard 
          icon={HiOutlineLightningBolt} 
          label="BullMQ Status" 
          value={metrics.infrastructure.queues.status === 'active' ? 'Active' : 'Disabled'} 
          bgClass={metrics.infrastructure.queues.status === 'active' ? 'bg-emerald-50' : 'bg-red-50'}
          colorClass={metrics.infrastructure.queues.status === 'active' ? 'text-emerald-500' : 'text-red-500'}
          sparklineColor={metrics.infrastructure.queues.status === 'active' ? '#10B981' : '#EF4444'}
        />
        <DashboardStatsCard 
          icon={HiOutlineBriefcase} 
          label="Total Jobs Indexed" 
          value={metrics.business.totalJobs.toLocaleString('en-IN')} 
          bgClass="bg-blue-50"
          colorClass="text-blue-500"
          sparklineColor="#3B82F6"
        />
        <DashboardStatsCard 
          icon={HiOutlineBriefcase} 
          label="Active Jobs" 
          value={metrics.business.activeJobs.toLocaleString('en-IN')} 
          bgClass="bg-orange-50"
          colorClass="text-orange-500"
          sparklineColor="#F97316"
        />
        <DashboardStatsCard 
          icon={HiOutlineUsers} 
          label="Total Candidates" 
          value={metrics.business.totalProviders.toLocaleString('en-IN')} 
          bgClass="bg-teal-50"
          colorClass="text-teal-500"
          sparklineColor="#14B8A6"
        />
      </div>

      {/* Row 2: API Costs & Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Cost Monitors */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-900">API Burn Rate ({daysFilter} Days)</h3>
            <select
              value={daysFilter}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDaysFilter(val);
                fetchMetrics(val);
              }}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(metrics.costs.summary).map(([service, costData]) => (
              <div key={service} className="bg-gray-50/50 rounded-lg border border-gray-100 p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <p className="text-[11px] font-extrabold text-gray-800 uppercase tracking-wider">{service}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">{costData.status || 'Active'}</span>
                  </div>
                  <p className="text-[10px] font-medium text-gray-500 truncate mb-2">{costData.category || 'External API'}</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-gray-900">₹{(costData.totalCostInInr || 0).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{((costData.totalTokens || 0) + (costData.totalCompute || 0)).toLocaleString()} UNITS</p>
                </div>
              </div>
            ))}
          </div>

          <div className="h-[250px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.costs.history} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  axisLine={false} 
                  tickLine={false} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 10 }} 
                  tickFormatter={(val) => `₹${val}`} 
                  width={60}
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '11px' }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, undefined]}
                />
                <Line type="monotone" dataKey="OpenAI" stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Gemini" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3, fill: '#8B5CF6', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Stripe" stroke="#0284C7" strokeWidth={2} dot={{ r: 3, fill: '#0284C7', strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Server Log & Queues */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-gray-900">Background Queues</h3>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-100">
              {metrics.infrastructure.queues.mode || 'BullMQ'}
            </span>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="pb-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Queue</th>
                  <th className="pb-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Active</th>
                  <th className="pb-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Waiting</th>
                  <th className="pb-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Object.entries(metrics.infrastructure.queues.queues || {}).map(([qName, counts]) => (
                  <tr key={qName} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3">
                      <span className="text-[11px] font-bold text-gray-800">{qName}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-[11px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{counts.active || 0}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-[11px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">{counts.waiting || 0}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{(counts.completed || 0).toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        </div>
      </div>
      
    </div>
  );
};

export default HealthDashboard;
