import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiUsers, HiBriefcase, HiCurrencyRupee, HiShieldCheck, HiTrendingUp, HiDocumentReport } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const TrendSparkline = ({ series = [] }) => {
  const width = 220;
  const height = 56;
  const padding = 6;

  if (!Array.isArray(series) || series.length === 0) {
    return <div className="text-xs text-gray-400">No trend data</div>;
  }

  const values = series.map((item) => Number(item.costUsd || 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((value, index) => {
    const x = padding + (index * ((width - (padding * 2)) / Math.max(1, values.length - 1)));
    const y = height - padding - (((value - min) / range) * (height - (padding * 2)));
    return `${x},${Number(y.toFixed(2))}`;
  }).join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        fill="rgba(79,70,229,0.12)"
        stroke="none"
        points={areaPoints}
      />
      <polyline
        fill="none"
        stroke="rgb(79,70,229)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [aiUsage, setAiUsage] = useState({ summary: null, byFeature: [], trend: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const [dashboardRes, usageRes] = await Promise.allSettled([
        adminAPI.getDashboard(),
        adminAPI.getAIUsageDashboard(),
      ]);

      if (dashboardRes.status === 'fulfilled') {
        setDashboard(dashboardRes.value.data);
      }

      if (usageRes.status === 'fulfilled') {
        setAiUsage({
          summary: usageRes.value.data?.summary || null,
          byFeature: usageRes.value.data?.byFeature || [],
          trend: usageRes.value.data?.trend || null,
        });
      }

      if (dashboardRes.status !== 'fulfilled') {
        throw dashboardRes.reason;
      }
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="Loading admin panel..." /></div>;

  const stats = dashboard?.stats || {};
  const recentUsers = dashboard?.recentUsers || [];
  const aiSummary = aiUsage.summary || {
    totalRequests: 0,
    totalCostUsd: 0,
    avgLatencyMs: 0,
  };
  const topAiCostFeatures = (aiUsage.byFeature || []).slice(0, 3);
  const wowCostPct = aiUsage.trend?.weekOverWeek?.costDeltaPct;
  const wowCostDeltaUsd = Number(aiUsage.trend?.weekOverWeek?.costDeltaUsd || 0);
  const wowPositive = typeof wowCostPct === 'number' ? wowCostPct >= 0 : null;
  const wowBadgeClass = wowPositive === null
    ? 'bg-gray-100 text-gray-600'
    : wowPositive
      ? 'bg-red-50 text-red-700'
      : 'bg-green-50 text-green-700';
  const wowLabel = wowPositive === null
    ? 'WoW N/A'
    : `${wowPositive ? '+' : ''}${wowCostPct.toFixed(1)}% WoW`;

  const statsGrid = [
    { label: 'Recruiter Approvals Pending', value: stats?.pendingRecruiterApprovals || 0, icon: HiBriefcase, color: 'bg-amber-50 text-amber-600' },
    { label: 'Total Users', value: stats.totalUsers || 0, icon: HiUsers, color: 'bg-blue-50 text-blue-600' },
    { label: 'Providers', value: stats.totalProviders || 0, icon: HiShieldCheck, color: 'bg-green-50 text-green-600' },
    { label: 'Recruiters', value: stats.totalRecruiters || 0, icon: HiBriefcase, color: 'bg-purple-50 text-purple-600' },
    { label: 'Total Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, icon: HiCurrencyRupee, color: 'bg-orange-50 text-orange-600' },
    { label: 'Total Jobs', value: stats.totalJobs || 0, icon: HiDocumentReport, color: 'bg-pink-50 text-pink-600' },
    { label: 'Total Leads', value: stats.totalLeads || 0, icon: HiTrendingUp, color: 'bg-teal-50 text-teal-600' },
    { label: 'Payments', value: stats.totalPayments || 0, icon: HiCurrencyRupee, color: 'bg-indigo-50 text-indigo-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard 📊</h1>
        <p className="text-gray-500 mt-1">ServiceHub control panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsGrid.map((stat, index) => (
          <div key={index} className={`p-4 rounded-lg shadow ${stat.color}`}>
            <stat.icon className="w-6 h-6 mb-2" />
            <div className="text-lg font-bold">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Manage Users', link: '/admin/users', icon: HiUsers, color: 'bg-blue-600' },
          { label: 'Manage Providers', link: '/admin/providers', icon: HiShieldCheck, color: 'bg-green-600' },
          { label: 'Manage Recruiters', link: '/admin/recruiters', icon: HiBriefcase, color: 'bg-amber-600' },
          { label: 'Manage Plans', link: '/admin/plans', icon: HiCurrencyRupee, color: 'bg-purple-600' },
          { label: 'Settings', link: '/admin/settings', icon: HiDocumentReport, color: 'bg-orange-600' },
        ].map((item, i) => (
          <Link key={i} to={item.link} className={`${item.color} text-white rounded-2xl p-5 hover:opacity-90 transition`}>
            <item.icon className="w-8 h-8 mb-2 opacity-80" />
            <span className="font-semibold">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* AI Ops Snapshot */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900">AI Ops Snapshot</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${wowBadgeClass}`}>{wowLabel}</span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Top AI cost features, performance overview, and weekly spend trend</p>
          </div>
          <Link
            to="/admin/ai"
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Open AI Ops
          </Link>
        </div>

        <div className="rounded-xl border border-gray-100 bg-indigo-50/40 p-3 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-gray-600">Last 7 Days AI Cost Trend</p>
            <p className="text-xs text-gray-600">{wowPositive === null ? 'No previous week baseline' : `${wowCostDeltaUsd >= 0 ? '+' : ''}$${wowCostDeltaUsd.toFixed(4)} vs previous week`}</p>
          </div>
          <TrendSparkline series={aiUsage.trend?.dailyCostSeries || []} />
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl border border-gray-100 p-3 bg-gray-50">
            <p className="text-xs text-gray-500">AI Requests</p>
            <p className="text-lg font-bold text-gray-900">{Number(aiSummary.totalRequests || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-gray-100 p-3 bg-gray-50">
            <p className="text-xs text-gray-500">AI Cost (USD)</p>
            <p className="text-lg font-bold text-gray-900">${Number(aiSummary.totalCostUsd || 0).toFixed(4)}</p>
          </div>
          <div className="rounded-xl border border-gray-100 p-3 bg-gray-50">
            <p className="text-xs text-gray-500">Avg Latency</p>
            <p className="text-lg font-bold text-gray-900">{Math.round(Number(aiSummary.avgLatencyMs || 0))} ms</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Top Cost Features</h3>
          {topAiCostFeatures.length === 0 ? (
            <p className="text-sm text-gray-500">No AI usage records yet.</p>
          ) : (
            <div className="space-y-2">
              {topAiCostFeatures.map((item) => (
                <div key={item._id || 'unknown'} className="flex items-center justify-between rounded-lg border border-gray-100 p-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item._id || 'unknown'}</p>
                    <p className="text-xs text-gray-500">{Number(item.requests || 0).toLocaleString()} requests · {Number(item.tokens || 0).toLocaleString()} tokens</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">${Number(item.costUsd || 0).toFixed(4)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Role</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">{user.name}</td>
                  <td className="py-3 px-2 text-gray-500">{user.email}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'provider' ? 'bg-green-100 text-green-700' :
                      user.role === 'recruiter' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>{user.role}</span>
                  </td>
                  <td className="py-3 px-2 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
