import React, { useState } from 'react';
import { 
  FiMapPin, FiClock, FiCalendar, FiExternalLink, FiMoreHorizontal, 
  FiSearch, FiFilter, FiList, FiLayout, FiChevronDown, FiPlus,
  FiFileText, FiMessageSquare, FiMoreVertical, FiArrowUpRight,
  FiPhoneCall, FiVideo, FiCheckCircle, FiUsers, FiArrowRight, FiChevronRight
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { Link } from 'react-router-dom';

const SCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

// --- MOCK DATA ---
const pipelineColumns = [
  { id: 'applied', title: 'Applied', count: 18, avgDays: '0.8 days', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100',
    candidates: [
      { id: 1, name: 'Amit Sharma', time: '2 mins ago', match: 78, isStarred: false, initials: 'AS' },
      { id: 2, name: 'Priya Nair', time: '15 mins ago', match: 65, isStarred: false, initials: 'PN' },
      { id: 3, name: 'Vikash Yadav', time: '1 hour ago', match: 62, isStarred: false, initials: 'VY' },
      { id: 4, name: 'Sneha Reddy', time: '2 hours ago', match: 58, isStarred: false, initials: 'SR' },
    ]
  },
  { id: 'screening', title: 'Screening', count: 24, avgDays: '2.4 days', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100',
    candidates: [
      { id: 5, name: 'Rohit Singh', time: '30 mins ago', match: 85, isStarred: true, initials: 'RS' },
      { id: 6, name: 'Anjali Mehta', time: '1 hour ago', match: 72, isStarred: false, initials: 'AM' },
      { id: 7, name: 'Karan Malhotra', time: '2 hours ago', match: 70, isStarred: false, initials: 'KM' },
      { id: 8, name: 'Divya Patel', time: '3 hours ago', match: 68, isStarred: false, initials: 'DP' },
    ]
  },
  { id: 'technical', title: 'Technical Round', count: 16, avgDays: '3.1 days', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100',
    candidates: [
      { id: 9, name: 'Neeraj Kumar', time: '4 hours ago', match: 90, isStarred: true, initials: 'NK' },
      { id: 10, name: 'Arjun Nair', time: '5 hours ago', match: 86, isStarred: false, initials: 'AN' },
      { id: 11, name: 'Megha Iyer', time: '1 day ago', match: 82, isStarred: false, initials: 'MI' },
      { id: 12, name: 'Siddharth Jain', time: '1 day ago', match: 80, isStarred: false, initials: 'SJ' },
    ]
  },
  { id: 'hr', title: 'HR Round', count: 8, avgDays: '1.6 days', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100',
    candidates: [
      { id: 13, name: 'Pooja Das', time: '1 day ago', match: 87, isStarred: false, initials: 'PD' },
      { id: 14, name: 'Rahul Verma', time: '1 day ago', match: 83, isStarred: false, initials: 'RV' },
      { id: 15, name: 'Ishita Kapoor', time: '2 days ago', match: 80, isStarred: false, initials: 'IK' },
      { id: 16, name: 'Manish Gupta', time: '2 days ago', match: 78, isStarred: false, initials: 'MG' },
    ]
  },
  { id: 'offer', title: 'Offer', count: 3, avgDays: '0.9 days', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100',
    candidates: [
      { id: 17, name: 'Sunny Bansal', time: '2 days ago', match: 92, isStarred: true, initials: 'SB' },
      { id: 18, name: 'Kavya Shetty', time: '3 days ago', match: 88, isStarred: false, initials: 'KS' },
      { id: 19, name: 'Harsh Vardhan', time: '4 days ago', match: 85, isStarred: false, initials: 'HV' },
    ]
  },
  { id: 'hired', title: 'Hired', count: 2, avgDays: '0.5 days', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100',
    candidates: [
      { id: 20, name: 'Ankit Verma', time: 'Hired on 20 May 2026', match: null, isStarred: false, initials: 'AV' },
      { id: 21, name: 'Nidhi Singh', time: 'Hired on 18 May 2026', match: null, isStarred: false, initials: 'NS' },
    ]
  },
];

export default function JobDetails() {
  const [activeTab, setActiveTab] = useState('Pipeline');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 1. Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">Senior React Developer</h1>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Active
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500">
                <div className="flex items-center gap-1"><FiMapPin className="text-gray-400" /> Bangalore, India</div>
                <div className="flex items-center gap-1"><FiClock className="text-gray-400" /> Full-time</div>
                <div className="flex items-center gap-1"><FiCalendar className="text-gray-400" /> Created on 18 May 2026</div>
                <div className="flex items-center gap-1 text-gray-400">Job ID: J-1048</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 w-full md:w-auto justify-start md:justify-end">
              <button className="flex-1 md:flex-none justify-center items-center flex gap-1.5 bg-white border border-gray-200 text-indigo-600 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm transition">
                View Job Page <FiExternalLink />
              </button>
              <button className="flex-1 md:flex-none justify-center items-center flex gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm transition">
                <HiSparkles /> Promote Job <FiChevronDown />
              </button>
              <button className="p-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition shadow-sm shrink-0">
                <FiMoreHorizontal />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-6 mt-6 border-b border-gray-100 overflow-x-auto whitespace-nowrap custom-scrollbar pb-0.5">
            {['Pipeline', 'Job Details', 'Applicants (147)', 'Job Analytics', 'Team', 'Activity', 'Integrations'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab.split(' ')[0])}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === tab.split(' ')[0] 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col 2xl:flex-row gap-6">
          
          {/* Left Area (Kanban) */}
          <div className="flex-1 min-w-0 flex flex-col">
            
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-72">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search candidates..." className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all" />
                </div>
                <button className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                  <FiFilter className="text-gray-400" /> Filters <span className="bg-indigo-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center ml-1">2</span>
                </button>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
                <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                  Sort by: Last Activity <FiChevronDown className="ml-1" />
                </button>
                <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0">
                  <button className="p-1.5 bg-white text-indigo-600 rounded-md shadow-sm"><FiLayout className="w-4 h-4" /></button>
                  <button className="p-1.5 text-gray-500 hover:text-gray-700"><FiList className="w-4 h-4" /></button>
                </div>
                <button className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-bold text-indigo-600 shadow-sm hover:bg-gray-50 transition-colors">
                  <HiSparkles /> Bulk Actions <FiChevronDown className="ml-1" />
                </button>
              </div>
            </div>

            {/* Kanban Board Container */}
            <div className="flex gap-5 overflow-x-auto pb-6 custom-scrollbar flex-1 min-h-[500px]">
              {pipelineColumns.map((col) => (
                <div key={col.id} className={`flex-shrink-0 w-[280px] flex flex-col rounded-2xl border ${col.border} ${col.bg} p-2.5`}>
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-2 py-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{col.title}</h3>
                      <p className="text-[11px] font-medium text-gray-500 mt-0.5">Avg: {col.avgDays}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md bg-white border ${col.border} ${col.text}`}>
                      {col.count}
                    </span>
                  </div>

                  {/* Candidates List */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mt-1">
                    {col.candidates.map((cand) => (
                      <div key={cand.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition cursor-grab relative">
                        {cand.isStarred && (
                          <HiSparkles className="absolute top-3 right-3 text-amber-400 w-4 h-4" />
                        )}
                        <div className="flex gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {cand.initials}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900">{cand.name}</h4>
                            <p className="text-[10px] text-gray-500 mt-0.5">{cand.time}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <button className="w-6 h-6 flex items-center justify-center rounded border border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition">
                              <FiFileText className="w-3 h-3" />
                            </button>
                            <button className="w-6 h-6 flex items-center justify-center rounded border border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition">
                              <FiMessageSquare className="w-3 h-3" />
                            </button>
                            <button className="w-6 h-6 flex items-center justify-center rounded border border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition">
                              <FiMoreVertical className="w-3 h-3" />
                            </button>
                          </div>
                          
                          {cand.match && (
                            <div className="relative w-8 h-8 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                  className="text-gray-100"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                />
                                <path
                                  className={cand.match >= 80 ? 'text-emerald-500' : cand.match >= 60 ? 'text-emerald-400' : 'text-amber-400'}
                                  strokeDasharray={`${cand.match}, 100`}
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                />
                              </svg>
                              <span className="absolute text-[9px] font-bold text-gray-700">{cand.match}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Candidate Button */}
                  <button className="w-full py-2.5 mt-3 rounded-lg border border-transparent text-indigo-600 hover:bg-white text-xs font-bold transition flex items-center justify-center gap-1.5">
                    <FiPlus className="w-3.5 h-3.5" /> Add Candidate
                  </button>
                </div>
              ))}
            </div>

            {/* Bottom Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
              {/* Pipeline Summary */}
              <SCard className="p-5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 text-sm">Pipeline Summary</h3>
                  <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                    View analytics <FiArrowUpRight />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="relative w-24 h-24 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E0E7FF" strokeWidth="8" />
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#4F46E5" strokeWidth="8" strokeDasharray="30 70" strokeDashoffset="0" />
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#F59E0B" strokeWidth="8" strokeDasharray="30 70" strokeDashoffset="-30" />
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10B981" strokeWidth="8" strokeDasharray="20 80" strokeDashoffset="-60" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-medium text-gray-500 leading-none">Total in pipeline</span>
                      <span className="text-xl font-bold text-gray-900 leading-none mt-1">71</span>
                    </div>
                  </div>
                  <div className="flex-1 ml-6 space-y-2">
                    {[
                      { label: 'Applied', count: 18, pct: '25.4%', color: 'bg-indigo-600' },
                      { label: 'Screening', count: 24, pct: '33.8%', color: 'bg-amber-500' },
                      { label: 'Technical Round', count: 16, pct: '22.5%', color: 'bg-emerald-500' },
                      { label: 'HR Round', count: 8, pct: '11.3%', color: 'bg-purple-500' },
                      { label: 'Offer', count: 3, pct: '4.2%', color: 'bg-emerald-400' },
                      { label: 'Hired', count: 2, pct: '2.8%', color: 'bg-teal-500' },
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${stat.color}`}></div>
                          <span className="font-semibold text-gray-700">{stat.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{stat.count}</span>
                          <span className="text-gray-500 w-10 text-right">({stat.pct})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SCard>

              {/* Recent Candidate Activity */}
              <SCard className="p-5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 text-sm">Recent Candidate Activity</h3>
                  <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                    View all <FiArrowUpRight />
                  </button>
                </div>
                <div className="space-y-4">
                  {[
                    { name: 'Neeraj Kumar', action: 'moved to Technical Round', time: '4 hours ago', initials: 'NK', color: 'bg-orange-100 text-orange-700' },
                    { name: 'Pooja Das', action: 'moved to HR Round', time: '1 day ago', initials: 'PD', color: 'bg-purple-100 text-purple-700' },
                    { name: 'Sunny Bansal', action: 'moved to Offer', time: '2 days ago', initials: 'SB', color: 'bg-emerald-100 text-emerald-700' },
                    { name: 'Ankit Verma', action: 'marked as Hired', time: '3 days ago', initials: 'AV', color: 'bg-teal-100 text-teal-700' },
                  ].map((act, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${act.color}`}>
                        {act.initials}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-800 font-medium">
                          <span className="font-bold">{act.name}</span> {act.action}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-500">{act.time}</span>
                    </div>
                  ))}
                </div>
              </SCard>

              {/* Notes */}
              <SCard className="p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-sm">Notes</h3>
                  <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                    View Note <FiArrowUpRight />
                  </button>
                </div>
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-4 relative">
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                    Client prefers 4+ years of hands-on experience in React with performance optimization. Focus on problem solving skills.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-semibold">- Rahul Verma (20 May 2026)</span>
                    <button className="text-gray-400 hover:text-gray-600"><FiMoreHorizontal /></button>
                  </div>
                </div>
              </SCard>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full 2xl:w-[340px] shrink-0 space-y-6">
            
            {/* Pipeline Health */}
            <SCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">Pipeline Health <FiMoreHorizontal className="text-gray-400" /></h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                    <path className="text-emerald-500" strokeDasharray="91, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-900">91%</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-0.5">Excellent</h4>
                  <p className="text-[11px] text-gray-500 font-medium leading-tight">Your pipeline is healthy</p>
                  <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5"><HiSparkles className="w-3 h-3" /> +12% vs last month</p>
                </div>
              </div>
            </SCard>

            {/* Sources Performance */}
            <SCard className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-sm">Sources Performance</h3>
                <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                  View report <FiArrowRight />
                </button>
              </div>
              <div className="space-y-3.5">
                {[
                  { name: 'LinkedIn', val: 48, pct: '32%', color: 'bg-indigo-600', w: 'w-[40%]' },
                  { name: 'Lucohire Career Page', val: 36, pct: '24%', color: 'bg-blue-500', w: 'w-[30%]' },
                  { name: 'Employee Referral', val: 28, pct: '19%', color: 'bg-emerald-500', w: 'w-[25%]' },
                  { name: 'Naukri', val: 20, pct: '13%', color: 'bg-amber-500', w: 'w-[15%]' },
                  { name: 'Others', val: 15, pct: '10%', color: 'bg-gray-400', w: 'w-[10%]' },
                ].map((src, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium w-32 truncate">{src.name}</span>
                    <div className="flex-1 mx-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${src.color} ${src.w} rounded-full`}></div>
                    </div>
                    <div className="flex items-center justify-end gap-1 w-16">
                      <span className="font-bold text-gray-900">{src.val}</span>
                      <span className="text-[10px] text-gray-400">({src.pct})</span>
                    </div>
                  </div>
                ))}
              </div>
            </SCard>

            {/* AI Recommendations */}
            <SCard className="p-5 bg-indigo-50/30 border-indigo-100">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><HiSparkles className="text-indigo-600" /> AI Recommendations</h3>
                  <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">New</span>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { icon: <FiUsers />, text: '12 high-match candidates', sub: 'Move to Screening', color: 'text-indigo-600 bg-indigo-100' },
                  { icon: <FiPhoneCall />, text: 'Increase salary range by ₹1 Lakh', sub: 'To attract more relevant candidates', color: 'text-emerald-600 bg-emerald-100' },
                  { icon: <FiFileText />, text: 'Add TypeScript to must-have skills', sub: 'Based on top performers', color: 'text-emerald-600 bg-emerald-100' },
                ].map((rec, i) => (
                  <div key={i} className="flex gap-3 group cursor-pointer">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${rec.color}`}>
                      {rec.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition">{rec.text}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">{rec.sub}</p>
                    </div>
                    <FiChevronRight className="text-gray-400 group-hover:text-indigo-600 transition self-center" />
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-xs font-bold text-indigo-600 flex items-center justify-center gap-1 hover:underline">
                View All Recommendations <FiArrowRight />
              </button>
            </SCard>

            {/* Next Actions */}
            <SCard className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-sm">Next Actions</h3>
                <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                  View all <FiArrowRight />
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { icon: <FiCalendar />, text: '5 interviews schedules today', sub: '3 Technical • 2 HR', color: 'text-purple-600 bg-purple-100' },
                  { icon: <FiCheckCircle />, text: '8 candidates need your feedback', sub: 'Technical & HR Round', color: 'text-blue-600 bg-blue-100' },
                  { icon: <FiCheckCircle />, text: '3 offers awaiting response', sub: 'Follow up to close faster', color: 'text-orange-600 bg-orange-100' },
                ].map((act, i) => (
                  <div key={i} className="flex gap-3 group cursor-pointer">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${act.color}`}>
                      {act.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition">{act.text}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">{act.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SCard>

          </div>
          
        </div>
      </div>
    </div>
  );
}
