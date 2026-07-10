import React from 'react';
import { FiArrowUpRight, FiArrowDownRight, FiChevronDown, FiDownload } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const SCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

const sources = [
  { color: '#6366f1', bg: 'bg-indigo-500',  label: 'LinkedIn',             total: 912, hires: 9,  cost: '₹8,200', quality: 92, pct: 32 },
  { color: '#a855f7', bg: 'bg-purple-500',  label: 'Lucohire Career Page', total: 683, hires: 8,  cost: '₹2,100', quality: 88, pct: 24 },
  { color: '#10b981', bg: 'bg-emerald-500', label: 'Employee Referral',    total: 540, hires: 7,  cost: '₹3,500', quality: 95, pct: 19 },
  { color: '#f59e0b', bg: 'bg-orange-500',  label: 'Naukri',               total: 356, hires: 3,  cost: '₹12,400',quality: 72, pct: 13 },
  { color: '#3b82f6', bg: 'bg-blue-500',    label: 'Indeed',               total: 198, hires: 1,  cost: '₹14,200',quality: 68, pct: 7  },
  { color: '#94a3b8', bg: 'bg-slate-400',   label: 'Others',               total: 153, hires: 0,  cost: '—',      quality: 61, pct: 5  },
];

const monthlyTrend = [
  { month: 'Jan', linkedin: 720, lucohire: 580, referral: 440 },
  { month: 'Feb', linkedin: 790, lucohire: 610, referral: 420 },
  { month: 'Mar', linkedin: 850, lucohire: 650, referral: 510 },
  { month: 'Apr', linkedin: 880, lucohire: 670, referral: 520 },
  { month: 'May', linkedin: 912, lucohire: 683, referral: 540 },
];

export default function SourceAnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: '2,842', trend: '+18%', up: true },
          { label: 'Top Source',         value: 'LinkedIn', trend: '32% share', up: true },
          { label: 'Best Quality Source',value: 'Referral', trend: '95% quality score', up: true },
          { label: 'Lowest Cost/Hire',   value: '₹2,100',  trend: 'Lucohire Career', up: true },
        ].map((k, i) => (
          <SCard key={i} className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">{k.label}</div>
            <div className="text-xl font-extrabold text-gray-900 mb-1">{k.value}</div>
            <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
              <FiArrowUpRight className="w-3 h-3" /> {k.trend}
            </div>
          </SCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut + Legend */}
        <SCard className="p-6">
          <h2 className="text-base font-bold text-gray-900 mb-6">Source Distribution</h2>
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-44 h-44 rounded-full"
              style={{ background: 'conic-gradient(#6366f1 0% 32%,#a855f7 32% 56%,#10b981 56% 75%,#f59e0b 75% 88%,#3b82f6 88% 95%,#94a3b8 95% 100%)' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center">
                  <div className="text-2xl font-extrabold text-gray-900">2,842</div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide text-center">Total Applications</div>
                </div>
              </div>
            </div>
            <div className="w-full space-y-2.5">
              {sources.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.bg}`} />
                  <span className="text-xs font-medium text-gray-700 flex-1">{s.label}</span>
                  <span className="text-xs font-bold text-gray-900">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </SCard>

        {/* Detailed Table */}
        <SCard className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">Source Performance Details</h2>
            <button className="text-xs font-semibold text-gray-400 flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded-lg">
              This Month <FiChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-3">Source</th>
                  <th className="pb-3 text-center">Applications</th>
                  <th className="pb-3 text-center">Hires</th>
                  <th className="pb-3 text-center">Cost/Hire</th>
                  <th className="pb-3 text-right">Quality Score</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 transition">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${s.bg}`} />
                        <span className="text-xs font-semibold text-gray-900">{s.label}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-center text-xs font-semibold text-gray-700">{s.total}</td>
                    <td className="py-3.5 text-center text-xs font-bold text-gray-900">{s.hires}</td>
                    <td className="py-3.5 text-center text-xs font-semibold text-gray-700">{s.cost}</td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${s.quality}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-900 w-8 text-right">{s.quality}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SCard>
      </div>

      {/* Monthly trend */}
      <SCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900">Monthly Source Trend</h2>
            <p className="text-xs text-gray-500 mt-0.5">Top 3 sources over the last 5 months</p>
          </div>
          <button className="text-xs font-semibold text-gray-400 flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded-lg">
            Last 5 Months <FiChevronDown className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[400px]">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="pb-3">Month</th>
                <th className="pb-3 text-center text-indigo-600">LinkedIn</th>
                <th className="pb-3 text-center text-purple-600">Lucohire Career</th>
                <th className="pb-3 text-right text-emerald-600">Employee Referral</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTrend.map((m, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 transition">
                  <td className="py-3 text-xs font-bold text-gray-900">{m.month}</td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 bg-indigo-100 rounded-full h-1.5"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(m.linkedin/912)*100}%` }} /></div>
                      <span className="text-xs font-semibold text-gray-700 w-8">{m.linkedin}</span>
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 bg-purple-100 rounded-full h-1.5"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${(m.lucohire/683)*100}%` }} /></div>
                      <span className="text-xs font-semibold text-gray-700 w-8">{m.lucohire}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 bg-emerald-100 rounded-full h-1.5"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(m.referral/540)*100}%` }} /></div>
                      <span className="text-xs font-semibold text-gray-700 w-8">{m.referral}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SCard>

      {/* AI Tip */}
      <SCard className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100">
        <div className="flex items-start gap-4">
          <div className="bg-purple-100 text-purple-600 p-2.5 rounded-xl shrink-0"><HiSparkles className="w-5 h-5" /></div>
          <div>
            <h3 className="text-sm font-bold text-purple-900 mb-2">Source Optimization Insight</h3>
            <p className="text-xs text-purple-800/80 leading-relaxed">
              Employee Referrals have the highest quality score (95) but only account for 19% of applications. Consider launching a referral bonus campaign to boost this channel — referred candidates typically onboard 40% faster and have 50% better retention rates.
            </p>
          </div>
        </div>
      </SCard>
    </div>
  );
}
