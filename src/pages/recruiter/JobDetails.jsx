import useTranslation from "../../hooks/useTranslation";
import React, { useState, useEffect } from 'react';
import { 
  FiMapPin, FiClock, FiCalendar, FiExternalLink, FiMoreHorizontal, 
  FiSearch, FiFilter, FiChevronDown, FiFileText, FiMessageSquare, 
  FiLoader, FiChevronRight, FiCheckCircle, FiEye, FiUsers, FiTrendingUp, FiBarChart2, FiUser
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useParams, Link } from 'react-router-dom';
import { recruiterAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
import CandidateProfileModal from '../../components/recruiter/CandidateProfileModal';

const SCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

// Map backend statuses to Kanban columns
const STATUS_COLUMNS = [
  { id: 'pending', title: 'Applied', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
  { id: 'reviewed', title: 'Reviewed', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  { id: 'contacted', title: 'Contacted', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
  { id: 'shortlisted', title: 'Shortlisted', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
  { id: 'hired', title: 'Hired', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  { id: 'rejected', title: 'Rejected', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
];

export default function JobDetails() {
  const {
    t
  } = useTranslation();

  const { id: jobId } = useParams();
  const [activeTab, setActiveTab] = useState('pipeline');

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedAppId, setDraggedAppId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobRes, appsRes] = await Promise.all([
        recruiterAPI.getJobById(jobId),
        recruiterAPI.getJobApplications(jobId)
      ]);
      setJob(jobRes.data);
      // The backend returns an array directly, so appsRes.data IS the array
      setApplications(Array.isArray(appsRes.data) ? appsRes.data : (appsRes.data.applications || []));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, appId) => {
    setDraggedAppId(appId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!draggedAppId) return;

    const appToMove = applications.find(a => a._id === draggedAppId);
    if (!appToMove || appToMove.status === newStatus) {
      setDraggedAppId(null);
      return;
    }

    // Optimistic UI update
    const previousApps = [...applications];
    setApplications(apps => apps.map(a => 
      a._id === draggedAppId ? { ...a, status: newStatus } : a
    ));
    setDraggedAppId(null);

    try {
      await recruiterAPI.updateApplicationStatus(draggedAppId, { status: newStatus });
      toast.success('Status updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
      setApplications(previousApps); // Revert on error
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-24">
        <FiLoader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!job) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-24">
      <div className="text-gray-500 font-bold">{t("Job not found")}</div>
    </div>
  );

  // Filter applications by search query
  const filteredApplications = applications.filter(app => {
    if (!searchQuery.trim()) return true;
    const name = app.provider?.name || 'Unknown User';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Group applications by status
  const groupedApps = STATUS_COLUMNS.map(col => ({
    ...col,
    candidates: filteredApplications.filter(app => app.status === col.id)
  }));

  const totalCandidates = applications.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>{t("Active")}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500">
                <div className="flex items-center gap-1"><FiMapPin className="text-gray-400" /> {job.city || job.location?.city || 'Location N/A'}</div>
                <div className="flex items-center gap-1"><FiClock className="text-gray-400" /> {job.workMode || 'Full-time'}</div>
                <div className="flex items-center gap-1"><FiCalendar className="text-gray-400" />{t("Created on")}{format(new Date(job.createdAt), 'dd MMM yyyy')}</div>
                <div className="flex items-center gap-1 text-gray-400">{t("Job ID:")}{job._id.slice(-6).toUpperCase()}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 w-full md:w-auto justify-start md:justify-end">
              <Link to={`/job/${job._id}`} target="_blank" className="flex-1 md:flex-none justify-center items-center flex gap-1.5 bg-white border border-gray-200 text-indigo-600 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm transition">{t("View Job Page")}<FiExternalLink />
              </Link>
              <button onClick={() => toast('Promote job feature coming soon!', { icon: '🚀' })} className="flex-1 md:flex-none justify-center items-center flex gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm transition">
                <HiSparkles />{t("Promote Job")}<FiChevronDown />
              </button>
              <button onClick={() => toast('More actions coming soon!')} className="p-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition shadow-sm shrink-0">
                <FiMoreHorizontal />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-6 mt-6 border-b border-gray-100 overflow-x-auto whitespace-nowrap custom-scrollbar pb-0.5">
            {[
              { id: 'pipeline', label: 'Pipeline' },
              { id: 'details', label: 'Job Details' },
              { id: 'applicants', label: `Applicants (${totalCandidates})` },
              { id: 'analytics', label: 'Job Analytics' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'pipeline' && (
          <>
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder={t("Search candidates...")} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all" 
              />
            </div>
            <button onClick={() => toast('Advanced filters coming soon!')} className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
              <FiFilter className="text-gray-400" />{t("Filters")}</button>
          </div>
        </div>

        {/* Kanban Board Container */}
        <div className="flex gap-5 overflow-x-auto pb-6 custom-scrollbar min-h-[500px]">
          {groupedApps.map((col) => (
            <div 
              key={col.id} 
              className={`shrink-0 w-[280px] flex flex-col rounded-2xl border ${col.border} ${col.bg} p-2.5 transition-colors duration-200`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-3">
                <h3 className="font-bold text-gray-900 text-sm">{col.title}</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md bg-white border ${col.border} ${col.text}`}>
                  {col.candidates.length}
                </span>
              </div>

              {/* Candidates List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mt-1 min-h-[100px]">
                {col.candidates.length === 0 && (
                  <div className="text-[11px] font-medium text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded-xl mx-2">{t("Drop candidates here")}</div>
                )}
                {col.candidates.map((cand) => {
                  const initial = cand.provider?.name ? cand.provider.name.charAt(0).toUpperCase() : 'U';
                  
                  return (
                    <div 
                      key={cand._id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, cand._id)}
                      className={`bg-white rounded-xl border p-3 shadow-sm hover:shadow-md transition cursor-grab relative 
                        ${draggedAppId === cand._id ? 'opacity-50 border-indigo-300' : 'border-gray-100'}`}
                    >
                      <div className="flex gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {initial}
                        </div>
                        <div className="truncate w-full">
                          <h4 className="text-xs font-bold text-gray-900 truncate">{cand.provider?.name || 'Unknown User'}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {cand.appliedAt ? formatDistanceToNow(new Date(cand.appliedAt), { addSuffix: true }) : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setSelectedCandidate(cand)} className="w-6 h-6 flex items-center justify-center rounded border border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition" title="View Profile">
                            <FiUser className="w-3 h-3" />
                          </button>
                          <button onClick={() => window.location.href = `mailto:${cand.provider?.email}`} className="w-6 h-6 flex items-center justify-center rounded border border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition" title="Contact">
                            <FiMessageSquare className="w-3 h-3" />
                          </button>
                        </div>
                        
                        {cand.aiMatch !== undefined && cand.aiMatch !== null && (
                          <div className="relative w-8 h-8 flex items-center justify-center" title="AI Match Score">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-gray-100"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              />
                              <path
                                className={cand.aiMatch >= 80 ? 'text-emerald-500' : cand.aiMatch >= 60 ? 'text-emerald-400' : 'text-amber-400'}
                                strokeDasharray={`${cand.aiMatch}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              />
                            </svg>
                            <span className="absolute text-[9px] font-bold text-gray-700">{cand.aiMatch}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Panels (Summary) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <SCard className="p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-6">{t("Pipeline Summary")}</h3>
            <div className="flex items-center justify-between">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E0E7FF" strokeWidth="8" />
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#4F46E5" strokeWidth="8" strokeDasharray="100 0" strokeDashoffset="0" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-medium text-gray-500 leading-none">{t("Total")}</span>
                  <span className="text-xl font-bold text-gray-900 leading-none mt-1">{totalCandidates}</span>
                </div>
              </div>
              <div className="flex-1 ml-6 space-y-2">
                {groupedApps.map((col, i) => {
                  const pct = totalCandidates ? Math.round((col.candidates.length / totalCandidates) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-gray-700">{col.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{col.candidates.length}</span>
                        <span className="text-gray-500 w-8 text-right">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SCard>
          
          <SCard className="p-5">
             <div className="flex items-center justify-between mb-5">
               <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                 <HiSparkles className="text-indigo-600" />{t("AI Recommendations")}</h3>
             </div>
             <div className="space-y-4 mt-2">
               {totalCandidates < 5 && (
                  <div className="flex gap-3 text-xs font-bold text-gray-700">
                    <FiCheckCircle className="text-indigo-500 w-4 h-4 shrink-0" />{t(
                    "Review and refresh your job posting. Try updating the salary bounds to attract more candidates."
                  )}</div>
               )}
               {groupedApps.find(a => a.id === 'applied')?.candidates.length > 0 && (
                  <div className="flex gap-3 text-xs font-bold text-gray-700">
                    <FiCheckCircle className="text-emerald-500 w-4 h-4 shrink-0" />{t(
                    "You have candidates waiting in the Applied stage. Review their AI scores to fast-track them."
                  )}</div>
               )}
               {groupedApps.find(a => a.id === 'contacted')?.candidates.length > 0 && (
                  <div className="flex gap-3 text-xs font-bold text-gray-700">
                    <FiCheckCircle className="text-amber-500 w-4 h-4 shrink-0" />{t("Don't forget to follow up with your Contacted candidates!")}</div>
               )}
             </div>
          </SCard>
        </div>
        </>
        )}

        {activeTab === 'details' && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t("Job Details")}</h2>
            <div className="prose text-sm text-gray-600 max-w-none">
              <p><strong>{t("Title:")}</strong> {job.title}</p>
              <p><strong>{t("Location:")}</strong> {job.city || job.location?.city}</p>
              <p><strong>{t("Work Mode:")}</strong> {job.workMode}</p>
              <p><strong>{t("Description:")}</strong></p>
              <div className="whitespace-pre-wrap">{job.description || 'No description provided.'}</div>
            </div>
          </div>
        )}

        {activeTab === 'applicants' && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t("All Applicants")}</h2>
            <div className="space-y-4">
              {applications.map(app => (
                <div key={app._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{app.provider?.name || 'Unknown User'}</p>
                    <p className="text-xs text-gray-500">{t("Applied")}{app.appliedAt ? formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true }) : ''}</p>
                  </div>
                  <div className="text-sm font-semibold capitalize px-3 py-1 bg-gray-50 rounded-md border border-gray-200">
                    {app.status}
                  </div>
                </div>
              ))}
              {applications.length === 0 && <p className="text-gray-500 text-sm">{t("No applicants yet.")}</p>}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SCard className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <FiUsers className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t("Total Applicants")}</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCandidates}</p>
                </div>
              </SCard>

              <SCard className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                  <FiTrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t("Shortlisted")}</p>
                  <p className="text-2xl font-bold text-gray-900">{groupedApps.find(a => a.id === 'shortlisted')?.candidates.length || 0}</p>
                </div>
              </SCard>
              
              <SCard className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <FiCheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t("Hired")}</p>
                  <p className="text-2xl font-bold text-gray-900">{groupedApps.find(a => a.id === 'hired')?.candidates.length || 0}</p>
                </div>
              </SCard>

              <SCard className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <FiBarChart2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t("Avg. AI Match")}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalCandidates > 0 
                      ? Math.round(applications.reduce((acc, a) => acc + (a.aiMatch || 0), 0) / totalCandidates) + '%'
                      : 'N/A'
                    }
                  </p>
                </div>
              </SCard>
            </div>

            <SCard className="p-6">
              <h3 className="font-bold text-gray-900 mb-6">{t("Funnel Drop-off")}</h3>
              <div className="space-y-4">
                {groupedApps.map(col => {
                  const pct = totalCandidates ? Math.round((col.candidates.length / totalCandidates) * 100) : 0;
                  return (
                    <div key={col.id}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-semibold text-gray-700">{col.title}</span>
                        <span className="text-gray-500 font-medium">{col.candidates.length}{t("candidates (")}{pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${col.bg.replace('50', '500')}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SCard>
          </div>
        )}
      </div>
      <CandidateProfileModal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        candidateProfile={selectedCandidate?.provider}
        candidateUser={selectedCandidate?.provider}
      />
    </div>
  );
}
