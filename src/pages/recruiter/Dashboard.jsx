import useTranslation from "../../hooks/useTranslation";
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar, FiUsers, FiCheckSquare, FiUserPlus,
  FiMessageSquare, FiTrendingUp,
  FiChevronDown, FiChevronRight, FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { HiSparkles, HiBriefcase } from 'react-icons/hi2';

const Dashboard = () => {
  const {
    t
  } = useTranslation();

  const [prioritiesCollapsed, setPrioritiesCollapsed] = useState(false);

  // --- MOCK DATA ---
  const activeJobs = [
    { id: 1, title: 'Senior React Developer', applicants: 147, interviews: 8, aiHealth: 91, tag: 'Featured', tagDesc: '10 days left', status: 'Active' },
    { id: 2, title: 'UI/UX Designer', applicants: 98, interviews: 5, aiHealth: 87, tag: null, status: 'Active' },
    { id: 3, title: 'Backend Developer', applicants: 112, interviews: 6, aiHealth: 90, tag: 'Urgent Hiring', tagDesc: '5 days left', status: 'Active' },
    { id: 4, title: 'Product Manager', applicants: 67, interviews: 3, aiHealth: 65, tag: 'Featured', tagDesc: '3 days left', status: 'On Hold' },
    { id: 5, title: 'DevOps Engineer', applicants: 81, interviews: 4, aiHealth: 88, tag: null, status: 'Active' },
  ];

  const interviews = [
    { id: 1, time: '10:00 AM', name: 'Ankit Singh', role: 'Senior React Developer', round: 'Technical Round' },
    { id: 2, time: '11:30 AM', name: 'Sneha Patil', role: 'UI/UX Designer', round: 'HR Round' },
    { id: 3, time: '02:00 PM', name: 'Vikram Kumar', role: 'Backend Developer', round: 'Technical Round' },
    { id: 4, time: '03:30 PM', name: 'Neha Kapoor', role: 'Product Manager', round: 'HR Round' },
    { id: 5, time: '04:30 PM', name: 'Arjun Mehta', role: 'DevOps Engineer', round: 'Managerial Round' },
  ];

  const notifications = [
    { id: 1, text: 'Offer accepted by Neha Kapoor', time: '15m ago', color: 'bg-emerald-500' },
    { id: 2, text: 'Interview rescheduled with Aman Rajput', time: '1h ago', color: 'bg-blue-500' },
    { id: 3, text: 'New application for Senior React Developer', time: '2h ago', color: 'bg-orange-500' },
    { id: 4, text: 'Rohit Sharma replied to your email', time: '3h ago', color: 'bg-purple-500' },
    { id: 5, text: 'Your job UI/UX Designer is now live', time: '5h ago', color: 'bg-pink-500' },
  ];

  const followUps = [
    { id: 1, count: 12, title: 'candidates awaiting your response', desc: 'Application received 2+ days ago', icon: <FiUserPlus className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50', btn: 'Respond' },
    { id: 2, count: 7, title: 'WhatsApp replies pending', desc: 'From yesterday', icon: <FiMessageSquare className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50', btn: 'Reply' },
    { id: 3, count: 3, title: 'interview feedback pending', desc: 'From interviews', icon: <FiCheckSquare className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50', btn: 'Provide Feedback' },
  ];

  // eslint-disable-next-line react/prop-types
  const StatBox = ({ title, count, actionText, actionLink, icon: Icon, colorClass, bgClass }) => (
    <div className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm flex flex-col hover:shadow-md transition h-full">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgClass}`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        <span className="text-sm font-semibold text-gray-700">{title}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-4">{count}</div>
      <Link to={actionLink} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-auto">
        {actionText} <FiChevronRight />
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{t("Hiring Workspace")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("Here's your hiring workspace. Let's get things done!")}</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* 1. TOP METRICS (Full Width) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox 
            title="My Active Jobs" count="24" 
            actionText="View all jobs" actionLink="/recruiter/jobs"
            icon={HiBriefcase} bgClass="bg-indigo-700" colorClass="text-white"
          />
          <StatBox 
            title="Candidates to Review" count="12" 
            actionText="Review now" actionLink="/recruiter/candidates"
            icon={FiUsers} bgClass="bg-purple-700" colorClass="text-white"
          />
          <StatBox 
            title="Interviews Today" count="5" 
            actionText="View schedule" actionLink="/recruiter/interviews"
            icon={FiCalendar} bgClass="bg-blue-700" colorClass="text-white"
          />
          <StatBox 
            title="AI Tasks for You" count="7" 
            actionText="See suggestions" actionLink="/recruiter/tasks"
            icon={HiSparkles} bgClass="bg-emerald-700" colorClass="text-white"
          />
        </div>

        {/* 2. NOTIFICATIONS (Just Below 4 Cards) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">{t("Notifications")}</h2>
            <Link to="/recruiter/notifications" className="text-sm font-semibold text-indigo-600 hover:underline">{t("View all →")}</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {notifications.map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-50 hover:bg-gray-50 transition">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.color}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 break-words line-clamp-2">{n.text}</div>
                  <div className="text-[10px] font-bold text-gray-400 mt-1">{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROW A: Priorities & AI Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Today's Priorities */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{t("Today's Priorities")}</h2>
                <FiAlertCircle className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                <button onClick={() => setPrioritiesCollapsed(!prioritiesCollapsed)} className="flex items-center gap-1 hover:text-indigo-600">
                  {prioritiesCollapsed ? 'Expand' : 'Collapse'} {prioritiesCollapsed ? <FiChevronDown /> : <FiChevronRight className="-rotate-90" />}
                </button>
                <label className="flex items-center gap-2 cursor-pointer hidden sm:flex">
                  <span className="text-gray-500">{t("Remember my preference")}</span>
                  <div className="relative inline-block w-8 h-4 bg-indigo-600 rounded-full">
                    <div className="absolute right-1 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </label>
              </div>
            </div>
            {!prioritiesCollapsed && (
              <div className="flex-1 flex items-center justify-center">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100 p-2 w-full">
                  <div className="p-4 text-center flex flex-col items-center">
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                      <FiUserPlus className="text-emerald-600 w-5 h-5" />
                    </div>
                    <div className="text-sm text-gray-600 font-semibold mb-1">{t("New Applications")}</div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">18</div>
                    <Link to="#" className="text-xs font-bold text-indigo-600 hover:underline">{t("View application list →")}</Link>
                  </div>
                  <div className="p-4 text-center flex flex-col items-center">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                      <FiCalendar className="text-blue-600 w-5 h-5" />
                    </div>
                    <div className="text-sm text-gray-600 font-semibold mb-1">{t("Interviews")}</div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">5</div>
                    <Link to="#" className="text-xs font-bold text-indigo-600 hover:underline">{t("View schedule →")}</Link>
                  </div>
                  <div className="p-4 text-center flex flex-col items-center">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center mb-2">
                      <FiCheckSquare className="text-orange-600 w-5 h-5" />
                    </div>
                    <div className="text-sm text-gray-600 font-semibold mb-1">{t("Offers")}</div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">3</div>
                    <Link to="#" className="text-xs font-bold text-indigo-600 hover:underline">{t("View offers →")}</Link>
                  </div>
                  <div className="p-4 text-center flex flex-col items-center">
                    <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mb-2">
                      <FiMessageSquare className="text-purple-600 w-5 h-5" />
                    </div>
                    <div className="text-sm text-gray-600 font-semibold mb-1">{t("Follow-ups")}</div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">11</div>
                    <Link to="#" className="text-xs font-bold text-indigo-600 hover:underline">{t("Respond now →")}</Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Suggestions */}
          <div className="bg-gradient-to-b from-indigo-50/50 to-white rounded-2xl border border-indigo-100 shadow-sm p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{t("AI Suggestions")}</h2>
                <FiAlertCircle className="w-4 h-4 text-gray-400" />
              </div>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{t("AI")}</span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-3 mb-4">
              <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between hover:border-indigo-200 hover:shadow-sm transition cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <FiUserPlus className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 leading-tight">{t("Contact 18 highly matching candidates")}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{t("High chance of positive response")}</div>
                  </div>
                </div>
                <FiChevronRight className="text-gray-400 group-hover:text-indigo-600 transition shrink-0" />
              </div>
              
              <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between hover:border-indigo-200 hover:shadow-sm transition cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <HiSparkles className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 leading-tight">{t("Increase salary range by ₹1.0 L")}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{t("To get 35% more applicants")}</div>
                  </div>
                </div>
                <FiChevronRight className="text-gray-400 group-hover:text-indigo-600 transition shrink-0" />
              </div>
            </div>
            
            <div className="text-center mt-auto pt-2">
              <Link to="/recruiter/ai" className="text-sm font-bold text-indigo-600 hover:underline flex items-center justify-center gap-1">{t("View AI Workspace →")}</Link>
            </div>
          </div>
        </div>

        {/* ROW B: My Active Jobs & Today's Interviews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* My Active Jobs Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{t("My Active Jobs")}</h2>
              <Link to="/recruiter/jobs" className="text-sm font-semibold text-indigo-600 hover:underline">{t("View all →")}</Link>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 pr-2 whitespace-nowrap">{t("Job Title")}</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t("Apps")}</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t("Intvs")}</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t("AI Health")}</th>
                    <th className="py-3 px-2 whitespace-nowrap">{t("Tags")}</th>
                    <th className="py-3 pl-2">{t("Status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeJobs.map(job => (
                    <tr key={job.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 pr-2 font-bold text-gray-900 text-sm whitespace-nowrap">{job.title}</td>
                      <td className="py-3 px-2 text-center font-semibold text-gray-700">{job.applicants}</td>
                      <td className="py-3 px-2 text-center font-semibold text-gray-700">{job.interviews}</td>
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-emerald-400 text-emerald-600 text-[10px] font-bold relative mx-auto">
                          {job.aiHealth}%
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        {job.tag ? (
                          <div className="flex flex-col">
                            <span className={`text-[10px] font-bold whitespace-nowrap ${job.tag === 'Featured' ? 'text-indigo-600' : 'text-red-600'}`}>{job.tag}</span>
                            <span className="text-[10px] text-gray-500 whitespace-nowrap">{job.tagDesc}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 pl-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${job.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 text-center shrink-0">
              <Link to="/recruiter/jobs/new" className="text-sm font-bold text-indigo-600 flex items-center justify-center gap-1 hover:underline">{t("+ Create New Job")}</Link>
            </div>
          </div>

          {/* Today's Interviews */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-full max-h-[450px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{t("Today's Interviews")}</h2>
              <Link to="/recruiter/interviews" className="text-sm font-semibold text-indigo-600 hover:underline">{t("View all →")}</Link>
            </div>
            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {interviews.map(inv => (
                <div key={inv.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3 hover:border-indigo-100 transition group cursor-pointer">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-16 shrink-0 text-center">
                      <span className="block text-[11px] sm:text-xs font-bold text-indigo-600 bg-indigo-50 py-1 px-1 sm:px-2 rounded">{inv.time}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 text-xs sm:text-sm truncate">{inv.name}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 font-medium truncate">{inv.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <span className="text-[10px] sm:text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded hidden min-[400px]:inline-block">
                      {inv.round}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 text-center shrink-0">
              <Link to="/recruiter/calendar" className="text-sm font-bold text-indigo-600 hover:underline">{t("View Full Calendar →")}</Link>
            </div>
          </div>

        </div>

        {/* ROW C: Hiring Snapshot & Follow-ups */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Hiring Snapshot */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-2">
              <h2 className="text-lg font-bold text-gray-900">{t("Hiring Snapshot")}<span className="text-sm font-medium text-gray-500">{t("(This Week)")}</span></h2>
              <Link to="/recruiter/reports" className="text-sm font-semibold text-indigo-600 hover:underline">{t("View full report →")}</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center">
                    <FiUserPlus className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">{t("New Apps")}</span>
                </div>
                <div className="text-3xl font-extrabold text-gray-900">86</div>
                <div className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <FiTrendingUp /> 18%
                </div>
                <div className="text-[10px] text-gray-400 font-medium mt-1">{t("vs last week")}</div>
              </div>
              <div className="flex flex-col justify-center border-l border-gray-50 pl-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center">
                    <FiCalendar className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">{t("Interviews")}</span>
                </div>
                <div className="text-3xl font-extrabold text-gray-900">23</div>
                <div className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <FiTrendingUp /> 12%
                </div>
                <div className="text-[10px] text-gray-400 font-medium mt-1">{t("vs last week")}</div>
              </div>
              <div className="flex flex-col justify-center border-l border-gray-50 pl-4 hidden sm:flex">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-6 h-6 bg-orange-50 rounded-full flex items-center justify-center">
                    <FiCheckSquare className="w-3 h-3 text-orange-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">{t("Offers")}</span>
                </div>
                <div className="text-3xl font-extrabold text-gray-900">4</div>
                <div className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <FiTrendingUp /> 33%
                </div>
                <div className="text-[10px] text-gray-400 font-medium mt-1">{t("vs last week")}</div>
              </div>
              <div className="flex flex-col justify-center border-l border-gray-50 pl-4 hidden sm:flex">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-6 h-6 bg-purple-50 rounded-full flex items-center justify-center">
                    <FiCheckCircle className="w-3 h-3 text-purple-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">{t("Hires")}</span>
                </div>
                <div className="text-3xl font-extrabold text-gray-900">2</div>
                <div className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <FiTrendingUp /> 100%
                </div>
                <div className="text-[10px] text-gray-400 font-medium mt-1">{t("vs last week")}</div>
              </div>
            </div>
          </div>

          {/* Follow-ups Pending */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{t("Follow-ups Pending")}</h2>
              <Link to="/recruiter/tasks" className="text-sm font-semibold text-indigo-600 hover:underline">{t("View all →")}</Link>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-4">
              {followUps.map(f => (
                <div key={f.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${f.bg}`}>
                      {f.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900"><span className="text-gray-900">{f.count}</span> {f.title}</div>
                      <div className="text-xs text-gray-500">{f.desc}</div>
                    </div>
                  </div>
                  <button className="w-full sm:w-auto shrink-0 px-4 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-sm">
                    {f.btn}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
