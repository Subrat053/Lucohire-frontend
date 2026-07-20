import useTranslation from "../../hooks/useTranslation";
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiBriefcase, FiMail, FiUsers, FiCheckCircle, FiClock, FiDollarSign,
  FiArrowUpRight, FiArrowDownRight, FiChevronDown, FiPlus, FiChevronRight, FiFileText, FiDownload, FiArrowRight
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

const iconMap = {
  FiBriefcase: <FiBriefcase />,
  FiMail: <FiMail />,
  FiUsers: <FiUsers />,
  FiCheckCircle: <FiCheckCircle />,
  FiClock: <FiClock />,
  FiDollarSign: <FiDollarSign />,
  HiSparkles: <HiSparkles />,
};

export default function ReportsOverview() {
  const {
    t
  } = useTranslation();

  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    import('../../services/api').then(({ recruiterAPI }) => {
      recruiterAPI.getReportsOverview()
        .then(res => setData(res.data.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    });
  }, []);

  if (loading || !data) return <div className="p-12 text-center text-gray-500 font-bold">{t("Loading dashboard data...")}</div>;

  const topMetrics = data.topMetrics.map(m => ({ ...m, icon: iconMap[m.icon] }));
  const { funnelStages, sourceLegend, jobPerf, interviewLegend, aiTrends, applicationsTrend, timeToHireTrend } = data;
  const aiTrendsMapped = aiTrends.map(t => ({ ...t, icon: iconMap[t.icon] }));

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
              {m.trend}{t("vs last month")}</div>
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
          <CardHdr title="Applications Trend" action="30 Days" />
          <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={applicationsTrend} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} dy={10} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '600' }}
                />
                <Area type="monotone" dataKey="apps" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#appGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SCard>

        {/* Time to Hire Trend */}
        <SCard className="p-5 xl:col-span-3">
          <CardHdr title="Time to Hire Trend" action="Weekly" />
          <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeToHireTrend} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '600' }}
                />
                <Area type="monotone" dataKey="days" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#timeGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SCard>

        {/* AI Insights */}
        <SCard className="p-5 xl:col-span-3 md:col-span-2 flex flex-col">
          <CardHdr title="AI Insights" badge="New" />
          <div className="space-y-3 flex-1">
            {[
              { bg: 'bg-emerald-50', ic: 'text-emerald-600', icon: <HiSparkles />, text: 'Your time to hire improved by 8% compared to last month.' },
              { bg: 'bg-orange-50',  ic: 'text-orange-500',  icon: <FiUsers />,    text: <><strong>{t("Frontend Developer")}</strong>{t("has highest applications and conversion rate.")}</> },
              { bg: 'bg-blue-50',    ic: 'text-blue-600',    icon: <span className="font-black text-xs">%</span>, text: <><strong>{t("LinkedIn")}</strong>{t("is top source with 32% of total hires.")}</> },
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
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide text-center">{t("Total")}<br/>{t("Apps")}</div>
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
                  <th className="pb-3">{t("Type")}</th>
                  <th className="pb-3 text-center">{t("Jobs")}</th>
                  <th className="pb-3 text-center">{t("Apps")}</th>
                  <th className="pb-3 text-center">{t("Hires")}</th>
                  <th className="pb-3 text-right">{t("H/J")}</th>
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
            <h3 className="text-sm font-bold text-gray-900 mb-2">{t("Custom Reports")}</h3>
            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">{t("Create reports with advanced filters and save for future use.")}</p>
            <Link to="/recruiter/reports/custom-reports" className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-indigo-200 text-indigo-600 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-50 transition">
              <FiPlus />{t("Create Custom Report")}</Link>
          </SCard>
          <SCard className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">{t("Download Center")}</h3>
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
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide text-center">{t("Total")}<br/>{t("Interviews")}</div>
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
            {aiTrendsMapped.map((item, i) => (
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
          <FiClock className="w-3.5 h-3.5" />{t(`All data is updated daily. Last updated on ${new Date().toLocaleString()}`)}</div>
        <div>{t("Data shown in India Standard Time (IST)")}</div>
      </div>
    </div>
  );
}
