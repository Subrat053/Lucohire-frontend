import React, { useState } from 'react';
import { FiChevronDown, FiArrowUpRight, FiUsers, FiClock, FiCheckCircle } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const SCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

export default function HiringFunnelPage() {
  const [period, setPeriod] = useState('This Month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    import('../../services/api').then(({ recruiterAPI }) => {
      recruiterAPI.getHiringFunnel()
        .then(res => setData(res.data.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    });
  }, [period]);

  if (loading || !data) return <div className="p-12 text-center text-gray-500 font-bold">Loading funnel data...</div>;

  const { stages, weeklyData, conversionRates } = data;

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {stages.map((s, i) => {
          const growth = (((s.value - s.prev) / s.prev) * 100).toFixed(1);
          return (
            <SCard key={i} className="p-4">
              <div className={`w-8 h-1.5 rounded-full ${s.bg} mb-3`} />
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">{s.label}</div>
              <div className="text-2xl font-extrabold text-gray-900 mb-1">{s.value.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                <FiArrowUpRight className="w-3 h-3" /> +{growth}% vs last month
              </div>
            </SCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Funnel Visual */}
        <SCard className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Funnel Breakdown</h2>
              <p className="text-xs text-gray-500 mt-0.5">Stage-by-stage candidate progression</p>
            </div>
            <button className="text-xs font-semibold text-gray-400 flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded-lg">
              {period} <FiChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {stages.map((s, i) => {
              const nextVal = stages[i + 1]?.value;
              const dropOff = nextVal ? s.value - nextVal : 0;
              return (
                <div key={i}>
                  <div className="flex items-center gap-4 mb-1">
                    <div className="w-24 text-xs font-semibold text-gray-700 shrink-0">{s.label}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden relative">
                      <div
                        className={`h-full ${s.bg} flex items-center pl-4 text-white text-xs font-bold rounded-full transition-all`}
                        style={{ width: `${s.pct < 2 ? 8 : s.pct}%` }}
                      >
                        {s.pct >= 10 ? `${s.pct}%` : ''}
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <div className="text-sm font-bold text-gray-900">{s.value.toLocaleString()}</div>
                      <div className="text-[10px] text-gray-400">{s.pct}%</div>
                    </div>
                  </div>
                  {dropOff > 0 && (
                    <div className="ml-24 pl-4 text-[10px] font-semibold text-red-400 flex items-center gap-1 mb-2">
                      ↓ {dropOff.toLocaleString()} dropped off ({(100 - stages[i+1].pct).toFixed(0)}% drop)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SCard>

        {/* Conversion Rates */}
        <SCard className="p-6 flex flex-col">
          <h2 className="text-base font-bold text-gray-900 mb-5">Conversion Rates</h2>
          <div className="space-y-4 flex-1">
            {conversionRates.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50/60 rounded-xl">
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 mb-1">{c.from}</div>
                  <div className="text-xl font-extrabold text-gray-900">{c.rate}</div>
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-bold ${c.up ? 'text-emerald-600' : 'text-red-500'}`}>
                  <FiArrowUpRight className="w-4 h-4" /> {c.change}
                </div>
              </div>
            ))}
          </div>
        </SCard>
      </div>

      {/* Weekly Breakdown Table */}
      <SCard className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">Weekly Funnel Breakdown</h2>
            <p className="text-xs text-gray-500 mt-0.5">How the funnel performed each week this month</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="pb-3">Week</th>
                <th className="pb-3 text-center">Applications</th>
                <th className="pb-3 text-center">Screening</th>
                <th className="pb-3 text-center">Interviews</th>
                <th className="pb-3 text-center">Offers</th>
                <th className="pb-3 text-right">Hires</th>
              </tr>
            </thead>
            <tbody>
              {weeklyData.map((w, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 transition">
                  <td className="py-3.5 font-semibold text-sm text-gray-800">{w.week}</td>
                  <td className="py-3.5 text-center text-xs font-semibold text-indigo-700 bg-indigo-50/50">{w.apps}</td>
                  <td className="py-3.5 text-center text-xs font-semibold text-blue-700">{w.screen}</td>
                  <td className="py-3.5 text-center text-xs font-semibold text-emerald-700">{w.interviews}</td>
                  <td className="py-3.5 text-center text-xs font-semibold text-orange-700">{w.offers}</td>
                  <td className="py-3.5 text-right text-xs font-bold text-emerald-800">{w.hires}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="py-3 font-bold text-sm text-gray-900">Total</td>
                <td className="py-3 text-center text-sm font-bold text-gray-900">2,842</td>
                <td className="py-3 text-center text-sm font-bold text-gray-900">1,156</td>
                <td className="py-3 text-center text-sm font-bold text-gray-900">312</td>
                <td className="py-3 text-center text-sm font-bold text-gray-900">42</td>
                <td className="py-3 text-right text-sm font-bold text-gray-900">28</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SCard>

      {/* AI Insight */}
      <SCard className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl shrink-0">
            <HiSparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-indigo-900 mb-2">AI Funnel Analysis</h3>
            <p className="text-xs text-indigo-800/80 leading-relaxed">
              The screening-to-interview drop (27%) is your biggest bottleneck. Consider revising your screening criteria or adding an ATS screening step to improve quality at earlier stages. The offer acceptance rate of 66.7% is healthy, suggesting strong candidate alignment with your JD and compensation.
            </p>
          </div>
        </div>
      </SCard>
    </div>
  );
}
