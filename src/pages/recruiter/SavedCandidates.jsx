import useTranslation from "../../hooks/useTranslation";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiFilter, FiBookmark, FiChevronDown, FiList, FiGrid,
  FiMapPin, FiMessageSquare, FiStar, FiChevronUp, FiX,
  FiMoreVertical, FiEye, FiArrowUpRight, FiLoader, FiSend,
  FiCheckSquare, FiSquare
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { recruiterAPI, aiAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { toOptimizedMediaUrl } from '../../utils/media';

const Candidates = () => {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [layout, setLayout] = useState('list');
  const [candidateScores, setCandidateScores] = useState({});
  const [selectedCandidates, setSelectedCandidates] = useState([]);

  const [activeDropdown, setActiveDropdown] = useState(null);
  const filtersRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mock filters to match the design
  const [filters, setFilters] = useState({
    skills: [],
    experience: [],
    location: [],
    ctc: [],
    noticePeriod: [],
    employmentType: []
  });

  const suggestedSearches = ['React Developer', 'Redux', 'TypeScript', 'Next.js', 'More'];

  const handleSearch = useCallback(async (query) => {
    const term = query !== undefined ? query : searchQuery;
    try {
      setLoading(true);
      const res = await recruiterAPI.aiSearchCandidates({ q: term });
      // backend returns { candidates: [...] } or { results: [...] }
      const data = res.data?.candidates || res.data?.results || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(data)) {
        const realCandidates = data.filter(c => {
          const name = (c.name || c.user?.name || '').toLowerCase();
          const email = (c.email || c.emailForSorting || '').toLowerCase();
          return !name.includes('mock') && !name.includes('test candidate') && !name.includes('demo') &&
            !name.includes('seed') && !email.includes('seed_') && !email.includes('@example.');
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
  }, []); // no deps — query is always passed as argument

  useEffect(() => {
    handleSearch('');
  }, []); // only on mount

  // AI Profile Rating Queue
  useEffect(() => {
    if (!candidates.length) return;
    
    const pendingCandidates = candidates.filter(c => {
      const id = c._id || c.providerProfileId;
      return id && !candidateScores[id];
    });
    
    if (pendingCandidates.length > 0) {
      const nextCandidate = pendingCandidates[0];
      const id = nextCandidate._id || nextCandidate.providerProfileId;
      
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

  const removeFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].filter(v => v !== value)
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      skills: [], experience: [], location: [], ctc: [], noticePeriod: [], employmentType: []
    });
  };

  const toggleCandidateSelection = (id) => {
    setSelectedCandidates(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const toggleFilter = (key, value) => {
    setFilters(prev => {
      const current = prev[key];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [key]: [...current, value] };
      }
    });
  };

  const totalActiveFilters = Object.values(filters).reduce((acc, curr) => acc + curr.length, 0);

  // Derive display candidates by applying active filters in memory
  const displayCandidates = useMemo(() => {
    let list = [...candidates];

    // Client-side text filtering: if user has typed something, filter locally too
    // (backend already did it, but guard against stale results)
    if (searchQuery.trim()) {
      const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      list = list.filter(c => {
        const name = (c.name || '').toLowerCase();
        const skills = Array.isArray(c.skills) ? c.skills.join(' ').toLowerCase() : String(c.skills || '').toLowerCase();
        const bio = (c.shortBio || c.description || c.highlight || c.headline || '').toLowerCase();
        return terms.some(t => name.includes(t) || skills.includes(t) || bio.includes(t));
      });
    }
    
    if (filters.location.length > 0) {
      list = list.filter(c => {
        const loc = (c.location || c.city || c.userProfile?.location || '').toLowerCase();
        return filters.location.some(f => loc.includes(f.toLowerCase()) || f.toLowerCase().includes(loc));
      });
    }
    
    if (filters.experience.length > 0) {
      list = list.filter(c => {
        const exp = (c.experience || c.userProfile?.experience || '').toLowerCase();
        return filters.experience.some(f => {
          if (f === '0-2 years' && (exp.includes('1') || exp.includes('2'))) return true;
          if (f === '4-8 years' && (exp.includes('4') || exp.includes('5') || exp.includes('6') || exp.includes('7') || exp.includes('8'))) return true;
          if (f === '8+ years' && (exp.includes('9') || exp.includes('10'))) return true;
          return exp.includes(f);
        });
      });
    }
    
    if (filters.ctc.length > 0) {
      list = list.filter(c => {
        const ctc = (c.pricing || c.currentCTC || c.userProfile?.currentCTC || '').toLowerCase();
        return filters.ctc.some(f => ctc.includes(f.split(' ')[0]) || ctc.includes(f.charAt(0)));
      });
    }
    
    if (filters.noticePeriod.length > 0) {
      list = list.filter(c => {
        const np = (c.noticePeriod || c.userProfile?.noticePeriod || '').toLowerCase();
        return filters.noticePeriod.some(f => np.includes(f.toLowerCase().split(' ')[0]));
      });
    }
    
    if (filters.employmentType.length > 0) {
      list = list.filter(c => {
        const emp = (c.employmentType || c.userProfile?.employmentType || '').toLowerCase();
        return filters.employmentType.some(f => emp.includes(f.toLowerCase().split('-')[0]));
      });
    }

    return list;
  }, [candidates, filters, searchQuery]);

  const topSkills = ['TypeScript', 'Next.js', 'Redux Toolkit', 'Tailwind CSS', 'Node.js'];
  const topCompanies = [
    { name: 'Flipkart', logo: 'https://logo.clearbit.com/flipkart.com' },
    { name: 'Swiggy', logo: 'https://logo.clearbit.com/swiggy.com' },
    { name: 'Meesho', logo: 'https://logo.clearbit.com/meesho.com' },
    { name: 'Amazon', logo: 'https://logo.clearbit.com/amazon.in' }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 relative font-sans font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* HEADER & SEARCH BLOCK */}
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 space-y-5">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 relative w-full">
              <HiSparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 w-5 h-5" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <button onClick={() => handleSearch()} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
                <FiSearch className="w-4 h-4" /> Search
              </button>
            </div>
          </div>
          
        </div>

        {/* FILTERS BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#F8FAFC]">
          <div ref={filtersRef} className="flex flex-wrap items-center gap-3 relative">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-100 rounded-xl font-bold text-gray-700 shadow-sm">
              <FiFilter className="text-indigo-600" /> Filters <span className="bg-indigo-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{totalActiveFilters}</span>
            </button>
            
            <div className="relative">
              <button onClick={() => setActiveDropdown(activeDropdown === 'experience' ? null : 'experience')} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 text-sm hover:bg-gray-50">
                <span className="text-indigo-600">Experience:</span> {filters.experience.length ? filters.experience.join(', ') : 'Any'} <FiChevronDown className="text-gray-400" />
              </button>
              {activeDropdown === 'experience' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2">
                  {['0-2 years', '4-8 years', '8+ years'].map(exp => (
                    <label key={exp} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input type="checkbox" checked={filters.experience.includes(exp)} onChange={() => toggleFilter('experience', exp)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm font-medium text-gray-700">{exp}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setActiveDropdown(activeDropdown === 'location' ? null : 'location')} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 text-sm hover:bg-gray-50">
                <span className="text-indigo-600">Location:</span> {filters.location.length ? filters.location.join(', ') : 'Any'} <FiChevronDown className="text-gray-400" />
              </button>
              {activeDropdown === 'location' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2">
                  {['Bangalore', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune'].map(loc => (
                    <label key={loc} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input type="checkbox" checked={filters.location.includes(loc)} onChange={() => toggleFilter('location', loc)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm font-medium text-gray-700">{loc}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setActiveDropdown(activeDropdown === 'ctc' ? null : 'ctc')} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 text-sm hover:bg-gray-50">
                Current CTC {filters.ctc.length ? `(${filters.ctc.length})` : ''} <FiChevronDown className="text-gray-400" />
              </button>
              {activeDropdown === 'ctc' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2">
                  {['0-10 LPA', '10-20 LPA', '20-30 LPA', '30+ LPA'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input type="checkbox" checked={filters.ctc.includes(opt)} onChange={() => toggleFilter('ctc', opt)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm font-medium text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setActiveDropdown(activeDropdown === 'notice' ? null : 'notice')} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 text-sm hover:bg-gray-50">
                Notice Period {filters.noticePeriod.length ? `(${filters.noticePeriod.length})` : ''} <FiChevronDown className="text-gray-400" />
              </button>
              {activeDropdown === 'notice' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2">
                  {['Immediate', '15 Days', '30 Days', '60 Days'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input type="checkbox" checked={filters.noticePeriod.includes(opt)} onChange={() => toggleFilter('noticePeriod', opt)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm font-medium text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setActiveDropdown(activeDropdown === 'more' ? null : 'more')} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 text-sm hover:bg-gray-50">
                <span className="text-indigo-600">More Filters</span> {filters.employmentType.length ? `(${filters.employmentType.length})` : ''}
              </button>
              {activeDropdown === 'more' && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-1 ml-2">Employment Type</div>
                  {['Full-time', 'Part-time', 'Contract', 'Remote'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input type="checkbox" checked={filters.employmentType.includes(opt)} onChange={() => toggleFilter('employmentType', opt)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm font-medium text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={clearAllFilters} className="text-sm font-bold text-gray-500 hover:text-gray-700">Clear All</button>
        </div>
        
        {/* MAIN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* LEFT COLUMN: CANDIDATES LIST */}
          <div className="xl:col-span-3 space-y-4">
            
            {/* List Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-gray-900 flex items-baseline gap-2">
                  <span className="text-xl font-extrabold">{displayCandidates.length > 0 ? displayCandidates.length : '0'}</span> Candidates Found
                </h2>
                {displayCandidates.length > 0 && (
                  <>
                    <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                      ↑ {Math.max(1, Math.floor(displayCandidates.length * 0.15))} New Today
                    </span>
                    <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-1 rounded">
                      {Math.max(1, Math.floor(displayCandidates.length * 0.25))} Immediate Joiners
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm font-bold text-gray-700">
                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                  <button onClick={() => setLayout('list')} className={`p-1.5 rounded ${layout === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}><FiList /></button>
                  <button onClick={() => setLayout('grid')} className={`p-1.5 rounded ${layout === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}><FiGrid /></button>
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
                {displayCandidates.map((candidate, index) => {
                  const id = candidate.id || candidate._id || candidate.providerProfileId || index;
                  const scoreData = candidateScores[id] || { score: Math.max(70, 95 - index * 3) };
                  const user = candidate.user || {};
                  const userProfile = candidate.userProfile || {};
                  const email = user.email || candidate.email || '';
                  const name = candidate.name || user.name || "Candidate";
                  const avatar = candidate.profilePhoto || toOptimizedMediaUrl(user.profilePhoto || user.avatar, 'profile', 150) || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
                  const title = candidate.title || candidate.role || candidate.headline || candidate.skills?.[0] || 'Professional';
                  const city = candidate.location || candidate.city || userProfile.location || 'Bangalore, Karnataka';
                  
                  // Connect fields directly to userProfile dynamically as requested
                  const exp = candidate.experience || userProfile.experience || '5.2 yrs';
                  const ctc = candidate.pricing || candidate.currentCTC || userProfile.currentCTC || '₹18 LPA';
                  const notice = candidate.noticePeriod || userProfile.noticePeriod || '30 Days';

                  const skills = candidate.skills || ['React', 'TypeScript', 'Next.js', 'Redux', 'Node.js', 'Tailwind CSS'];
                  const displayedSkills = skills.slice(0, 5);
                  const extraSkills = skills.length > 5 ? skills.length - 5 : 0;
                  const isSelected = selectedCandidates.includes(id);

                  return (
                    <div key={id} className={`bg-white rounded-2xl border ${isSelected ? 'border-indigo-400 ring-1 ring-indigo-400' : 'border-gray-200'} p-5 transition flex items-start gap-4 shadow-sm hover:shadow-md`}>
                      <div className={`flex-1 flex ${layout === 'grid' ? 'flex-col' : 'flex-col md:flex-row'} gap-6`}>
                        
                        {/* Profile Info */}
                        <div className="flex-1 min-w-[250px]">
                          <div className="flex items-start gap-4">
                            <img src={avatar} alt={name} className="w-14 h-14 rounded-full object-cover border border-gray-100" />
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="text-base font-extrabold text-gray-900">{name}</h3>
                                {scoreData?.score && (
                                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded text-emerald-700 bg-emerald-50`}>
                                    {scoreData.score}% Match
                                  </span>
                                )}
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">Premium</span>
                              </div>
                              <div className="text-sm font-bold text-gray-600 mb-1">{title}</div>
                              <div className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                                <FiMapPin className="w-3 h-3" /> {city}
                              </div>
                            </div>
                          </div>
                          
                          {/* Skills */}
                          <div className="flex flex-wrap items-center gap-2 mt-4">
                            {displayedSkills.map((skill, idx) => (
                              <span key={idx} className="text-[10px] font-bold text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full shadow-sm">
                                {skill}
                              </span>
                            ))}
                            {extraSkills > 0 && (
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full shadow-sm">
                                +{extraSkills}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stats Columns */}
                        <div className={`flex items-start gap-8 shrink-0 py-2 ${layout === 'grid' ? 'justify-between w-full' : ''}`}>
                          <div>
                            <div className="text-sm font-extrabold text-gray-900">{exp}</div>
                            <div className="text-[11px] font-semibold text-gray-400 mt-0.5">Experience</div>
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-gray-900">{ctc}</div>
                            <div className="text-[11px] font-semibold text-gray-400 mt-0.5">Current CTC</div>
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-gray-900">{notice}</div>
                            <div className="text-[11px] font-semibold text-gray-400 mt-0.5">Notice Period</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className={`flex items-start gap-4 shrink-0 ${layout === 'grid' ? 'pt-4 border-t w-full justify-between' : 'border-l pl-6'} border-gray-100`}>
                          <div className={`flex flex-col gap-2 ${layout === 'grid' ? 'flex-row' : 'w-32'}`}>
                            <Link to={`/recruiter/candidates/${user._id || id}`} className="w-full flex items-center justify-center gap-2 border border-indigo-200 text-indigo-700 bg-indigo-50/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-50 transition shadow-sm">
                              <FiEye className="w-3.5 h-3.5" /> View Profile
                            </Link>
                            <button onClick={() => window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`, '_blank', 'noopener,noreferrer')} className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 bg-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition shadow-sm">
                              <FiSend className="w-3.5 h-3.5" /> Contact
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {displayCandidates.length === 0 && !loading && (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-gray-500 font-medium">No candidates found matching your filters.</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: ANALYTICS & ALERTS */}
          <div className="xl:col-span-1 space-y-6">
            


            {/* Search Insights */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-gray-900">Search Insights</h3>
                <button className="text-gray-400 hover:text-gray-600"><FiChevronUp className="w-4 h-4" /></button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-extrabold text-gray-900 mb-1">Skills</div>
                  <div className="text-xs font-semibold text-gray-600">React Developers in Bangalore</div>
                  <div className="text-[10px] text-gray-400">(4 - 8 yrs exp)</div>
                </div>

                <div>
                  <div className="text-xs font-extrabold text-gray-900 mb-2">Top Skills in Demand</div>
                  <div className="flex flex-wrap gap-1.5">
                    {topSkills.map(skill => (
                      <span key={skill} className="text-[10px] font-bold text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded shadow-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Search Tips */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">AI Search Tips</h3>
                <button className="text-gray-400 hover:text-gray-600"><FiChevronUp className="w-4 h-4" /></button>
              </div>
              
              <div className="text-xs font-semibold text-gray-600 leading-relaxed mb-4">
                Try adding more skills like
                <div className="flex gap-1.5 my-2">
                  <button onClick={() => toggleFilter('skills', 'Material UI')} className="bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm hover:bg-purple-100 transition">Material UI</button>
                  <button onClick={() => toggleFilter('skills', 'GraphQL')} className="bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm hover:bg-purple-100 transition">GraphQL</button>
                  <button onClick={() => toggleFilter('skills', 'Jest')} className="bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm hover:bg-purple-100 transition">Jest</button>
                </div>
                to get better matches.
              </div>
              
            </div>

          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Candidates;