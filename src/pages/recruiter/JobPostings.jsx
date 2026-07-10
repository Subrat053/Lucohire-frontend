import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiFilter, FiBookmark, FiChevronDown, FiList, FiGrid,
  FiMoreVertical, FiEye, FiEdit2, FiTrendingUp, FiArrowUpRight,
  FiClock, FiCheckCircle, FiPauseCircle, FiBriefcase, FiPlus
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';

const JobPostings = () => {
  const [activeTab, setActiveTab] = useState('All Jobs');
  const [activeAIHealthTooltip, setActiveAIHealthTooltip] = useState(null);

  // --- MOCK DATA ---
  const jobStats = [
    { title: 'Active Jobs', count: 18, percent: '75%', icon: <FiBriefcase className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50' },
    { title: 'Draft Jobs', count: 3, percent: '12%', icon: <FiClock className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50' },
    { title: 'Closed Jobs', count: 2, percent: '8%', icon: <FiCheckCircle className="w-5 h-5 text-gray-600" />, bg: 'bg-gray-100' },
    { title: 'On Hold', count: 1, percent: '4%', icon: <FiPauseCircle className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50' },
  ];

  const jobsList = [
    { id: 1, companyLogo: 'G', logoColor: 'bg-red-100 text-red-600', title: 'Senior React Developer', sub: 'Engineering • Bangalore, India', applicants: 147, newApp: '+18 new', interviews: 8, newInt: '+2 today', aiHealth: 91, status: 'Active', statusColor: 'bg-emerald-50 text-emerald-600', created: '2 days ago', tags: [{ text: 'Featured', color: 'text-indigo-600', sub: '10 days left' }] },
    { id: 2, companyLogo: 'UI', logoColor: 'bg-blue-100 text-blue-600', title: 'UI/UX Designer', sub: 'Design • Bangalore, India', applicants: 98, newApp: '+12 new', interviews: 5, newInt: '+1 today', aiHealth: 87, status: 'Active', statusColor: 'bg-emerald-50 text-emerald-600', created: '5 days ago', tags: [{ text: 'Urgent Hiring', color: 'text-purple-600', sub: '' }] },
    { id: 3, companyLogo: 'B', logoColor: 'bg-orange-100 text-orange-600', title: 'Backend Developer', sub: 'Engineering • Bangalore, India', applicants: 112, newApp: '+15 new', interviews: 6, newInt: '+1 today', aiHealth: 90, status: 'Active', statusColor: 'bg-emerald-50 text-emerald-600', created: '1 week ago', tags: [] },
    { id: 4, companyLogo: 'A', logoColor: 'bg-indigo-100 text-indigo-600', title: 'Product Manager', sub: 'Product • Bangalore, India', applicants: 67, newApp: '+7 new', interviews: 3, newInt: '0 today', aiHealth: 65, status: 'On Hold', statusColor: 'bg-orange-50 text-orange-600', created: '1 week ago', tags: [] },
    { id: 5, companyLogo: 'a', logoColor: 'bg-gray-100 text-gray-900', title: 'DevOps Engineer', sub: 'Engineering • Bangalore, India', applicants: 81, newApp: '+9 new', interviews: 4, newInt: '+1 today', aiHealth: 83, status: 'Active', statusColor: 'bg-emerald-50 text-emerald-600', created: '2 weeks ago', tags: [] },
    { id: 6, companyLogo: 'F', logoColor: 'bg-yellow-100 text-yellow-600', title: 'Full Stack Developer', sub: 'Engineering • Bangalore, India', applicants: 156, newApp: '+21 new', interviews: 9, newInt: '+3 today', aiHealth: 92, status: 'Active', statusColor: 'bg-emerald-50 text-emerald-600', created: '2 weeks ago', tags: [{ text: 'Featured', color: 'text-indigo-600', sub: '' }] },
    { id: 7, companyLogo: 'I', logoColor: 'bg-cyan-100 text-cyan-600', title: 'Data Analyst', sub: 'Analytics • Bangalore, India', applicants: 43, newApp: '+5 new', interviews: 2, newInt: '0 today', aiHealth: 75, status: 'Draft', statusColor: 'bg-blue-50 text-blue-600', created: '2 weeks ago', tags: [] },
    { id: 8, companyLogo: 'P', logoColor: 'bg-purple-100 text-purple-600', title: 'QA Engineer', sub: 'Quality • Bangalore, India', applicants: 35, newApp: '+4 new', interviews: 1, newInt: '0 today', aiHealth: 70, status: 'Draft', statusColor: 'bg-blue-50 text-blue-600', created: '3 weeks ago', tags: [] },
  ];

  const pipeline = [
    { label: 'Applications', count: 823, color: 'bg-purple-500', width: '100%' },
    { label: 'Screening', count: 312, color: 'bg-blue-500', width: '65%' },
    { label: 'Interview', count: 42, color: 'bg-emerald-500', width: '25%' },
    { label: 'Offer', count: 10, color: 'bg-orange-500', width: '10%' },
    { label: 'Hired', count: 8, color: 'bg-teal-500', width: '5%' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 relative">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your jobs and hiring pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/recruiter/jobs/new" className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition flex items-center gap-2">
            <FiPlus className="w-4 h-4" /> Create New Job <FiChevronDown className="ml-1 opacity-70" />
          </Link>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-xl w-full overflow-x-auto custom-scrollbar">
              {['All Jobs', 'Active', 'Draft', 'Closed', 'On Hold'].map((tab, idx) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap flex-1 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {tab} {idx === 0 ? '' : <span className="ml-1 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-500">{[18, 3, 2, 1][idx-1]}</span>}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
              <FiFilter /> Filters <span className="bg-indigo-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">2</span>
            </button>
            <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
              <FiBookmark /> Saved Views <FiChevronDown className="opacity-50" />
            </button>
          </div>
        </div>

        {/* JOBS OVERVIEW */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3">Jobs Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {jobStats.map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${stat.bg}`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-0.5">{stat.title}</div>
                  <div className="text-2xl font-extrabold text-gray-900">{stat.count}</div>
                  <div className="text-[10px] font-bold text-gray-400 mt-0.5">{stat.percent} of total jobs</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* LEFT COLUMN: MY JOBS TABLE */}
          <div className="xl:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-gray-900">My Jobs (24)</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
                  <button className="p-1.5 rounded bg-indigo-50 text-indigo-600"><FiList className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded text-gray-400 hover:text-gray-600"><FiGrid className="w-4 h-4" /></button>
                </div>
                <button className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition">
                  Sort by: Recent Activity <FiChevronDown />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                      <th className="py-4 pl-6 pr-3">Job Title</th>
                      <th className="py-4 px-3 text-center">Applicants</th>
                      <th className="py-4 px-3 text-center">Interviews</th>
                      <th className="py-4 px-3 text-center">AI Health</th>
                      <th className="py-4 px-3 text-center">Status</th>
                      <th className="py-4 px-3">Created On</th>
                      <th className="py-4 pr-6 pl-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {jobsList.map(job => (
                      <tr key={job.id} className="hover:bg-gray-50/50 transition group">
                        <td className="py-4 pl-6 pr-3">
                          <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center justify-center">
                              {job.tags?.some(t => t.text === 'Featured') ? (
                                <HiSparkles className="w-4 h-4 text-indigo-500" />
                              ) : (
                                <div className="w-4 h-4" />
                              )}
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${job.logoColor}`}>
                              {job.companyLogo}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 text-sm">{job.title}</span>
                                {job.tags?.map((tag, i) => (
                                  <span key={i} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-gray-100 shadow-sm ${tag.color}`}>
                                    {tag.text}
                                  </span>
                                ))}
                              </div>
                              <div className="text-[11px] text-gray-500 font-medium mt-0.5">{job.sub}</div>
                              {job.tags?.[0]?.sub && <div className="text-[10px] text-gray-400 mt-0.5">{job.tags[0].sub}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <div className="font-bold text-gray-900">{job.applicants}</div>
                          <div className="text-[10px] font-bold text-emerald-600">{job.newApp}</div>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <div className="font-bold text-gray-900">{job.interviews}</div>
                          <div className="text-[10px] font-bold text-emerald-600">{job.newInt}</div>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <div 
                            className="relative inline-block cursor-help"
                            onMouseEnter={() => setActiveAIHealthTooltip(job.id)}
                            onMouseLeave={() => setActiveAIHealthTooltip(null)}
                          >
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 ${job.aiHealth >= 80 ? 'border-emerald-400 text-emerald-600' : job.aiHealth >= 60 ? 'border-orange-400 text-orange-600' : 'border-red-400 text-red-600'} text-[11px] font-bold relative mx-auto`}>
                              {job.aiHealth}%
                            </div>
                            
                            {/* AI Tooltip */}
                            {activeAIHealthTooltip === job.id && (
                              <div className="absolute top-1/2 -translate-y-1/2 left-full ml-3 w-64 bg-white border border-gray-100 shadow-xl rounded-xl p-4 z-30 text-left">
                                <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-white border-l border-b border-gray-100 rotate-45"></div>
                                <div className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                  <HiSparkles className="text-indigo-600" /> AI Health: {job.aiHealth}%
                                </div>
                                <p className="text-[11px] text-gray-600 leading-relaxed mb-3">
                                  {job.aiHealth >= 80 ? 'Your job post is performing well! Consider extending the budget slightly to attract top 5% candidates.' : 'Improve salary range, complete job description and add more must-have skills to boost applications.'}
                                </p>
                                <button className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                                  View suggestions <FiArrowUpRight />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${job.statusColor}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="py-4 px-3">
                          <div className="text-xs font-semibold text-gray-600">{job.created}</div>
                        </td>
                        <td className="py-4 pr-6 pl-3 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={`/recruiter/jobs/${job.id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-indigo-600 hover:bg-gray-50 transition shadow-sm">
                              <FiEye className="w-3.5 h-3.5" /> View
                            </Link>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm">
                              <FiEdit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                              <FiMoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Placeholder */}
              <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  Rows per page: 
                  <select className="border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none">
                    <option>25</option>
                  </select>
                </div>
                <div className="text-xs font-semibold text-gray-500">Showing 1 to 8 of 24 jobs</div>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center">1</button>
                  <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold flex items-center justify-center">2</button>
                  <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold flex items-center justify-center">3</button>
                  <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold flex items-center justify-center">&gt;</button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ANALYTICS & ALERTS */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Jobs Needing Attention */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">Jobs Needing Attention</h3>
                <Link to="#" className="text-[10px] font-bold text-indigo-600 hover:underline">View all (2) &rarr;</Link>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0 font-bold text-red-600">G</div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">Senior React Developer</div>
                    <div className="text-[10px] font-bold text-red-500 mt-0.5">5 new applicants</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 font-bold text-orange-600">B</div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">Backend Developer</div>
                    <div className="text-[10px] font-bold text-orange-500 mt-0.5">2 interviews pending</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 font-bold text-gray-600">a</div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">DevOps Engineer</div>
                    <div className="text-[10px] font-bold text-orange-500 mt-0.5">Job expires in 3 days</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hiring Pipeline Snapshot */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-gray-900">Hiring Pipeline Snapshot</h3>
                <Link to="#" className="text-[10px] font-bold text-indigo-600 hover:underline">View full pipeline &rarr;</Link>
              </div>
              <div className="space-y-4">
                {pipeline.map(stage => (
                  <div key={stage.label} className="relative">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[11px] font-bold text-gray-600">{stage.label}</span>
                      <span className="text-[11px] font-bold text-gray-900 bg-gray-50 px-1.5 py-0.5 rounded">{stage.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`${stage.color} h-1.5 rounded-full`} style={{ width: stage.width }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Job Performance */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">Job Performance <span className="block text-[10px] text-gray-500 font-medium">(This Month)</span></h3>
                <Link to="#" className="text-[10px] font-bold text-indigo-600 hover:underline">View analytics &rarr;</Link>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 mb-1">Total Applicants</div>
                  <div className="text-lg font-extrabold text-gray-900">823</div>
                  <div className="text-[10px] font-bold text-emerald-600 flex items-center mt-1"><FiTrendingUp className="mr-0.5" /> 24%</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-500 mb-1">Interviews</div>
                  <div className="text-lg font-extrabold text-gray-900">42</div>
                  <div className="text-[10px] font-bold text-emerald-600 flex items-center mt-1"><FiTrendingUp className="mr-0.5" /> 18%</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-500 mb-1">Hires</div>
                  <div className="text-lg font-extrabold text-gray-900">8</div>
                  <div className="text-[10px] font-bold text-emerald-600 flex items-center mt-1"><FiTrendingUp className="mr-0.5" /> 14%</div>
                </div>
              </div>

              {/* Mock Line Chart */}
              <div className="h-24 w-full bg-gray-50/50 rounded-xl border border-gray-100 relative overflow-hidden flex items-end">
                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d="M0,35 Q5,25 15,30 T30,20 T45,28 T60,15 T75,25 T90,10 L100,5" fill="none" stroke="#4F46E5" strokeWidth="2" />
                  <path d="M0,35 Q5,25 15,30 T30,20 T45,28 T60,15 T75,25 T90,10 L100,5 L100,40 L0,40 Z" fill="url(#gradient)" stroke="none" opacity="0.2" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Axes Labels */}
                <div className="absolute inset-y-0 left-0 flex flex-col justify-between py-2 px-1 text-[8px] text-gray-400 font-bold">
                  <span>100</span>
                  <span>50</span>
                  <span>0</span>
                </div>
                <div className="absolute bottom-0 inset-x-0 flex justify-between px-2 pb-1 text-[8px] text-gray-400 font-bold">
                  <span>Apr 20</span>
                  <span>Apr 27</span>
                  <span>May 4</span>
                  <span>May 11</span>
                  <span>May 18</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      

    </div>
  );
};

export default JobPostings;