import useTranslation from "../../hooks/useTranslation";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiFilter, FiBookmark, FiChevronDown, FiList, FiGrid,
  FiMoreVertical, FiEye, FiEdit2, FiTrendingUp, FiArrowUpRight,
  FiClock, FiCheckCircle, FiPauseCircle, FiBriefcase, FiPlus, FiLoader, FiMapPin
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { recruiterAPI, jobsAPI } from '../../services/api';

const JobPostings = () => {
  const {
    t
  } = useTranslation();

  const [activeTab, setActiveTab] = useState('All Jobs');
  const [activeAIHealthTooltip, setActiveAIHealthTooltip] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState('recent');
  const [layout, setLayout] = useState('list');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await recruiterAPI.getJobPostings();
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBoost = async (job) => {
    const daysStr = window.prompt(`How many days do you want to boost the job "${job.title}"?`);
    if (!daysStr) return;
    const days = parseInt(daysStr, 10);
    if (isNaN(days) || days <= 0) {
      alert("Please enter a valid number of days.");
      return;
    }
    
    try {
      await jobsAPI.boostJob(job._id, days);
      alert("Job boosted successfully!");
      fetchJobs(); // Refresh job list
    } catch (error) {
      if (error.response?.status === 403) {
        alert(error.response.data.message || "You need an active premium plan to boost jobs.");
      } else if (error.response?.status === 400) {
        alert(error.response.data.message || "Invalid request.");
      } else {
        alert("Failed to boost job. Please try again.");
      }
    }
  };

  const handleEvaluate = async (jobId) => {
    try {
      await recruiterAPI.runAIEvaluation(jobId);
      // Wait a moment then refresh
      setTimeout(fetchJobs, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const draftJobs = jobs.filter(j => j.status === 'draft').length;
  const closedJobs = jobs.filter(j => j.status === 'closed').length;
  const onHoldJobs = jobs.filter(j => j.status === 'onHold').length;
  const totalJobs = jobs.length || 1;

  const jobStats = [
    { title: 'Active Jobs', count: activeJobs, percent: Math.round((activeJobs/totalJobs)*100)+'%', icon: <FiBriefcase className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50' },
    { title: 'Draft Jobs', count: draftJobs, percent: Math.round((draftJobs/totalJobs)*100)+'%', icon: <FiClock className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50' },
    { title: 'Closed Jobs', count: closedJobs, percent: Math.round((closedJobs/totalJobs)*100)+'%', icon: <FiCheckCircle className="w-5 h-5 text-gray-600" />, bg: 'bg-gray-100' },
    { title: 'On Hold', count: onHoldJobs, percent: Math.round((onHoldJobs/totalJobs)*100)+'%', icon: <FiPauseCircle className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50' },
  ];

  const filteredJobs = activeTab === 'All Jobs' 
    ? jobs 
    : jobs.filter(j => (j.status || '').toLowerCase() === activeTab.toLowerCase().replace(' ', ''));

  // Sorting logic
  const sortedJobs = [...filteredJobs];
  if (sortBy === 'recent') {
    sortedJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'applicants') {
    sortedJobs.sort((a, b) => (b.interestedCount || 0) - (a.interestedCount || 0));
  } else if (sortBy === 'match') {
    sortedJobs.sort((a, b) => (b.topAiMatch || 0) - (a.topAiMatch || 0));
  }

  // Pagination logic
  const totalPages = Math.ceil(sortedJobs.length / rowsPerPage);
  const paginatedJobs = sortedJobs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const totalApplicants = jobs.reduce((sum, job) => sum + (job.interestedCount || 0), 0);
  const screening = Math.floor(totalApplicants * 0.4);
  const interview = Math.floor(totalApplicants * 0.1);
  const offer = Math.floor(totalApplicants * 0.02);
  const hired = Math.floor(totalApplicants * 0.01);

  const pipeline = [
    { label: 'Applications', count: totalApplicants, color: 'bg-purple-500', width: totalApplicants ? '100%' : '0%' },
    { label: 'Screening', count: screening, color: 'bg-blue-500', width: totalApplicants ? `${Math.max(5, (screening/totalApplicants)*100)}%` : '0%' },
    { label: 'Interview', count: interview, color: 'bg-emerald-500', width: totalApplicants ? `${Math.max(5, (interview/totalApplicants)*100)}%` : '0%' },
    { label: 'Offer', count: offer, color: 'bg-orange-500', width: totalApplicants ? `${Math.max(5, (offer/totalApplicants)*100)}%` : '0%' },
    { label: 'Hired', count: hired, color: 'bg-teal-500', width: totalApplicants ? `${Math.max(5, (hired/totalApplicants)*100)}%` : '0%' },
  ];

  const jobsNeedingAttention = [...jobs].sort((a,b) => (a.topAiMatch || 0) - (b.topAiMatch || 0)).slice(0, 3);

  const chartPoints = [0, 0, 0, 0, 0];
  const now = new Date();
  jobs.forEach(job => {
    const jobDate = new Date(job.createdAt || new Date());
    const diffTime = Math.abs(now - jobDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weekIndex = 4 - Math.floor(diffDays / 7);
    if (weekIndex >= 0 && weekIndex < 5) {
      chartPoints[weekIndex] += (job.interestedCount || 0);
    }
  });

  const maxPoint = Math.max(...chartPoints, 10);
  const getY = (val) => 35 - ((val / maxPoint) * 30);

  const pathD = `M0,${getY(chartPoints[0])} C12,${getY(chartPoints[0])} 12,${getY(chartPoints[1])} 25,${getY(chartPoints[1])} S37,${getY(chartPoints[2])} 50,${getY(chartPoints[2])} S62,${getY(chartPoints[3])} 75,${getY(chartPoints[3])} S87,${getY(chartPoints[4])} 100,${getY(chartPoints[4])}`;
  const fillPathD = `${pathD} L100,40 L0,40 Z`;

  const chartWeeks = Array.from({length: 5}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (4 - i) * 7);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 relative">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{t("Jobs")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("Manage your jobs and hiring pipeline")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/recruiter/post-job" className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition flex items-center gap-2">
            <FiPlus className="w-4 h-4" />{t("Create New Job")}<FiChevronDown className="ml-1 opacity-70" />
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
                  {tab} {idx === 0 ? '' : <span className="ml-1 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-500">{[activeJobs, draftJobs, closedJobs, onHoldJobs][idx-1]}</span>}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
              <FiFilter />{t("Filters")}<span className="bg-indigo-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">2</span>
            </button>
            <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
              <FiBookmark />{t("Saved Views")}<FiChevronDown className="opacity-50" />
            </button>
          </div>
        </div>

        {/* JOBS OVERVIEW */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3">{t("Jobs Overview")}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {jobStats.map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${stat.bg}`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-0.5">{stat.title}</div>
                  <div className="text-2xl font-extrabold text-gray-900">{stat.count}</div>
                  <div className="text-[10px] font-bold text-gray-400 mt-0.5">{stat.percent}{t("of total jobs")}</div>
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
              <h2 className="text-lg font-bold text-gray-900">{t("My Jobs (")}{filteredJobs.length})</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
                  <button onClick={() => setLayout('list')} className={`p-1.5 rounded ${layout === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}><FiList className="w-4 h-4" /></button>
                  <button onClick={() => setLayout('grid')} className={`p-1.5 rounded ${layout === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}><FiGrid className="w-4 h-4" /></button>
                </div>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition focus:outline-none cursor-pointer"
                >
                  <option value="recent">{t("Sort by: Recent")}</option>
                  <option value="applicants">{t("Sort by: Applicants")}</option>
                  <option value="match">{t("Sort by: AI Match")}</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {layout === 'list' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                        <th className="py-4 pl-6 pr-3">{t("Job Title")}</th>
                        <th className="py-4 px-3 text-center">{t("Applicants")}</th>
                        <th className="py-4 px-3 text-center">{t("Interviews")}</th>
                        <th className="py-4 px-3 text-center">{t("AI Health")}</th>
                        <th className="py-4 px-3 text-center">{t("Status")}</th>
                        <th className="py-4 px-3">{t("Created On")}</th>
                        <th className="py-4 pr-6 pl-3 text-right">{t("Actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedJobs.map((job) => (
                        <tr key={job._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                          <td className="py-4 pl-6 pr-3">
                            <div className="flex items-center gap-4">
                              <div className="hidden sm:flex items-center justify-center">
                                {job.tags?.some(t => t === 'Featured') ? (
                                  <HiSparkles className="w-4 h-4 text-indigo-500" />
                                ) : (
                                  <div className="w-4 h-4" />
                                )}
                              </div>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 bg-indigo-100 text-indigo-600`}>
                                {(job.companyName || 'L')[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900 text-sm">{job.title}</span>
                                  {job.tags?.map((tag, i) => (
                                    <span key={i} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-gray-100 shadow-sm text-gray-600`}>
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                                  <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3" /> {job.city || 'N/A'}</span>
                                  <span className="flex items-center gap-1"><FiClock className="w-3 h-3" /> {job.workMode || 'onsite'}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex justify-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 text-gray-700 font-bold text-sm border border-gray-100 shadow-sm">
                                {job.interestedCount || 0}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex justify-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold text-sm border border-blue-100 shadow-sm">
                                0
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex justify-center relative group/tooltip">
                              {job.topAiMatch ? (
                                <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold border shadow-sm ${job.topAiMatch >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : job.topAiMatch >= 60 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                  <HiSparkles className="w-3 h-3 mr-1" /> {job.topAiMatch}%
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium">--</span>
                              )}
                              {job.isBoosted && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100 ml-1">{t("BOOSTED")}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${job.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
                              {(job.status || 'active').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-3">
                            <div className="text-xs font-semibold text-gray-600">{new Date(job.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="py-4 pr-6 pl-3 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link to={`/recruiter/jobs/${job._id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-indigo-600 hover:bg-gray-50 transition shadow-sm">
                                <FiEye className="w-3.5 h-3.5" />{t("View")}</Link>
                              <button onClick={() => handleEvaluate(job._id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-emerald-600 hover:bg-gray-50 transition shadow-sm">
                                <HiSparkles className="w-3.5 h-3.5" />{t("Eval")}</button>
                              <button onClick={() => handleBoost(job)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-purple-600 hover:bg-gray-50 transition shadow-sm">{t("Boost")}</button>
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
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {paginatedJobs.map((job) => (
                    <div key={job._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition flex flex-col h-full relative group">
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                        <Link to={`/recruiter/jobs/${job._id}`} className="p-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition block">
                          <FiArrowUpRight className="w-4 h-4" />
                        </Link>
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shrink-0">
                          {(job.companyName || 'L')[0].toUpperCase()}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${job.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
                          {(job.status || 'active').toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 pr-8">{job.title}</h3>
                      <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3" /> {job.city || 'N/A'}</span>
                        <span className="flex items-center gap-1"><FiClock className="w-3 h-3" /> {job.workMode || 'onsite'}</span>
                      </div>
                      
                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                        <div>
                          <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">{t("Applicants")}</div>
                          <div className="text-sm font-bold text-gray-900">{job.interestedCount || 0}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">{t("AI Match")}</div>
                          <div className="text-sm font-bold text-indigo-600">{job.topAiMatch ? job.topAiMatch + '%' : '--'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">{t("Rows per page:")}<select 
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="text-xs font-semibold text-gray-500">{t("Showing")}{filteredJobs.length > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0}{t("to")}{Math.min(currentPage * rowsPerPage, filteredJobs.length)}{t("of")}{filteredJobs.length}{t("jobs")}</div>
                <div className="flex items-center gap-1">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 font-bold flex items-center justify-center transition"
                  >
                    &lt;
                  </button>
                  <div className="text-xs font-bold px-2 text-gray-700">{t("Page")}{currentPage}{t("of")}{totalPages || 1}
                  </div>
                  <button 
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 font-bold flex items-center justify-center transition"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ANALYTICS & ALERTS */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Jobs Needing Attention */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">{t("Jobs Needing Attention")}</h3>
                <Link to="#" className="text-[10px] font-bold text-indigo-600 hover:underline">{t("View all (")}{jobsNeedingAttention.length}) &rarr;</Link>
              </div>
              <div className="space-y-4">
                {jobsNeedingAttention.map((job, idx) => (
                  <div key={job._id || idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0 font-bold text-red-600">
                      {(job.companyName || 'L')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">{job.title}</div>
                      <div className="text-[10px] font-bold text-red-500 mt-0.5">
                        {job.topAiMatch ? `AI Match: ${job.topAiMatch}% (Needs improvement)` : 'Evaluate applicants to see match score'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hiring Pipeline Snapshot */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-gray-900">{t("Hiring Pipeline Snapshot")}</h3>
                <Link to="#" className="text-[10px] font-bold text-indigo-600 hover:underline">{t("View full pipeline →")}</Link>
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
                <h3 className="text-sm font-bold text-gray-900">{t("Job Performance")}<span className="block text-[10px] text-gray-500 font-medium">{t("(This Month)")}</span></h3>
                <Link to="#" className="text-[10px] font-bold text-indigo-600 hover:underline">{t("View analytics →")}</Link>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 mb-1">{t("Total Applicants")}</div>
                  <div className="text-lg font-extrabold text-gray-900">{totalApplicants}</div>
                  <div className="text-[10px] font-bold text-emerald-600 flex items-center mt-1"><FiTrendingUp className="mr-0.5" /> 24%</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-500 mb-1">{t("Interviews")}</div>
                  <div className="text-lg font-extrabold text-gray-900">{interview}</div>
                  <div className="text-[10px] font-bold text-emerald-600 flex items-center mt-1"><FiTrendingUp className="mr-0.5" /> 18%</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-500 mb-1">{t("Hires")}</div>
                  <div className="text-lg font-extrabold text-gray-900">{hired}</div>
                  <div className="text-[10px] font-bold text-emerald-600 flex items-center mt-1"><FiTrendingUp className="mr-0.5" /> 14%</div>
                </div>
              </div>

              {/* Line Chart */}
              <div className="h-24 w-full bg-gray-50/50 rounded-xl border border-gray-100 relative overflow-hidden flex items-end mt-2">
                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d={pathD} fill="none" stroke="#4F46E5" strokeWidth="2" />
                  <path d={fillPathD} fill="url(#gradient)" stroke="none" opacity="0.2" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Axes Labels */}
                <div className="absolute inset-y-0 left-0 flex flex-col justify-between py-2 px-1 text-[8px] text-gray-400 font-bold">
                  <span>{maxPoint}</span>
                  <span>{Math.round(maxPoint / 2)}</span>
                  <span>0</span>
                </div>
                <div className="absolute bottom-0 inset-x-0 flex justify-between px-2 pb-1 text-[8px] text-gray-400 font-bold">
                  {chartWeeks.map((week, idx) => (
                    <span key={idx}>{week}</span>
                  ))}
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