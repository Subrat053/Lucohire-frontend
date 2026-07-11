import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiBriefcase, FiMail, FiUsers, FiCheckCircle, FiClock, FiDollarSign,
  FiArrowUpRight, FiArrowDownRight, FiChevronDown, FiPlus, FiChevronRight, FiFileText, FiDownload, FiArrowRight
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const SCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);
const CardHdr = ({ title, badge, action }) => (
  <div className="flex items-center justify-between mb-5">
    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
      {title}
      {badge && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{badge}</span>}
    </h3>
    {action && <button className="text-xs font-semibold text-gray-400 flex items-center gap-1 hover:text-gray-600">{action} <FiChevronDown className="w-3 h-3" /></button>}
  </div>
);
const ViewBtn = ({ label, to }) => (
  <Link to={to} className="w-full mt-5 pt-4 border-t border-gray-100 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1 transition">
    {label} <FiArrowRight className="w-3.5 h-3.5" />
  </Link>
);

const topMetrics = [
  { label: 'Total Jobs',         value: '48',      trend: '+14%', up: true,  icon: <FiBriefcase />, bg: 'bg-indigo-50', ic: 'text-indigo-600' },
  { label: 'Total Applications', value: '2,842',   trend: '+18%', up: true,  icon: <FiMail />,      bg: 'bg-blue-50',   ic: 'text-blue-600'   },
  { label: 'Interviews',         value: '312',     trend: '+12%', up: true,  icon: <FiUsers />,     bg: 'bg-emerald-50',ic: 'text-emerald-600'},
  { label: 'Offers Extended',    value: '42',      trend: '+20%', up: true,  icon: <FiCheckCircle />,bg: 'bg-orange-50', ic: 'text-orange-600' },
  { label: 'Hires Made',         value: '28',      trend: '+27%', up: true,  icon: <FiBriefcase />, bg: 'bg-purple-50', ic: 'text-purple-600' },
  { label: 'Avg. Time to Hire',  value: '21 Days', trend: '-8%',  up: true,  icon: <FiClock />,     bg: 'bg-sky-50',    ic: 'text-sky-600'    },
  { label: 'Cost per Hire',      value: '₹12,540', trend: '-6%',  up: true,  icon: <FiDollarSign />,bg: 'bg-teal-50',   ic: 'text-teal-600'   },
  { label: 'AI Hiring Score',    value: '87/100',  trend: '+11%', up: true,  icon: <HiSparkles />,  bg: 'bg-violet-50', ic: 'text-violet-600' },
];

const funnelStages = [
  { label: 'Applications', value: '2,842', pct: '100', w: 100, color: 'bg-indigo-600' },
  { label: 'Screening',    value: '1,156', pct: '41',  w: 70,  color: 'bg-blue-500'   },
  { label: 'Interviews',   value: '312',   pct: '11',  w: 45,  color: 'bg-emerald-500'},
  { label: 'Offers',       value: '42',    pct: '1.5', w: 20,  color: 'bg-orange-500' },
  { label: 'Hires',        value: '28',    pct: '1',   w: 12,  color: 'bg-emerald-700'},
];

const sourceLegend = [
  { color: 'bg-indigo-500',  label: 'LinkedIn',             val: '912', pct: '32' },
  { color: 'bg-purple-500',  label: 'Lucohire Career Page', val: '683', pct: '24' },
  { color: 'bg-emerald-500', label: 'Employee Referral',    val: '540', pct: '19' },
  { color: 'bg-orange-500',  label: 'Naukri',               val: '356', pct: '13' },
  { color: 'bg-blue-500',    label: 'Indeed',               val: '198', pct: '7'  },
  { color: 'bg-slate-300',   label: 'Others',               val: '153', pct: '5'  },
];



const jobPerf = [
  { dot: 'bg-indigo-600', label: 'Featured Jobs',      jobs: 12, apps: '1,248', hires: 14, ratio: '1.17' },
  { dot: 'bg-orange-500', label: 'Urgent Hiring Jobs', jobs: 8,  apps: '864',   hires: 10, ratio: '1.25' },
  { dot: 'bg-blue-500',   label: 'Normal Jobs',        jobs: 28, apps: '730',   hires: 4,  ratio: '0.14' },
];

const interviewLegend = [
  { color: 'bg-indigo-500',  label: 'Phone Screen',    val: '162', pct: '52' },
  { color: 'bg-emerald-500', label: 'Technical Round', val: '98',  pct: '31' },
  { color: 'bg-orange-500',  label: 'HR Round',        val: '38',  pct: '12' },
  { color: 'bg-slate-300',   label: 'Others',          val: '14',  pct: '5'  },
];

const aiTrends = [
  { bg: 'bg-indigo-50',  ic: 'text-indigo-600',  icon: <FiBriefcase />, title: 'Top In-Demand Skills',  sub: 'React.js, Node.js, TypeScript, AWS, Python', to: '/recruiter/reports/ai-insights' },
  { bg: 'bg-blue-50',    ic: 'text-blue-600',    icon: <FiDollarSign />,title: 'Salary Benchmark',       sub: 'React Developer avg. salary ₹12.6 LPA',       to: '/recruiter/reports/ai-insights' },
  { bg: 'bg-purple-50',  ic: 'text-purple-600',  icon: <HiSparkles />,  title: 'Hiring Trend',          sub: 'React roles increased by 24% this month',      to: '/recruiter/reports/ai-insights' },
  { bg: 'bg-emerald-50', ic: 'text-emerald-600', icon: <FiUsers />,     title: 'Market Insights',       sub: 'High demand for Full Stack Developers',         to: '/recruiter/reports/ai-insights' },
];

export default function ReportsOverview() {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4">
        {topMetrics.map((m, i) => (
          <SCard key={i} className="p-4">
            <div className={`inline-flex items-center justify-center p-2 rounded-xl mb-3 ${m.bg}`}>
              <span className={`${m.ic} w-4 h-4`}>{m.icon}</span>
            </div>
            <div className="text-[11px] font-semibold text-gray-500 mb-1 leading-tight">{m.label}</div>
            <div className="text-lg font-extrabold text-gray-900 mb-1">{m.value}</div>
            <div className={`text-[10px] font-bold flex items-center gap-0.5 ${m.up ? 'text-emerald-600' : 'text-red-500'}`}>
              {m.up ? <FiArrowUpRight className="w-3 h-3" /> : <FiArrowDownRight className="w-3 h-3" />}
              {m.trend} vs last month
            </div>
          </SCard>
        ))}
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 sm:gap-6">
        {/* Funnel */}
        <SCard className="p-5 xl:col-span-3">
          <CardHdr title="Hiring Funnel" action="This Month" />
          <div className="space-y-2.5">
            {funnelStages.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                  <div className={`h-full ${s.color} flex items-center pl-3 text-white text-[10px] font-bold rounded-lg`} style={{ width: `${s.w}%` }}>
                    {s.w > 30 ? `${s.pct}%` : ''}
                  </div>
                </div>
                <div className="text-right min-w-[90px]">
                  <div className="text-[10px] font-semibold text-gray-500">{s.label}</div>
                  <div className="text-xs font-bold text-gray-900">{s.value}</div>
                </div>
              </div>
            ))}
          </div>
          <ViewBtn label="Full Hiring Funnel" to="/recruiter/reports/hiring-funnel" />
        </SCard>

        {/* Applications Trend */}
        <SCard className="p-5 xl:col-span-3">
          <CardHdr title="Applications Trend" action="Daily" />
          <div className="relative" style={{ paddingBottom: '65%' }}>
            <div className="absolute inset-0 flex">
              <div className="flex flex-col justify-between text-[10px] text-gray-400 font-semibold pr-2 py-1 shrink-0">
                {['1.2k','900','600','300','0'].map(l => <span key={l}>{l}</span>)}
              </div>
              <div className="flex-1 relative">
                <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="appGradOV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[12,24,36,48].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f3f4f6" strokeWidth="0.5" />)}
                  <path d="M0,52 C15,38 25,30 35,32 C45,34 55,20 65,22 C75,24 88,12 100,6 L100,60 L0,60Z" fill="url(#appGradOV)" />
                  <path d="M0,52 C15,38 25,30 35,32 C45,34 55,20 65,22 C75,24 88,12 100,6" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="65" cy="22" r="2.5" fill="#6366f1" stroke="white" strokeWidth="1" />
                </svg>
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold mt-1">
                  {['20 Apr','27 Apr','4 May','11 May','18 May'].map(l => <span key={l}>{l}</span>)}
                </div>
              </div>
            </div>
          </div>
        </SCard>

        {/* Time to Hire Trend */}
        <SCard className="p-5 xl:col-span-3">
          <CardHdr title="Time to Hire Trend" action="This Month" />
          <div className="relative" style={{ paddingBottom: '65%' }}>
            <div className="absolute inset-0 flex">
              <div className="flex flex-col justify-between text-[10px] text-gray-400 font-semibold pr-2 py-1 shrink-0">
                {['40','30','20','10','0'].map(l => <span key={l}>{l}</span>)}
              </div>
              <div className="flex-1 relative">
                <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full">
                  {[12,24,36,48].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f3f4f6" strokeWidth="0.5" />)}
                  <path d="M0,30 C12,42 22,34 32,26 C42,18 52,30 62,36 C72,42 85,34 100,32" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold mt-1">
                  {['20 Apr','27 Apr','4 May','11 May','18 May'].map(l => <span key={l}>{l}</span>)}
                </div>
              </div>
            </div>
          </div>
        </SCard>

        {/* AI Insights */}
        <SCard className="p-5 xl:col-span-3 md:col-span-2 flex flex-col">
          <CardHdr title="AI Insights" badge="New" />
          <div className="space-y-3 flex-1">
            {[
              { bg: 'bg-emerald-50', ic: 'text-emerald-600', icon: <HiSparkles />, text: 'Your time to hire improved by 8% compared to last month.' },
              { bg: 'bg-orange-50',  ic: 'text-orange-500',  icon: <FiUsers />,    text: <><strong>Frontend Developer</strong> has highest applications and conversion rate.</> },
              { bg: 'bg-blue-50',    ic: 'text-blue-600',    icon: <span className="font-black text-xs">%</span>, text: <><strong>LinkedIn</strong> is top source with 32% of total hires.</> },
              { bg: 'bg-purple-50',  ic: 'text-purple-600',  icon: <HiSparkles />, text: 'Increase outreach to passive candidates for Senior React Developer roles.' },
            ].map((item, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${item.bg}`}>
                <span className={`${item.ic} shrink-0 mt-0.5 text-sm`}>{item.icon}</span>
                <p className="text-[11px] font-medium text-gray-700 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
          <ViewBtn label="View All AI Insights" to="/recruiter/reports/ai-insights" />
        </SCard>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 sm:gap-6">
        <SCard className="p-5 xl:col-span-6 flex flex-col">
          <CardHdr title="Source Performance" />
          <div className="flex flex-col sm:flex-row xl:flex-col 2xl:flex-row items-center gap-5 flex-1">
            <div className="relative w-32 h-32 shrink-0 rounded-full" style={{ background: 'conic-gradient(#6366f1 0% 32%,#a855f7 32% 56%,#10b981 56% 75%,#f59e0b 75% 88%,#3b82f6 88% 95%,#cbd5e1 95% 100%)' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center">
                  <div className="text-base font-extrabold text-gray-900">2,842</div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide text-center">Total<br/>Apps</div>
                </div>
              </div>
            </div>
            <div className="w-full space-y-2">
              {sourceLegend.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 font-medium text-gray-700 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${s.color}`} />
                    <span className="truncate">{s.label}</span>
                  </div>
                  <span className="font-bold text-gray-900 ml-2 shrink-0">{s.val} <span className="text-gray-400">({s.pct}%)</span></span>
                </div>
              ))}
            </div>
          </div>
          <ViewBtn label="Full Source Report" to="/recruiter/reports/source-analytics" />
        </SCard>



        <SCard className="p-5 xl:col-span-6 flex flex-col">
          <CardHdr title="Job Performance" action="This Month" />
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left min-w-[240px]">
              <thead>
                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-3">Type</th>
                  <th className="pb-3 text-center">Jobs</th>
                  <th className="pb-3 text-center">Apps</th>
                  <th className="pb-3 text-center">Hires</th>
                  <th className="pb-3 text-right">H/J</th>
                </tr>
              </thead>
              <tbody>
                {jobPerf.map((j, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 transition">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${j.dot}`} />
                        <span className="text-xs font-semibold text-gray-900 whitespace-nowrap">{j.label}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center text-xs font-semibold text-gray-700">{j.jobs}</td>
                    <td className="py-4 text-center text-xs font-semibold text-gray-700">{j.apps}</td>
                    <td className="py-4 text-center text-xs font-semibold text-gray-700">{j.hires}</td>
                    <td className="py-4 text-right text-xs font-bold text-gray-900">{j.ratio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ViewBtn label="Full Job Performance" to="/recruiter/reports/job-performance" />
        </SCard>

        {/* Custom Reports + Downloads */}
        <div className="xl:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SCard className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Custom Reports</h3>
            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">Create reports with advanced filters and save for future use.</p>
            <Link to="/recruiter/reports/custom-reports" className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-indigo-200 text-indigo-600 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-50 transition">
              <FiPlus /> Create Custom Report
            </Link>
          </SCard>
          <SCard className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Download Center</h3>
            <div className="space-y-2.5">
              {[{ c: 'text-red-500', l: 'Hiring Overview (PDF)' }, { c: 'text-emerald-500', l: 'Source Performance (Excel)' }, { c: 'text-red-500', l: 'Recruiter Perf. (PDF)' }].map((d, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 min-w-0">
                    <FiFileText className={`${d.c} shrink-0`} />
                    <span className="truncate">{d.l}</span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 transition ml-2 shrink-0"><FiDownload /></button>
                </div>
              ))}
            </div>
          </SCard>
        </div>
      </div>

      {/* Row 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Outreach */}
        <SCard className="p-5 flex flex-col">
          <CardHdr title="Outreach Analytics" action="This Month" />
          <div className="grid grid-cols-3 gap-4 flex-1">
            {[
              { label: 'Emails Sent',         val: '1,856' },
              { label: 'Email Open Rate',     val: '47%'   },
              { label: 'Email Reply Rate',    val: '22%'   },
              { label: 'LinkedIn Messages',   val: '612'   },
              { label: 'LinkedIn Reply Rate', val: '18%'   },
              { label: 'WhatsApp Messages',   val: '396'   },
            ].map((item, i) => (
              <div key={i} className="py-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 leading-tight">{item.label}</div>
                <div className="text-xl font-extrabold text-gray-900">{item.val}</div>
              </div>
            ))}
          </div>
          <ViewBtn label="Full Outreach Report" to="/recruiter/reports/outreach-analytics" />
        </SCard>

        {/* Interview */}
        <SCard className="p-5 flex flex-col">
          <CardHdr title="Interview Analytics" action="This Month" />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 flex-1 py-2">
            <div className="relative w-36 h-36 shrink-0 rounded-full" style={{ background: 'conic-gradient(#6366f1 0% 52%,#10b981 52% 83%,#f59e0b 83% 95%,#cbd5e1 95% 100%)' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center">
                  <div className="text-xl font-extrabold text-gray-900">312</div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide text-center">Total<br/>Interviews</div>
                </div>
              </div>
            </div>
            <div className="space-y-3 w-full sm:w-auto">
              {interviewLegend.map((l, i) => (
                <div key={i} className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 font-medium text-gray-700">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${l.color}`} />
                    {l.label}
                  </div>
                  <span className="font-bold text-gray-900 whitespace-nowrap">{l.val} <span className="text-gray-400">({l.pct}%)</span></span>
                </div>
              ))}
            </div>
          </div>
          <ViewBtn label="Full Interview Report" to="/recruiter/reports/outreach-analytics" />
        </SCard>

        {/* AI Trends */}
        <SCard className="p-5 flex flex-col">
          <CardHdr title="AI Insights & Trends" />
          <div className="space-y-3 flex-1">
            {aiTrends.map((item, i) => (
              <Link key={i} to={item.to} className={`flex items-center justify-between gap-3 p-3 rounded-xl border border-transparent bg-gray-50/50 hover:bg-indigo-50 hover:border-indigo-100 cursor-pointer group transition`}>
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`${item.bg} ${item.ic} p-2 rounded-xl shrink-0`}>{item.icon}</div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 mb-0.5 group-hover:text-indigo-600 transition">{item.title}</h4>
                    <p className="text-[10px] font-medium text-gray-500">{item.sub}</p>
                  </div>
                </div>
                <FiChevronRight className="text-gray-300 group-hover:text-indigo-500 transition shrink-0" />
              </Link>
            ))}
          </div>
          <ViewBtn label="View Full AI Insights" to="/recruiter/reports/ai-insights" />
        </SCard>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-medium text-gray-400 border-t border-gray-200 pt-4 px-1">
        <div className="flex items-center gap-1.5">
          <FiClock className="w-3.5 h-3.5" />
          All data is updated daily. Last updated on 20 May 2026, 09:30 AM
        </div>
        <div>Data shown in India Standard Time (IST)</div>
      </div>
    </div>
  );
}
