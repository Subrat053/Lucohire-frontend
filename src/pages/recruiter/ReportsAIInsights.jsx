import React, { useState } from 'react';
import { FiArrowUpRight, FiChevronRight, FiBriefcase, FiDollarSign, FiUsers, FiTrendingUp } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const SCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

const insightCategories = [
  {
    id: 'skills',
    icon: <FiBriefcase className="w-5 h-5" />,
    bg: 'bg-indigo-50', ic: 'text-indigo-600',
    title: 'Top In-Demand Skills',
    desc: 'Skills with highest demand vs. supply gap this month',
    items: [
      { skill: 'React.js / Next.js', demand: 92, supply: 48, gap: '+44', trend: 'High' },
      { skill: 'Node.js / Express',  demand: 86, supply: 55, gap: '+31', trend: 'High' },
      { skill: 'TypeScript',         demand: 80, supply: 62, gap: '+18', trend: 'Rising' },
      { skill: 'AWS / Cloud',        demand: 78, supply: 40, gap: '+38', trend: 'High' },
      { skill: 'Python / ML',        demand: 74, supply: 52, gap: '+22', trend: 'Rising' },
      { skill: 'DevOps / K8s',       demand: 70, supply: 35, gap: '+35', trend: 'High' },
    ],
  },
  {
    id: 'salary',
    icon: <FiDollarSign className="w-5 h-5" />,
    bg: 'bg-blue-50', ic: 'text-blue-600',
    title: 'Salary Benchmark',
    desc: 'Market salary ranges by role',
    items: [
      { skill: 'Senior React Developer',  demand: null, supply: null, gap: '₹18–28 LPA', trend: '₹22 avg' },
      { skill: 'Product Manager',         demand: null, supply: null, gap: '₹20–35 LPA', trend: '₹26 avg' },
      { skill: 'DevOps Engineer',         demand: null, supply: null, gap: '₹15–25 LPA', trend: '₹19 avg' },
      { skill: 'UX Designer',             demand: null, supply: null, gap: '₹12–20 LPA', trend: '₹15 avg' },
      { skill: 'Data Analyst',            demand: null, supply: null, gap: '₹8–15 LPA',  trend: '₹11 avg' },
      { skill: 'Backend Developer',       demand: null, supply: null, gap: '₹14–24 LPA', trend: '₹18 avg' },
    ],
  },
  {
    id: 'hiring',
    icon: <FiTrendingUp className="w-5 h-5" />,
    bg: 'bg-purple-50', ic: 'text-purple-600',
    title: 'Hiring Trends',
    desc: 'Month-over-month hiring volume changes by role',
    items: [
      { skill: 'React Developers',      demand: 78, supply: 45, gap: '+24%', trend: '↑ Rising'  },
      { skill: 'Full Stack Developers', demand: 72, supply: 52, gap: '+18%', trend: '↑ Rising'  },
      { skill: 'DevOps Engineers',      demand: 68, supply: 38, gap: '+31%', trend: '↑ Hot'     },
      { skill: 'Data Scientists',       demand: 65, supply: 60, gap: '+8%',  trend: '→ Stable'  },
      { skill: 'UI Designers',          demand: 55, supply: 48, gap: '-5%',  trend: '↓ Cooling' },
      { skill: 'Sales Executives',      demand: 50, supply: 55, gap: '-12%', trend: '↓ Cooling' },
    ],
  },
  {
    id: 'market',
    icon: <FiUsers className="w-5 h-5" />,
    bg: 'bg-emerald-50', ic: 'text-emerald-600',
    title: 'Market Insights',
    desc: 'Broad market signals and talent availability',
    items: [
      { skill: 'Full Stack Developers',  demand: 88, supply: 42, gap: 'High demand', trend: '↑ Growing' },
      { skill: 'Cloud Architects',       demand: 82, supply: 30, gap: 'Critical gap', trend: '↑ Hot'    },
      { skill: 'ML Engineers',           demand: 76, supply: 38, gap: 'High demand', trend: '↑ Hot'     },
      { skill: 'Cybersecurity Analysts', demand: 70, supply: 28, gap: 'Critical gap', trend: '↑ Hot'    },
      { skill: 'Content Marketers',      demand: 45, supply: 65, gap: 'Oversupplied', trend: '→ Stable' },
      { skill: 'HR Generalists',         demand: 40, supply: 58, gap: 'Oversupplied', trend: '↓ Cooling'},
    ],
  },
];

export default function AIInsightsPage() {
  const [activeCategory, setActiveCategory] = useState('skills');
  const activeData = insightCategories.find(c => c.id === activeCategory);

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'AI Score',           value: '87/100', sub: '+11% this month',  color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Time-to-Hire Saved', value: '3.2 Days', sub: 'AI shortlisting', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Best Match Rate',    value: '94%',    sub: 'AI vs manual: 71%',color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Insights Generated', value: '42',     sub: 'This month',        color: 'text-blue-600',   bg: 'bg-blue-50'   },
        ].map((k, i) => (
          <SCard key={i} className="p-4">
            <div className={`text-2xl font-extrabold mb-1 ${k.color}`}>{k.value}</div>
            <div className="text-xs font-bold text-gray-900 mb-0.5">{k.label}</div>
            <div className="text-[10px] font-semibold text-gray-500">{k.sub}</div>
          </SCard>
        ))}
      </div>

      {/* Category selector + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar category list */}
        <div className="space-y-3">
          {insightCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition ${
                activeCategory === cat.id
                  ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                  : 'border-gray-100 bg-white hover:bg-gray-50'
              }`}
            >
              <div className={`${cat.bg} ${cat.ic} p-2 rounded-xl shrink-0`}>{cat.icon}</div>
              <div className="min-w-0">
                <div className={`text-xs font-bold mb-0.5 ${activeCategory === cat.id ? 'text-indigo-700' : 'text-gray-900'}`}>{cat.title}</div>
                <div className="text-[10px] font-medium text-gray-500 truncate">{cat.desc}</div>
              </div>
              <FiChevronRight className={`shrink-0 ${activeCategory === cat.id ? 'text-indigo-500' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <SCard className="lg:col-span-3 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`${activeData.bg} ${activeData.ic} p-3 rounded-xl`}>{activeData.icon}</div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{activeData.title}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{activeData.desc}</p>
            </div>
          </div>

          <div className="space-y-4">
            {activeData.id === 'skills' && (
              <div className="space-y-3">
                <div className="grid grid-cols-4 text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 pb-2">
                  <span>Skill</span>
                  <span className="text-center">Demand</span>
                  <span className="text-center">Supply</span>
                  <span className="text-right">Market</span>
                </div>
                {activeData.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-4 items-center">
                    <div className="text-xs font-semibold text-gray-900">{item.skill}</div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-indigo-100 rounded-full h-1.5"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${item.demand}%` }} /></div>
                      <span className="text-[10px] font-bold text-gray-700 w-6">{item.demand}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-emerald-100 rounded-full h-1.5"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.supply}%` }} /></div>
                      <span className="text-[10px] font-bold text-gray-700 w-6">{item.supply}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.trend === 'High' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>{item.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeData.id === 'salary' && (
              <div className="space-y-3">
                {activeData.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50/60 rounded-xl">
                    <div className="text-xs font-semibold text-gray-900">{item.skill}</div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-gray-900">{item.gap}</div>
                      <div className="text-[10px] font-semibold text-indigo-600">{item.trend}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(activeData.id === 'hiring' || activeData.id === 'market') && (
              <div className="space-y-3">
                {activeData.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50/60 rounded-xl">
                    <div className="text-xs font-semibold text-gray-900 flex-1">{item.skill}</div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-700">{item.gap}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        item.trend.includes('Hot') || item.trend.includes('Rising') || item.trend.includes('Growing')
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.trend.includes('Cooling')
                          ? 'bg-red-50 text-red-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>{item.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SCard>
      </div>

      {/* AI Summary Block */}
      <SCard className="p-6 bg-gradient-to-br from-indigo-900 to-purple-900 border-0 text-white">
        <div className="flex items-start gap-4">
          <div className="bg-white/20 p-3 rounded-xl shrink-0"><HiSparkles className="w-6 h-6" /></div>
          <div>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              AI Monthly Summary
              <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">New</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-white/60 font-semibold mb-2 text-[10px] uppercase tracking-wide">Hiring Health</div>
                <p className="text-white/90 leading-relaxed">Your overall hiring efficiency improved by 14%. AI shortlisting reduced screening time by 3.2 days on average.</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-white/60 font-semibold mb-2 text-[10px] uppercase tracking-wide">Talent Market</div>
                <p className="text-white/90 leading-relaxed">React and DevOps skills remain in critical shortage. Expand your sourcing to tier-2 cities and consider upskilling programs.</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-white/60 font-semibold mb-2 text-[10px] uppercase tracking-wide">Next Best Action</div>
                <p className="text-white/90 leading-relaxed">Launch a senior tech referral campaign. Your Employee Referral quality score (95) is the highest of all sources — capitalize on it.</p>
              </div>
            </div>
          </div>
        </div>
      </SCard>
    </div>
  );
}
