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
  { id: 'review', label: 'In Review' },
  { id: 'interview', label: 'Interview' },
  { id: 'offered', label: 'Offered' },
  { id: 'rejected', label: 'Rejected' }
];

const mapStatusToTab = (status) => {
  const s = (status || '').toLowerCase();
  if (['pending', 'applied'].includes(s)) return 'all'; 
  if (['reviewed', 'screening'].includes(s)) return 'review';
  if (['contacted', 'shortlisted', 'interview'].includes(s)) return 'interview';
  if (['hired', 'offered'].includes(s)) return 'offered';
  if (['rejected'].includes(s)) return 'rejected';
  return 'all';
};

const getStatusIndex = (status) => {
  const s = (status || '').toLowerCase();
  if (['rejected'].includes(s)) return -1;
  if (['hired', 'offered'].includes(s)) return 4;
  if (['contacted', 'shortlisted', 'interview'].includes(s)) return 3;
  if (['reviewed', 'screening'].includes(s)) return 2;
  return 1; // default to applied
};

const STEPS = ['Applied', 'Screening', 'Interview', 'Offered'];

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
    const c = { all: apps.length, review: 0, interview: 0, offered: 0, rejected: 0 };
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
                               statusIndex === 4 ? 'Congratulations! You have an offer.' :
                               statusIndex === 3 ? 'Great! You are invited for an interview.' :
                               'Your application is under review.'}
                            </p>
                          </div>
                          
                          {/* Stepper */}
                          <div className="relative">
                            <div className="absolute top-2 left-3 right-3 h-0.5 bg-slate-100 -z-10"></div>
                            {/* Active Line */}
                            {!isRejected && (
                              <div className="absolute top-2 left-3 h-0.5 bg-emerald-500 -z-10 transition-all duration-500" 
                                   style={{ width: `${((statusIndex - 1) / (STEPS.length - 1)) * 100}%` }}></div>
                            )}
                            <div className="flex justify-between items-center text-xs font-semibold">
                              {STEPS.map((step, idx) => {
                                const stepNum = idx + 1;
                                const isCompleted = !isRejected && statusIndex >= stepNum;
                                const isCurrent = !isRejected && statusIndex === stepNum;
                                const isFailed = isRejected && statusIndex === -1 && idx === 0; // Show X on first step or current step
                                
                                return (
                                  <div key={step} className="flex flex-col items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                                      isFailed ? 'bg-white border-red-500' :
                                      isCompleted ? 'bg-emerald-500 border-emerald-500' : 
                                      isCurrent ? 'bg-white border-emerald-500 shadow-[0_0_0_2px_white,0_0_0_4px_#10b981]' : 
                                      'bg-white border-slate-300'
                                    }`}>
                                      {isCompleted && <HiCheckCircle className="w-4 h-4 text-white shrink-0" />}
                                      {isFailed && <HiX className="w-3 h-3 text-red-500 shrink-0" />}
                                    </div>
                                    <span className={`${isCurrent || isCompleted ? 'text-emerald-800' : isFailed ? 'text-red-600' : 'text-slate-400'}`}>
                                      {step}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* AI Match Area */}
                        <div className="flex gap-6 mt-auto text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {isRejected ? (
                            <div className="flex-1">
                              <span className="text-xs text-slate-500 font-medium block mb-1">Feedback</span>
                              <span className="font-semibold text-slate-800">Not a match for this role.</span>
                            </div>
                          ) : statusIndex === 4 ? (
                            <>
                              <div className="flex-1">
                                <span className="text-xs text-slate-500 font-medium block mb-1">AI Match Score</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-2">
                                  {aiChance}% <span className="text-xs text-emerald-600">{aiLabel}</span>
                                </span>
                              </div>
                              <div className="flex-1">
                                <span className="text-xs text-slate-500 font-medium block mb-1">Offered Salary</span>
                                <span className="font-semibold text-slate-800">₹{job.budgetMin?.toLocaleString() || '16'} - {job.budgetMax?.toLocaleString() || '20'} LPA</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex-1">
                                <span className="text-xs text-slate-500 font-medium block mb-1">AI Interview Chance</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-2">
                                  {aiChance}% <span className="text-xs text-emerald-600">{aiLabel}</span>
                                </span>
                              </div>
                              <div className="flex-1">
                                <span className="text-xs text-slate-500 font-medium block mb-1">
                                  {statusIndex === 3 ? 'Next Step' : 'Expected Response'}
                                </span>
                                <span className="font-semibold text-slate-800 block text-xs">
                                  {statusIndex === 3 ? 'Technical Interview' : '3-7 days'}
                                </span>
                                {statusIndex === 3 && (
                                  <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                    <HiOutlineCalendar className="w-3 h-3" /> Scheduled on {new Date(Date.now() + 86400000*3).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                )}
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
                          <button className="w-full py-1.5 px-4 text-xs font-bold text-emerald-700 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition shadow-sm text-center">
                            View Job
                          </button>
                          <Link to="/provider/job-for-me" className="w-full text-right text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center justify-end gap-1">
                            Application Details <HiOutlineExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button className="w-full py-2 px-3 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition shadow-sm flex items-center justify-center gap-1.5 mt-2">
                            <FaWhatsapp className="w-4 h-4 text-emerald-500" /> WhatsApp Updates
                          </button>
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

        {/* Right Sidebar Widgets */}
        <div className="w-full xl:w-80 shrink-0 space-y-6">
          
          {/* AI Application Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">AI Application Overview</h3>
              <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center font-bold text-[10px]">
                AI
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 shrink-0">
                <CircularProgressbar 
                  value={82} 
                  text="82%"
                  styles={buildStyles({
                    textSize: '24px',
                    pathColor: '#059669',
                    textColor: '#059669',
                    trailColor: '#ecfdf5',
                  })}
                />
              </div>
              <div>
                <h4 className="font-bold text-emerald-700 text-sm">Excellent Progress</h4>
                <p className="text-xs text-slate-500 leading-tight mt-0.5">You're doing great! Keep applying to increase your chances.</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs font-semibold text-slate-600 mb-6">
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2"><HiCheckCircle className="text-emerald-500" /> Applications in review</span>
                <span className="text-emerald-600 font-bold">{counts.review}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2"><HiCheckCircle className="text-emerald-500" /> Interviews scheduled</span>
                <span className="text-emerald-600 font-bold">{counts.interview}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2"><HiCheckCircle className="text-emerald-500" /> Offers received</span>
                <span className="text-emerald-600 font-bold">{counts.offered}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2"><HiCheckCircle className="text-emerald-500" /> Rejections</span>
                <span className="text-emerald-600 font-bold">{counts.rejected}</span>
              </li>
            </ul>

            <button className="w-full py-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition text-center">
              View Full Analysis &rarr;
            </button>
          </div>

          {/* WhatsApp Alert Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <FaWhatsapp className="text-emerald-600 w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Stay Updated on WhatsApp</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Get real-time updates about your applications, interviews & job alerts.</p>
            <ul className="space-y-2 mb-5 text-[11px] text-slate-600 font-medium">
              <li className="flex items-center gap-2"><HiCheckCircle className="text-emerald-500 w-3 h-3" /> Application status updates</li>
              <li className="flex items-center gap-2"><HiCheckCircle className="text-emerald-500 w-3 h-3" /> Interview reminders</li>
              <li className="flex items-center gap-2"><HiCheckCircle className="text-emerald-500 w-3 h-3" /> New job matches</li>
            </ul>
            <button className="w-full py-2 text-xs font-bold text-emerald-700 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition shadow-sm flex justify-center items-center gap-2">
              Enable WhatsApp Updates <FaWhatsapp className="w-4 h-4 text-emerald-500" />
            </button>
          </div>

          {/* Earn Extra Income Box */}
          <div className="bg-[#0f3d35] rounded-xl text-white p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <HiOutlineSparkles className="text-amber-400 w-5 h-5" />
              <h3 className="font-bold text-base">Earn Extra Income</h3>
              <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm">New</span>
            </div>
            <p className="text-xs text-emerald-100 mb-4 font-medium">Get nearby freelance projects</p>
            <ul className="space-y-1.5 mb-5 text-xs text-emerald-50 font-medium">
              <li className="flex items-center gap-2"><HiCheckCircle className="text-emerald-300 w-3 h-3" /> Weekend Projects</li>
              <li className="flex items-center gap-2"><HiCheckCircle className="text-emerald-300 w-3 h-3" /> Part-Time Work</li>
              <li className="flex items-center gap-2"><HiCheckCircle className="text-emerald-300 w-3 h-3" /> Instant Payments</li>
            </ul>
            <div className="bg-white rounded-lg p-3 text-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition z-10 relative">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Just ₹1/day</div>
                <div className="text-sm font-bold text-slate-900">Enable Freelance Alerts</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <FaWhatsapp className="text-emerald-600 w-4 h-4" />
              </div>
            </div>
            <div className="text-center text-[10px] text-emerald-200 mt-2 relative z-10">
              Cancel anytime
            </div>
            {/* Background design */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-600 rounded-full opacity-20 blur-xl pointer-events-none"></div>
          </div>

          {/* Need Help Box */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex items-center justify-between">
            <div className="pr-4">
              <h3 className="font-bold text-slate-900 text-sm mb-1">Need Help?</h3>
              <p className="text-[10px] text-slate-500 mb-1">Chat with us on WhatsApp</p>
              <p className="text-[10px] text-slate-500 mb-3">We're here to help you 9 AM - 9 PM</p>
              <button className="py-1.5 px-3 text-[11px] font-bold text-emerald-700 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition shadow-sm flex items-center gap-1.5">
                Chat Now on WhatsApp <FaWhatsapp className="w-3.5 h-3.5 text-emerald-500" />
              </button>
            </div>
            <div className="shrink-0 w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
               {/* Illustration placeholder */}
               <div className="w-full h-full bg-slate-300 flex items-center justify-center">
                 <HiOutlineChat className="w-8 h-8 text-slate-500" />
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
