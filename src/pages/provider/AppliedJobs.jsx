import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  HiSearch, HiFilter, HiOutlineDotsVertical, HiCheckCircle, HiOutlineClock,
  HiLocationMarker, HiOfficeBuilding, HiOutlineChat, HiOutlineCalendar,
  HiLightningBolt, HiOutlineSparkles, HiOutlineExternalLink, HiX
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { providerAPI } from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TABS = [
  { id: 'all', label: 'All Applications' },
  { id: 'review', label: 'Reviewed' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'hired', label: 'Hired' },
  { id: 'rejected', label: 'Rejected' }
];

const mapStatusToTab = (status) => {
  const s = (status || '').toLowerCase();
  if (['pending', 'applied'].includes(s)) return 'all'; 
  if (['reviewed', 'screening'].includes(s)) return 'review';
  if (['contacted', 'interview'].includes(s)) return 'contacted';
  if (['shortlisted'].includes(s)) return 'shortlisted';
  if (['hired', 'offered'].includes(s)) return 'hired';
  if (['rejected'].includes(s)) return 'rejected';
  return 'all';
};

const getStatusIndex = (status) => {
  const s = (status || '').toLowerCase();
  if (['rejected'].includes(s)) return -1;
  if (['hired', 'offered'].includes(s)) return 5;
  if (['shortlisted'].includes(s)) return 4;
  if (['contacted', 'interview'].includes(s)) return 3;
  if (['reviewed', 'screening'].includes(s)) return 2;
  return 1; // default to applied
};

const STEPS = ['Applied', 'Reviewed', 'Contacted', 'Shortlisted', 'Hired'];

export default function AppliedJobs() {
  const [activeTab, setActiveTab] = useState('all');
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    providerAPI.getApplications()
      .then(r => setApps(r.data?.applications || []))
      .catch(() => toast.error("Failed to load applications"))
      .finally(() => setLoading(false));
  }, []);

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const mapped = mapStatusToTab(app.status);
      const matchesTab = activeTab === 'all' || mapped === activeTab;
      const term = search.toLowerCase();
      const matchesSearch = !term || 
        app.jobPost?.title?.toLowerCase().includes(term) ||
        app.jobPost?.companyName?.toLowerCase().includes(term);
      return matchesTab && matchesSearch;
    });
  }, [apps, activeTab, search]);

  const counts = useMemo(() => {
    const c = { all: apps.length, review: 0, contacted: 0, shortlisted: 0, hired: 0, rejected: 0 };
    apps.forEach(app => {
      const tab = mapStatusToTab(app.status);
      if (tab !== 'all' && c[tab] !== undefined) c[tab]++;
    });
    return c;
  }, [apps]);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans p-4 md:p-6 xl:p-8">
      {/* Top Search Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="relative w-full max-w-xl">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search jobs, companies, skills..." 
            className="w-full pl-10 pr-16 py-2.5 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded">
            Ctrl + K
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          Applied Jobs
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {counts.all}
          </span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">Track your applications and stay updated on their progress</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left Content Area */}
        <div className="flex-1 min-w-0">
          
          {/* Tabs & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-sm font-semibold pb-2 whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id 
                      ? 'text-emerald-700 border-emerald-600' 
                      : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
                >
                  {tab.label} ({counts[tab.id] || 0})
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                Sort by
                <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>Recently Applied</option>
                  <option>Status Updates</option>
                </select>
              </div>
              <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-1.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
                <HiFilter className="w-4 h-4" /> Filter
              </button>
            </div>
          </div>

          {/* Job List */}
          <div className="space-y-4">
            {filteredApps.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-500 font-medium">No applications found in this category.</p>
              </div>
            ) : (
              filteredApps.map((app, index) => {
                const job = app.jobPost || {};
                const statusIndex = getStatusIndex(app.status);
                const isRejected = statusIndex === -1;
                
                // Determine pill color and label
                let statusLabel = 'Applied';
                let statusColor = 'bg-blue-50 text-blue-600';
                if (statusIndex === 2) { statusLabel = 'In Review'; statusColor = 'bg-indigo-50 text-indigo-600'; }
                if (statusIndex === 3) { statusLabel = 'Interview'; statusColor = 'bg-orange-50 text-orange-600'; }
                if (statusIndex === 4) { statusLabel = 'Offered'; statusColor = 'bg-emerald-50 text-emerald-700'; }
                if (isRejected) { statusLabel = 'Rejected'; statusColor = 'bg-red-50 text-red-600'; }

                // Mock AI stats if not present
                const aiChance = [78, 65, 88, 90][index % 4];
                const aiLabel = ['Good Chance', 'Average Chance', 'High Chance', 'Excellent'][index % 4];

                return (
                  <div key={app._id || index} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative">
                    <div className="flex flex-col lg:flex-row gap-6">
                      
                      {/* Left: Job Info */}
                      <div className="flex gap-4 min-w-[280px]">
                        <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <span className="font-extrabold text-xl text-slate-800 capitalize">
                            {(job.companyName || 'CO').substring(0,2)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg leading-tight">{job.title || 'Job Title'}</h3>
                          <div className="flex items-center gap-1 text-sm font-semibold text-slate-700 mt-1">
                            {job.companyName || job.recruiter?.name || 'Company Name'}
                            <HiCheckCircle className="text-blue-500 w-4 h-4" />
                          </div>
                          <div className="flex flex-col gap-1.5 mt-3 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5"><HiLocationMarker className="w-3.5 h-3.5" /> {job.city || 'Remote'} ({job.workMode || 'Hybrid'})</span>
                            <span className="flex items-center gap-1.5"><HiOutlineCalendar className="w-3.5 h-3.5" /> Applied on {new Date(app.appliedAt || app.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Progress Tracker & AI Stats */}
                      <div className="flex-1 flex flex-col justify-between border-l border-slate-100 pl-6 border-t lg:border-t-0 pt-4 lg:pt-0">
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                              {statusLabel}
                            </span>
                            <p className="text-xs text-slate-600 font-medium">
                              {isRejected ? 'This application was not successful.' : 
                               statusIndex === 5 ? 'Congratulations! You are hired.' :
                               statusIndex === 4 ? 'Great! You have been shortlisted.' :
                               statusIndex === 3 ? 'You have been contacted by the recruiter.' :
                               statusIndex === 2 ? 'Your application has been reviewed.' :
                               'Your application is under review.'}
                            </p>
                          </div>
                          
                          {/* Stepper */}
                          <div className="relative mt-2">
                            <div className="flex w-full items-start text-[10px] sm:text-xs font-semibold">
                              {STEPS.map((step, idx) => {
                                const stepNum = idx + 1;
                                const isCompleted = !isRejected && statusIndex >= stepNum;
                                const isCurrent = !isRejected && statusIndex === stepNum;
                                const isFailed = isRejected && statusIndex === -1 && idx === 0;
                                
                                return (
                                  <div key={step} className="flex-1 flex flex-col items-center gap-2 relative">
                                    {/* Line connecting to previous step */}
                                    {idx !== 0 && (
                                      <div className={`absolute top-2 left-0 w-1/2 h-0.5 -z-10 ${statusIndex >= stepNum ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                                    )}
                                    {/* Line connecting to next step */}
                                    {idx !== STEPS.length - 1 && (
                                      <div className={`absolute top-2 right-0 w-1/2 h-0.5 -z-10 ${statusIndex > stepNum ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                                    )}
                                    
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                                      isFailed ? 'bg-white border-red-500' :
                                      isCompleted ? 'bg-emerald-500 border-emerald-500' : 
                                      isCurrent ? 'bg-white border-emerald-500 shadow-[0_0_0_2px_white,0_0_0_4px_#10b981]' : 
                                      'bg-white border-slate-300'
                                    }`}>
                                      {isCompleted && <HiCheckCircle className="w-4 h-4 text-white shrink-0" />}
                                      {isFailed && <HiX className="w-3 h-3 text-red-500 shrink-0" />}
                                    </div>
                                    <span className={`text-center ${isCurrent || isCompleted ? 'text-emerald-800' : isFailed ? 'text-red-600' : 'text-slate-400'}`}>
                                      {step}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Job Snapshot Area */}
                        <div className="flex gap-6 mt-auto text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {isRejected ? (
                            <div className="flex-1">
                              <span className="text-xs text-slate-500 font-medium block mb-1">Feedback</span>
                              <span className="font-semibold text-slate-800">Not a match for this role.</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <span className="text-xs text-slate-500 font-medium block mb-1">Offered Salary</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-2">
                                  {job.budgetMin && job.budgetMax 
                                    ? `₹${job.budgetMin.toLocaleString()} - ${job.budgetMax.toLocaleString()}` 
                                    : 'Not Disclosed'}
                                  {job.budgetType && <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded capitalize">{job.budgetType}</span>}
                                </span>
                              </div>
                              <div className="flex-1">
                                <span className="text-xs text-slate-500 font-medium block mb-1">
                                  {statusIndex === 5 ? 'Status' : statusIndex >= 3 ? 'Next Step' : 'Expected Response'}
                                </span>
                                <span className="font-semibold text-slate-800 block text-xs">
                                  {statusIndex === 5 ? 'Hired' : statusIndex >= 3 ? 'Awaiting Recruiter' : '3-7 days'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col items-end justify-between shrink-0 min-w-[140px] pt-2">
                        <button className="text-slate-400 hover:text-slate-600 p-1 mb-2">
                          <HiOutlineDotsVertical className="w-5 h-5" />
                        </button>
                        
                        <div className="flex flex-col gap-3 w-full">
                          <Link to={`/job/${job._id}`} target="_blank" className="w-full block py-1.5 px-4 text-xs font-bold text-emerald-700 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition shadow-sm text-center">
                            View Job
                          </Link>
                          {job.recruiter && (
                            <button onClick={() => window.location.href = `mailto:${job.recruiter.email}`} className="w-full text-right text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center justify-end gap-1">
                              Contact Recruiter <HiOutlineExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Pagination Mock */}
          {filteredApps.length > 0 && (
            <div className="flex items-center justify-between mt-8 text-sm text-slate-500">
              <span>Showing 1 to {Math.min(5, filteredApps.length)} of {filteredApps.length} applications</span>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50">&lt;</button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-emerald-600 text-white font-bold">1</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50">2</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50">3</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50">&gt;</button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
