import React from 'react';
import { FiArrowUpRight, FiChevronDown, FiExternalLink } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const SCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

const jobs = [
  { type: 'Featured', dot: 'bg-indigo-600', label: 'Senior React Developer',   dept: 'Engineering',   jobs: 3, apps: 420, hires: 4, ratio: 1.33, daysOpen: 18, status: 'Active'   },
  { type: 'Featured', dot: 'bg-indigo-600', label: 'Product Manager',           dept: 'Product',       jobs: 2, apps: 380, hires: 4, ratio: 2.00, daysOpen: 22, status: 'Active'   },
  { type: 'Urgent',   dot: 'bg-orange-500', label: 'DevOps Engineer',           dept: 'Engineering',   jobs: 3, apps: 310, hires: 4, ratio: 1.33, daysOpen: 12, status: 'Active'   },
  { type: 'Urgent',   dot: 'bg-orange-500', label: 'UX Designer',               dept: 'Design',        jobs: 2, apps: 280, hires: 4, ratio: 2.00, daysOpen: 14, status: 'Active'   },
  { type: 'Normal',   dot: 'bg-blue-500',   label: 'Backend Developer (Node)',   dept: 'Engineering',   jobs: 5, apps: 240, hires: 2, ratio: 0.40, daysOpen: 30, status: 'Active'   },
  { type: 'Normal',   dot: 'bg-blue-500',   label: 'Sales Executive',            dept: 'Sales',         jobs: 6, apps: 210, hires: 1, ratio: 0.17, daysOpen: 35, status: 'Active'   },
  { type: 'Normal',   dot: 'bg-blue-500',   label: 'Content Marketing Specialist',dept: 'Marketing',   jobs: 4, apps: 180, hires: 1, ratio: 0.25, daysOpen: 28, status: 'Paused'   },
  { type: 'Normal',   dot: 'bg-blue-500',   label: 'Data Analyst',               dept: 'Analytics',    jobs: 4, apps: 100, hires: 0, ratio: 0.00, daysOpen: 45, status: 'Closed'   },
];

const jobTypeStats = [
  { dot: 'bg-indigo-600', type: 'Featured Jobs', count: 12, apps: '1,248', hires: 14, ratio: '1.17', avg_cost: '₹9,200'  },
  { dot: 'bg-orange-500', type: 'Urgent Jobs',   count: 8,  apps: '864',   hires: 10, ratio: '1.25', avg_cost: '₹11,800' },
  { dot: 'bg-blue-500',   type: 'Normal Jobs',   count: 28, apps: '730',   hires: 4,  ratio: '0.14', avg_cost: '₹14,200' },
];

export default function JobPerformancePage() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Jobs Posted',  value: '48',   sub: '+14% vs last month' },
          { label: 'Total Applications', value: '2,842',sub: '+18% vs last month' },
          { label: 'Total Hires',        value: '28',   sub: '+27% vs last month' },
          { label: 'Avg. Time to Fill',  value: '26 d', sub: '-5 days vs last month' },
        ].map((k, i) => (
          <SCard key={i} className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">{k.label}</div>
            <div className="text-2xl font-extrabold text-gray-900 mb-1">{k.value}</div>
            <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
              <FiArrowUpRight className="w-3 h-3" /> {k.sub}
            </div>
          </SCard>
        ))}
      </div>

      {/* Job Type Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {jobTypeStats.map((j, i) => (
          <SCard key={i} className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-3 h-3 rounded-full ${j.dot}`} />
              <span className="text-sm font-bold text-gray-900">{j.type}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Jobs</div>
                <div className="text-xl font-extrabold text-gray-900">{j.count}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Applications</div>
                <div className="text-xl font-extrabold text-gray-900">{j.apps}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Hires</div>
                <div className="text-xl font-extrabold text-emerald-700">{j.hires}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Hires/Job</div>
                <div className="text-xl font-extrabold text-gray-900">{j.ratio}</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] font-semibold text-gray-500">
              Avg. cost/hire: <span className="text-gray-900 font-bold">{j.avg_cost}</span>
            </div>
          </SCard>
        ))}
      </div>

      {/* Job Detail Table */}
      <SCard className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">Individual Job Performance</h2>
            <p className="text-xs text-gray-500 mt-0.5">All job postings with detailed performance metrics</p>
          </div>
          <button className="text-xs font-semibold text-gray-400 flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded-lg">
            All Status <FiChevronDown className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[680px]">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="pb-3">Job Title</th>
                <th className="pb-3">Type</th>
                <th className="pb-3 text-center">Apps</th>
                <th className="pb-3 text-center">Hires</th>
                <th className="pb-3 text-center">Hires/Job</th>
                <th className="pb-3 text-center">Days Open</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 transition group">
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition">{j.label}</span>
                      <FiExternalLink className="w-3 h-3 text-gray-300 group-hover:text-indigo-400 transition" />
                    </div>
                    <div className="text-[10px] font-semibold text-gray-400">{j.dept}</div>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${j.dot}`} />
                      <span className="text-[11px] font-semibold text-gray-600">{j.type}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-center text-xs font-semibold text-gray-700">{j.apps}</td>
                  <td className="py-3.5 text-center text-xs font-bold text-gray-900">{j.hires}</td>
                  <td className="py-3.5 text-center">
                    <span className={`text-xs font-bold ${j.ratio >= 1 ? 'text-emerald-600' : j.ratio > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                      {j.ratio.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3.5 text-center text-xs font-semibold text-gray-700">{j.daysOpen}d</td>
                  <td className="py-3.5 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      j.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                      j.status === 'Paused' ? 'bg-orange-50 text-orange-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>{j.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SCard>

      {/* AI Tip */}
      <SCard className="p-5 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-100">
        <div className="flex items-start gap-4">
          <div className="bg-orange-100 text-orange-600 p-2.5 rounded-xl shrink-0"><HiSparkles className="w-5 h-5" /></div>
          <div>
            <h3 className="text-sm font-bold text-orange-900 mb-2">Job Optimization Insight</h3>
            <p className="text-xs text-orange-800/80 leading-relaxed">
              Your "Data Analyst" role has been open for 45 days with 0 hires. Consider reviewing the salary band (market shows ₹8–12 LPA) and skill requirements. Also, "Content Marketing Specialist" is paused but has 180 applications pending review — resuming it could yield quick hires.
            </p>
          </div>
        </div>
      </SCard>
    </div>
  );
}
