import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Activity, Server, Cpu, Database, DollarSign, Users, Briefcase, Zap
} from 'lucide-react';
import { adminAPI } from '../../services/api';

const HealthDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await adminAPI.getHealthMetrics();
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
    return <div className="p-8 text-center text-gray-500">Loading Health Metrics...</div>;
  }

  if (!metrics) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-600" />
          Super Admin Health & Cost Monitor
        </h1>
        <p className="text-sm text-gray-500 mt-1">Real-time system operational metrics and infrastructure health</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Business Parameters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-500" /> Business Parameters
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-gray-100 pb-3">
              <div>
                <p className="text-xs text-gray-500">Total Jobs Indexed</p>
                <p className="text-2xl font-black text-gray-900">{metrics.business.totalJobs.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Active Jobs</p>
                <p className="text-lg font-bold text-blue-600">{metrics.business.activeJobs.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex justify-between items-end pb-1">
              <div>
                <p className="text-xs text-gray-500">Total Candidates</p>
                <p className="text-2xl font-black text-gray-900">{metrics.business.totalProviders.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Active / Visible</p>
                <p className="text-lg font-bold text-green-600">{metrics.business.activeProviders.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Server Infrastructure */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-500" /> Server Infrastructure
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <Cpu className="w-3.5 h-3.5" /> CPU Load
              </div>
              <div className="text-lg font-bold text-gray-800">
                {metrics.infrastructure.cpu.loadAverage[0].toFixed(2)}
                <span className="text-xs font-normal text-gray-500 ml-1">/ 1min</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <Database className="w-3.5 h-3.5" /> RAM Usage
              </div>
              <div className="text-lg font-bold text-gray-800">
                {metrics.infrastructure.memory.percentage}%
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <Activity className="w-3.5 h-3.5" /> CPU Cores
              </div>
              <div className="text-lg font-bold text-gray-800">
                {metrics.infrastructure.cpu.cores}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <Zap className="w-3.5 h-3.5" /> BullMQ Status
              </div>
              <div className={`text-lg font-bold ${metrics.infrastructure.queues.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.infrastructure.queues.status.toUpperCase()}
              </div>
            </div>
          </div>
          
          {/* Queue Info */}
          {metrics.infrastructure.queues.status === 'active' && (
            <div className="mt-4 text-xs font-mono bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto">
              <p className="text-gray-400 mb-1">// Active Queues Worker States</p>
              {Object.entries(metrics.infrastructure.queues.queues).map(([qName, counts]) => (
                <div key={qName} className="flex gap-4 mb-1">
                  <span className="w-32 truncate">{qName}:</span>
                  <span className="text-white">Wait: {counts.waiting || 0}</span>
                  <span className="text-blue-300">Active: {counts.active || 0}</span>
                  <span className="text-red-400">Failed: {counts.failed || 0}</span>
                  <span className="text-yellow-400">Delayed: {counts.delayed || 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cost Monitors */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-500" /> Costing Invoices & API Burn Rate
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(metrics.costs.summary).map(([service, costData]) => (
            <div key={service} className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">{service}</p>
              <p className="text-2xl font-black text-gray-900">${costData.totalCost.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">Tokens/Units: {(costData.totalTokens + costData.totalCompute).toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.costs.history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `$${val}`} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`$${value}`, undefined]}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="OpenAI" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Apify" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Instantly" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="MetaCloud" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
    </div>
  );
};

export default HealthDashboard;
