import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineBookmark,
  HiBookmark,
  HiLocationMarker,
  HiCurrencyRupee,
  HiOutlineBriefcase,
  HiCheckCircle,
  HiOutlinePaperAirplane,
  HiOutlineLockClosed,
  HiExclamationCircle,
  HiOutlineMail,
  HiOutlinePhone,
  HiBell,
  HiChevronDown,
  HiLightningBolt,
  HiOutlineClock,
  HiOutlineFilter
} from "react-icons/hi";
import { FaRupeeSign } from "react-icons/fa";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { providerAPI } from "../../services/api";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const BUDGET_LABELS = {
  fixed: "Fixed",
  hourly: "/hr",
  monthly: "/mo",
  negotiable: "Negotiable",
};

// Simplified JobCard adapted from Jobs.jsx for SavedJobs page
const SavedJobCard = ({ job, onUnsave, onViewDetails }) => {
  const budgetText =
    job.budgetType === "negotiable"
      ? "Negotiable"
      : `₹${job.budgetMin?.toLocaleString()} - ${job.budgetMax?.toLocaleString()} ${job.budgetType === 'yearly' ? 'LPA' : BUDGET_LABELS[job.budgetType] || ""}`.trim();

  const postedAgo = (() => {
    const d = Math.floor((Date.now() - new Date(job.createdAt || Date.now())) / 86400000);
    return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d} days ago`;
  })();

  const matchScore = job.matchScore || 0;
  
  const allJobSkills = [job.skill, ...(job.skills || [])]
    .map(s => typeof s === 'string' ? s.trim() : s?.name?.trim() || "")
    .filter(Boolean);
  const displaySkills = allJobSkills.slice(0, 4);
  const extraSkills = allJobSkills.length > 4 ? allJobSkills.length - 4 : 0;

  return (
    <div className="py-6 border-b border-gray-100 last:border-0 flex flex-col md:flex-row gap-5 relative group">
      {/* Logo */}
      <div className="shrink-0 pt-1">
        <div className="w-[60px] h-[60px] rounded-[16px] border border-gray-100 flex flex-col items-center justify-center shadow-sm bg-white overflow-hidden">
           {job.companyLogo ? (
             <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
           ) : (
             <span className="font-extrabold text-2xl text-gray-900 tracking-tighter capitalize">
               {job.companyName?.substring(0,1) || "C"}
             </span>
           )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {/* Match Badge */}
        <div className="text-[11px] font-bold text-[#10b981] mb-1">
          {matchScore}% Match
        </div>
        
        {/* Title & Company */}
        <h3 className="font-bold text-gray-900 text-[18px] leading-tight truncate mb-1">
          {job.title || "Web developer needed"}
        </h3>
        <div className="text-[13px] text-gray-700 font-medium mb-3 flex items-center gap-1.5">
          {job.companyName || "Company Name"} 
          <HiCheckCircle className="w-4 h-4 text-blue-500" />
        </div>
        
        {/* Info row */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-[12px] font-medium text-gray-500 mb-4">
          <div className="flex items-center gap-1.5">
             <HiLocationMarker className="w-[15px] h-[15px]" /> 
             {job.city || "Location"} ({job.workMode || 'Hybrid'})
          </div>
          <div className="flex items-center gap-1.5">
             <HiCurrencyRupee className="w-[15px] h-[15px]" /> 
             {budgetText}
          </div>
          <div className="flex items-center gap-1.5">
             <HiOutlineClock className="w-[15px] h-[15px]" /> 
             Saved {postedAgo}
          </div>
        </div>
        
        {/* Skills */}
        <div className="flex flex-wrap gap-2">
          {displaySkills.map((sk, i) => (
            <span key={i} className="text-[11px] px-3 py-1 bg-gray-50 text-gray-600 rounded-full font-semibold border border-gray-100">
              {sk}
            </span>
          ))}
          {extraSkills > 0 && (
            <span className="text-[11px] px-3 py-1 bg-gray-50 text-gray-600 rounded-full font-semibold border border-gray-100">
              +{extraSkills}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex flex-col justify-between items-end gap-4 ml-auto">
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onUnsave(job); }}
            className="w-9 h-9 rounded-xl bg-[#ecfdf5] flex items-center justify-center text-[#10b981] hover:bg-[#d1fae5] transition"
          >
            <HiBookmark className="w-[18px] h-[18px]" />
          </button>
          <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
        </div>
        
        <button
          onClick={() => onViewDetails(job)}
          className="px-6 py-2 bg-white border-2 border-[#10b981] text-[#10b981] hover:bg-[#ecfdf5] rounded-xl text-[13px] font-bold transition whitespace-nowrap mt-auto shadow-sm"
        >
          View Job
        </button>
      </div>
    </div>
  );
};

const SavedJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all'); // all, active
  const [sortBy, setSortBy] = useState('recent'); // recent, match
  const [filterActive, setFilterActive] = useState(false);
  const [filterWorkMode, setFilterWorkMode] = useState('All');
  const [recommendations, setRecommendations] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [profile, setProfile] = useState(null);
  const [alertEnabled, setAlertEnabled] = useState(false);

  useEffect(() => {
    fetchSavedJobs();
    fetchRecommendations();
    fetchProfile();
  }, []);

  useEffect(() => {
    if (allMatches.length > 0 && jobs.length > 0) {
      const savedSkills = new Set();
      jobs.forEach(job => {
        if (job.skill) savedSkills.add(job.skill.toLowerCase());
        if (job.skills) job.skills.forEach(s => savedSkills.add(typeof s === 'string' ? s.toLowerCase() : s?.name?.toLowerCase() || ''));
      });
      savedSkills.delete("");

      const scoredMatches = allMatches.map(match => {
        let similarity = 0;
        const matchSkills = [match.skill, ...(match.skills || [])]
          .map(s => typeof s === 'string' ? s.toLowerCase() : s?.name?.toLowerCase() || "")
          .filter(Boolean);
        
        matchSkills.forEach(s => {
          if (savedSkills.has(s)) similarity++;
        });
        return { ...match, similarityScore: similarity };
      });

      const savedIds = new Set(jobs.map(j => j._id));
      const filtered = scoredMatches.filter(m => !savedIds.has(m._id));
      
      filtered.sort((a, b) => b.similarityScore - a.similarityScore || (b.matchScore || 0) - (a.matchScore || 0));
      setRecommendations(filtered.slice(0, 3));
    } else if (allMatches.length > 0) {
      const savedIds = new Set(jobs.map(j => j._id));
      const filtered = allMatches.filter(m => !savedIds.has(m._id));
      setRecommendations(filtered.slice(0, 3));
    }
  }, [allMatches, jobs]);

  const fetchProfile = async () => {
    try {
      const { data } = await providerAPI.getDashboard();
      setProfile(data.profile || {});
    } catch (err) {
      console.log("Failed to load profile for overview", err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const { data } = await providerAPI.getMatches();
      if (data && data.data && data.data.length > 0) {
        setAllMatches(data.data);
        return;
      }
    } catch (err) {
      console.log("Using fallback recommendations");
    }
    // Fallback if API fails or returns empty so UI is still visible
    setAllMatches([
      { _id: 'rec1', title: "Frontend Engineer", companyName: "TechCorp Inc.", city: "Mumbai", matchScore: 94 },
      { _id: 'rec2', title: "React Developer", companyName: "DesignStudio", city: "Remote", matchScore: 88 }
    ]);
  };

  const fetchSavedJobs = async () => {
    setLoading(true);
    try {
      const { data } = await providerAPI.getSavedJobs();
      setJobs(data.jobs || []);
    } catch (err) {
      toast.error("Failed to load saved jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (job) => {
    try {
      await providerAPI.toggleSaveJob(job._id, !!job.isExternal);
      setJobs(prev => prev.filter(j => j._id !== job._id));
      toast.success("Job removed from saved jobs.");
    } catch (err) {
      toast.error("Failed to unsave job");
    }
  };

  const userSkillsRaw = [
    ...(profile?.skills || []),
    ...(profile?.parsedResumeData?.skills || []),
    ...(profile?.parsedResumeData?.technicalSkills || []),
    ...(profile?.parsedResumeData?.softSkills || [])
  ];
  
  const userSkills = Array.from(new Set(userSkillsRaw))
    .map(s => typeof s === 'string' ? s.trim() : s?.name?.trim() || "")
    .filter(Boolean);
  const userSkillsLower = userSkills.map(s => s.toLowerCase());

  // Dynamically calculate match score for jobs if not present
  const jobsWithScores = jobs.map(job => {
    if (job.matchScore) return job;
    
    const jSkills = [];
    if (job.skill) job.skill.split(',').forEach(s => jSkills.push(s.trim().toLowerCase()));
    if (job.skills) {
      job.skills.forEach(s => {
        const val = typeof s === 'string' ? s : s?.name || '';
        if (val) val.split(',').forEach(v => jSkills.push(v.trim().toLowerCase()));
      });
    }
    const uniqueJobSkills = Array.from(new Set(jSkills)).filter(Boolean);
    if (uniqueJobSkills.length === 0) return { ...job, matchScore: 100 };
    
    let matches = 0;
    uniqueJobSkills.forEach(req => {
      let found = userSkillsLower.find(us => us === req);
      if (!found) found = userSkillsLower.find(us => us.includes(req));
      if (!found) found = userSkillsLower.find(us => req.includes(us));
      if (found) matches++;
    });
    
    return { ...job, matchScore: Math.round((matches / uniqueJobSkills.length) * 100) };
  });

  let filteredJobs = jobsWithScores.filter(job => {
    if (tab === 'active' && (job.status === 'closed' || job.status === 'expired')) return false; 
    
    if (filterWorkMode && filterWorkMode !== 'All') {
      const mode = (job.workMode || '').toLowerCase();
      const fMode = filterWorkMode.toLowerCase();
      if (!mode.includes(fMode)) return false;
    }
    return true;
  });

  filteredJobs.sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    } else if (sortBy === 'match') {
      return (b.matchScore || 0) - (a.matchScore || 0);
    }
    return 0;
  });

  const averageMatchScore = jobsWithScores.length > 0 
    ? Math.round(jobsWithScores.reduce((acc, job) => acc + (job.matchScore || 0), 0) / jobsWithScores.length)
    : 0;

  const allRequiredSkills = new Set();
  jobsWithScores.forEach(job => {
    if (job.skill) {
      job.skill.split(',').forEach(s => allRequiredSkills.add(s.trim()));
    }
    if (job.skills) {
      job.skills.forEach(s => {
        const val = typeof s === 'string' ? s : s?.name || '';
        if (val) val.split(',').forEach(v => allRequiredSkills.add(v.trim()));
      });
    }
  });
  allRequiredSkills.delete("");

  const matchedSkillsSet = new Set();
  const missingSkillsSet = new Set();

  allRequiredSkills.forEach(reqSkill => {
    const reqLower = reqSkill.toLowerCase();
    
    // 1. Exact match
    let bestMatch = userSkills.find(us => us.toLowerCase() === reqLower);
    
    // 2. User skill contains job skill (e.g. "React Developer" contains "React")
    if (!bestMatch) {
      bestMatch = userSkills.find(us => us.toLowerCase().includes(reqLower));
    }
    
    // 3. Job skill contains user skill (e.g. "DevOps Engineer" contains "DevOps")
    if (!bestMatch) {
      bestMatch = userSkills.find(us => reqLower.includes(us.toLowerCase()));
    }

    if (bestMatch) {
      matchedSkillsSet.add(bestMatch);
    } else {
      missingSkillsSet.add(reqSkill);
    }
  });
  
  const matchedSkillsList = Array.from(matchedSkillsSet);
  const missingSkillsList = Array.from(missingSkillsSet);
  const matchedCount = matchedSkillsList.length;
  const totalRequired = matchedCount + missingSkillsList.length;
  const coveragePercent = totalRequired > 0 ? Math.round((matchedCount / totalRequired) * 100) : 0;
  const displayScore = totalRequired > 0 ? coveragePercent : averageMatchScore;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          
          {/* Main Content (Left Side) */}
          <div className="flex-1 min-w-0">
            <div className="mb-3">
              <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight flex items-center gap-3">
                Saved Jobs 
                <span className="text-[14px] px-3 py-1 bg-[#ecfdf5] text-[#10b981] rounded-full">{jobs.length}</span>
              </h1>
              <p className="text-[14px] text-gray-500 font-medium mt-1">Jobs you've saved for later</p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-200">
              {/* Tabs */}
              <div className="flex gap-6 mt-4">
                <button 
                  onClick={() => setTab('all')}
                  className={`text-[14px] font-bold pb-3 border-b-2 transition-colors relative top-[1px] ${tab === 'all' ? 'border-[#0f766e] text-[#0f766e]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  All Jobs ({jobs.length})
                </button>
                <button 
                  onClick={() => setTab('active')}
                  className={`text-[14px] font-bold pb-3 border-b-2 transition-colors relative top-[1px] ${tab === 'active' ? 'border-[#0f766e] text-[#0f766e]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Active ({jobs.filter(j => j.status !== 'closed' && j.status !== 'expired').length})
                </button>
              </div>

              {/* Sort By & Filter */}
              <div className="flex items-center gap-3 mb-2 sm:mb-0 relative">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-gray-500">Sort by</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-[13px] font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 appearance-none pr-8 cursor-pointer relative"
                    style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="none" viewBox="0 0 24 24" stroke="%239ca3af" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
                  >
                    <option value="recent">Recently Saved</option>
                    <option value="match">Match Score</option>
                  </select>
                </div>
                

              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-xs">
                <HiOutlineBookmark className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-600">No saved jobs found</p>
                <p className="text-sm text-gray-400 mt-1">Jobs you save will appear here.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-200 p-2 sm:p-6 shadow-sm">
                {filteredJobs.map(job => (
                  <SavedJobCard 
                    key={job._id} 
                    job={job} 
                    onUnsave={handleUnsave}
                    onViewDetails={(job) => navigate(`/provider/job/${job._id}`)}
                  />
                ))}
                
                <button className="w-full mt-4 py-3 text-[14px] font-bold text-[#10b981] flex items-center justify-center gap-2 hover:bg-gray-50 rounded-xl transition">
                  Load More Jobs <HiChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-[320px] shrink-0 space-y-6">
            
            {/* Match Overview Widget */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs relative overflow-hidden">
              <h3 className="font-bold text-gray-900 mb-4">Your Match Overview</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 shrink-0">
                  <CircularProgressbar 
                    value={displayScore} 
                    text={`${displayScore}%`} 
                    styles={buildStyles({
                      pathColor: '#10b981',
                      textColor: '#10b981',
                      trailColor: '#ecfdf5',
                      textSize: '24px',
                      strokeLinecap: 'round',
                    })}
                    strokeWidth={10}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {totalRequired === 0 ? 'Analysis Ready' : coveragePercent >= 70 ? 'Strong Skill Match' : coveragePercent >= 40 ? 'Moderate Skill Match' : 'Skill Gap Detected'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">
                    {totalRequired === 0 
                      ? "Save jobs with listed skills to see your match overview." 
                      : `You possess ${matchedCount} out of ${totalRequired} core skills required across your saved jobs.`
                    }
                  </p>
                </div>
              </div>

              {totalRequired > 0 && (
                <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                  {matchedSkillsList.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">What you have <span className="bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-widest">{matchedSkillsList.length}</span></p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedSkillsList.slice(0, 10).map(skill => (
                          <span key={skill} className="px-2 py-1 bg-[#ecfdf5] text-[#10b981] text-[10px] font-bold rounded-md capitalize border border-green-100/50">
                            ✓ {skill}
                          </span>
                        ))}
                        {matchedSkillsList.length > 10 && (
                          <span className="px-2 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-md border border-gray-100/50">
                            +{matchedSkillsList.length - 10}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {missingSkillsList.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">Skill Gaps (Missing) <span className="bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-widest">{missingSkillsList.length}</span></p>
                      <div className="flex flex-wrap gap-1.5">
                        {missingSkillsList.slice(0, 10).map(skill => (
                          <span key={skill} className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-md capitalize border border-rose-100/50">
                            × {skill}
                          </span>
                        ))}
                        {missingSkillsList.length > 10 && (
                          <span className="px-2 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-md border border-gray-100/50">
                            +{missingSkillsList.length - 10}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Recommendations Widget */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-1.5"><HiLightningBolt className="w-5 h-5 text-yellow-400" /> AI Recommendations</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">Jobs similar to what you've saved</p>
              
              <div className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <div key={rec._id || idx} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/50 cursor-pointer transition">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center font-bold text-gray-700 shrink-0">
                      {rec.title?.substring(0, 2).toUpperCase() || 'JB'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{rec.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{rec.companyName} • {rec.city}</p>
                      <p className="text-[10px] text-[#1d4ed8] font-bold mt-1">{rec.matchScore || 80}% Match</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-sm font-bold text-[#1d4ed8] hover:bg-blue-50 rounded-lg transition">View all recommendations</button>
            </div>

            {/* Get Notified First Widget */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-blue-100 p-6 shadow-xs relative overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <HiBell className="w-5 h-5 text-[#1d4ed8]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Get Notified First</h3>
              <p className="text-xs text-gray-600 mb-4 leading-relaxed">Turn on alerts for jobs matching your saved criteria and never miss an opportunity.</p>
              <button 
                onClick={() => setAlertEnabled(!alertEnabled)}
                className={`w-full py-2.5 text-sm font-bold rounded-lg transition shadow-sm flex items-center justify-center gap-2 ${
                  alertEnabled 
                    ? "bg-blue-50 text-[#1d4ed8] border border-blue-200 hover:bg-blue-100" 
                    : "bg-[#1d4ed8] hover:bg-blue-700 text-white"
                }`}
              >
                {alertEnabled ? (
                  <>Alerts Enabled <HiCheckCircle className="w-4 h-4" /></>
                ) : (
                  <>Create Alert <HiBell className="w-4 h-4" /></>
                )}
              </button>
            </div>

            {/* Quick Actions Widget */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/provider/alerts" className="block text-sm text-gray-600 hover:text-[#1d4ed8] hover:bg-gray-50 px-3 py-2 rounded-lg transition font-medium">
                  Manage Alerts
                </Link>
                <Link to="/provider/applied-jobs" className="block text-sm text-gray-600 hover:text-[#1d4ed8] hover:bg-gray-50 px-3 py-2 rounded-lg transition font-medium">
                  View Application History
                </Link>
                <Link to="/provider/profile" className="block text-sm text-gray-600 hover:text-[#1d4ed8] hover:bg-gray-50 px-3 py-2 rounded-lg transition font-medium">
                  Update Profile
                </Link>
              </div>
            </div>

          </div>
      </div>
    </div>
  );
};

export default SavedJobs;
