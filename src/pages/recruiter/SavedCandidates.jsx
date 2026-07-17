import useTranslation from "../../hooks/useTranslation";
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiFilter, FiBookmark, FiChevronDown, FiList, FiGrid,
  FiMapPin, FiMessageSquare, FiStar, FiChevronUp, FiX,
  FiMoreVertical, FiEye, FiArrowUpRight, FiLoader
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { recruiterAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { toOptimizedMediaUrl } from '../../utils/media';

const Candidates = () => {
  const {
    t
  } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [layout, setLayout] = useState('list');
  const [candidateScores, setCandidateScores] = useState({});

  const suggestedSearches = ['React Developer', 'Node.js', 'Sales Executive', 'Digital Marketing'];

  const handleSearch = useCallback(async (query = searchQuery) => {
    try {
      setLoading(true);
      const res = await recruiterAPI.aiSearchCandidates({ q: query });
      // The backend returns { success, candidates } or directly the array if mapped differently
      const data = res.data?.results || res.data?.candidates || res.data;
      if (Array.isArray(data)) {
        // We have real candidates that might not have a profile photo uploaded.
        // Filter out obvious test/mock accounts instead of requiring a photo.
        const realCandidates = data.filter(c => {
          const name = (c.name || '').toLowerCase();
          if (!name) return false;
          return !name.includes('mock') && !name.includes('test candidate') && !name.includes('demo');
        });
        setCandidates(realCandidates);
      } else {
        setCandidates([]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    // Initial fetch
    handleSearch('');
  }, [handleSearch]);

  // AI Profile Rating Queue
  useEffect(() => {
    if (!candidates.length) return;
    
    // Find the next candidate that doesn't have a score object yet
    const pendingCandidates = candidates.filter(c => {
      // For aiSearchCandidates, the _id might be the profile _id or candidate user._id
      // According to typical recruiter routes, it returns ProviderProfile objects where _id is the profile ID
      const id = c._id || c.providerProfileId;
      return id && !candidateScores[id];
    });
    
    if (pendingCandidates.length > 0) {
      const nextCandidate = pendingCandidates[0];
      const id = nextCandidate._id || nextCandidate.providerProfileId;
      
      // Mark as loading to prevent duplicate API calls
      setCandidateScores(prev => ({ ...prev, [id]: { loading: true } }));
      
      recruiterAPI.getProfileRating(id)
        .then(res => {
          if (res.data?.success) {
            setCandidateScores(prev => ({ 
              ...prev, 
              [id]: { loading: false, score: res.data.score, explanation: res.data.explanation } 
            }));
          } else {
            setCandidateScores(prev => ({ 
              ...prev, 
              [id]: { loading: false, score: null, error: true } 
            }));
          }
        })
        .catch(err => {
          console.error("AI Rating Error", err);
          setCandidateScores(prev => ({ 
            ...prev, 
            [id]: { loading: false, score: null, error: true } 
          }));
        });
    }
  }, [candidates, candidateScores]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const activeFilters = []; // Mocked for now to match UI
  const topSkills = ['TypeScript', 'Next.js', 'Redux Toolkit', 'Tailwind CSS', 'Node.js'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 relative">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{t("Global Talent Search")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("Find the right talent, faster with AI")}</p>
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* SIMPLE SEARCH AREA */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("Search by skills, roles, companies or keywords...")}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
            />
          </div>
          <button onClick={() => handleSearch()} className="flex items-center justify-center gap-2 bg-[#1E293B] text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-sm h-full shrink-0">
            {loading ? <FiLoader className="animate-spin" /> : 'Search'}
          </button>
        </div>
        
        {/* MAIN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* LEFT COLUMN: CANDIDATES LIST */}
          <div className="xl:col-span-3 space-y-4">
            
            {/* List Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-gray-900">
                  <span className="text-lg font-extrabold mr-1">{candidates.length}</span>{t("Candidates Found")}</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
                  <button 
                    onClick={() => setLayout('list')}
                    className={`p-1.5 rounded ${layout === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <FiList className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setLayout('grid')}
                    className={`p-1.5 rounded ${layout === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <FiGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Candidates Cards */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className={layout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
                {candidates.map(candidate => {
                  const id = candidate.id || candidate._id || candidate.providerProfileId;
                  const scoreData = candidateScores[id];
                  const user = candidate.user || {};
                  const name = candidate.name || user.name || "Candidate";
                  const avatar = candidate.profilePhoto || toOptimizedMediaUrl(user.profilePhoto || user.avatar, 'profile', 150) || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
                  const title = candidate.title || candidate.role || candidate.headline || candidate.skills?.[0] || 'Professional';
                  const city = candidate.location || candidate.city || 'Location not specified';
                  const skills = candidate.skills || [];
                  const displayedSkills = skills.slice(0, 5);
                  const extraSkills = skills.length > 5 ? skills.length - 5 : 0;
                  
                  return (
                    <div key={id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-indigo-200 hover:shadow-md transition group">
                      <div className={`flex ${layout === 'grid' ? 'flex-col' : 'flex-col lg:flex-row'} gap-6`}>
                        
                        {/* Main Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <img src={avatar} alt={name} className="w-16 h-16 rounded-xl object-cover" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h3 className="text-lg font-bold text-gray-900 truncate">{name}</h3>
                                {scoreData?.loading && (
                                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <FiLoader className="animate-spin" />{t("AI Rating...")}</span>
                                )}
                                {scoreData?.score !== undefined && scoreData?.score !== null && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${scoreData.score >= 80 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                                    {scoreData.score}{t("% Profile Rating")}</span>
                                )}
                                {candidate.tier === 'skilled' && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{t("Premium")}</span>}
                              </div>
                              <div className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                                {title}
                              </div>
                              <div className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                <FiMapPin className="w-3.5 h-3.5" /> {city}
                              </div>
                            </div>
                          </div>

                          {/* Stats Row */}
                          <div className={`flex items-center gap-8 mt-5 ${layout === 'list' ? 'ml-20' : ''}`}>
                            <div>
                              <div className="text-sm font-extrabold text-gray-900">{candidate.experience ? `${candidate.experience}` : 'N/A'}</div>
                              <div className="text-[11px] font-semibold text-gray-400">{t("Experience")}</div>
                            </div>
                            <div>
                              <div className="text-sm font-extrabold text-gray-900">{candidate.pricing ? `₹${candidate.pricing}` : 'N/A'}</div>
                              <div className="text-[11px] font-semibold text-gray-400">{t("Expected Fee")}</div>
                            </div>
                          </div>

                          {/* Skills Tags */}
                          <div className={`flex flex-wrap items-center gap-2 mt-5 ${layout === 'list' ? 'ml-20' : ''}`}>
                            {displayedSkills.map((skill, idx) => (
                              <span key={idx} className="text-[11px] font-bold text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md">
                                {skill}
                              </span>
                            ))}
                            {extraSkills > 0 && (
                              <span className="text-[11px] font-bold text-gray-400 px-1">
                                +{extraSkills}
                              </span>
                            )}
                          </div>
                          
                          {scoreData?.explanation && (
                             <div className={`mt-4 p-3 bg-indigo-50/50 rounded-lg border border-indigo-50 text-xs text-indigo-900 ${layout === 'list' ? 'ml-20' : ''}`}>
                               <HiSparkles className="inline text-indigo-500 mr-1" />
                               {scoreData.explanation}
                             </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className={`${layout === 'grid' ? 'w-full flex-row' : 'lg:w-48 flex-row lg:flex-col'} flex gap-2 justify-center lg:justify-start lg:border-l border-gray-100 lg:pl-6`}>
                          <Link to={`/recruiter/provider/${user._id || id}`} className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-50 transition">
                            <FiEye />{t("View Profile")}</Link>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {candidates.length === 0 && !loading && (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-gray-500 font-medium">{t("No candidates found for your search.")}</p>
              </div>
            )}
            
          </div>

          {/* RIGHT COLUMN: ANALYTICS & ALERTS */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Search Insights */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-gray-900">{t("Search Insights")}</h3>
                <button className="text-gray-400 hover:text-gray-600"><FiChevronUp className="w-4 h-4" /></button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-bold text-gray-900 mb-1">{t("Current Search")}</div>
                  <div className="text-[11px] text-gray-600">{searchQuery || "All Candidates"}</div>
                </div>

                <div>
                  <div className="text-xs font-bold text-gray-900 mb-3">{t("Top Skills in Demand")}</div>
                  <div className="flex flex-wrap gap-2">
                    {topSkills.map(skill => (
                      <span key={skill} className="text-[11px] font-semibold text-gray-700 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="w-full bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-100 transition flex items-center justify-center gap-2">{t("View Full Market Report")}<FiArrowUpRight />
                </button>
              </div>
            </div>

            {/* AI Search Tips */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">{t("AI Search Tips")}</h3>
                <button className="text-gray-400 hover:text-gray-600"><FiChevronUp className="w-4 h-4" /></button>
              </div>
              
              <p className="text-[11px] text-gray-600 leading-relaxed mb-3">{t(
                "Watch as Luco AI automatically evaluates candidate profiles as they load. High profile ratings indicate complete, in-demand skillsets."
              )}</p>
              
              <button className="w-full bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-100 transition flex items-center justify-center gap-2">
                <HiSparkles />{t("Ask AI to Improve Search →")}</button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Candidates;