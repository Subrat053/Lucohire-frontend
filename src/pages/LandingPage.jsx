import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobsAPI, providerAPI } from '../services/api';
import { 
  Search, MapPin, CheckCircle2, ArrowRight, ShieldCheck, 
  MessageCircle, Scale, Building2, Users, Briefcase, 
  Check, Zap, Target, Star, Phone, ChevronLeft, ChevronRight,
  FileText, Brain, Globe, Clock, BadgeCheck, MoreVertical, Wallet, Calendar, Eye, Heart, X
} from 'lucide-react';



// Company logo component for Live Jobs
const CompanyLogo = ({ company, className = '' }) => {
  const logos = {
    tcs: (
      <div className={`font-black text-2xl tracking-tighter text-red-600 ${className}`}>
        <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-lg">tcs</span>
      </div>
    ),
    infosys: (
      <div className={`font-bold text-lg text-blue-700 ${className}`}>
        Infosys
      </div>
    ),
    wipro: (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">W</span>
        </div>
        <span className="font-bold text-purple-700">wipro</span>
      </div>
    ),
    deloitte: (
      <div className={`font-bold text-xl text-green-800 ${className}`}>
        <span className="font-black">Deloitte</span><span className="text-green-500">.</span>
      </div>
    ),
    accenture: (
      <div className={`font-semibold text-lg text-purple-700 ${className}`}>
        accenture <span className="text-purple-400">&gt;</span>
      </div>
    ),
  };
  return logos[company] || <span className="font-bold">{company}</span>;
};


export default function LandingPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [jobSearch, setJobSearch] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [talentSearch, setTalentSearch] = useState('');
  const [activeTab, setActiveTab] = useState('candidates');
  const [liveJobsList, setLiveJobsList] = useState([]);
  const [topTalent, setTopTalent] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    const fetchLiveJobs = async () => {
      try {
        if (user && user.activeRole === 'provider') {
          const { data } = await providerAPI.getJobs({ limit: 10 });
          if (data && data.data && data.data.jobs) {
            setLiveJobsList(data.data.jobs);
          } else if (data && data.jobs) {
            setLiveJobsList(data.jobs);
          }
        } else {
          const params = { limit: 10 };
          const { data } = await jobsAPI.getAvailableJobs(params);
          if (data && data.data && data.data.jobs) {
            setLiveJobsList(data.data.jobs);
          } else if (data && data.jobs) {
            setLiveJobsList(data.jobs);
          }
        }
      } catch (err) {
        console.error('Error fetching live jobs:', err);
      } finally {
        setIsLoadingJobs(false);
      }
    };
    
    const fetchTopTalent = async () => {
      try {
        const { data } = await providerAPI.getTopTalent({ limit: 10 });
        if (data?.success && data?.data) {
          setTopTalent(data.data);
        }
      } catch (err) {
        console.error('Error fetching top talent:', err);
      }
    };

    fetchLiveJobs();
    fetchTopTalent();
  }, [user, profile]);

  const handleJobSearch = (e) => {
    e.preventDefault();
    if (user?.activeRole === 'provider') {
      navigate('/provider/job-for-me', { state: { formData: { skills: jobSearch, location: jobLocation } } });
    } else if (user?.activeRole === 'recruiter') {
      navigate('/recruiter/dashboard');
    } else {
      navigate(`/unlock-matches`, { state: { formData: { skills: jobSearch, location: jobLocation } } });
    }
  };

  const handleTalentSearch = (e) => {
    e.preventDefault();
    navigate(`/search?query=${encodeURIComponent(talentSearch)}`);
  };

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const displayTalent = topTalent;

  return (
    <div className="w-full bg-white font-sans text-gray-900 overflow-hidden">
      
      {/* 1. Top Banner */}
      <div className="w-full bg-blue-50 py-2 flex justify-center items-center border-b border-blue-100">
        <div className="flex items-center text-sm text-blue-700 font-medium">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          India&apos;s AI-Powered Hiring Platform
        </div>
      </div>

      {/* 2. Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 flex flex-col items-center">
        
        {/* Main Job Search Bar */}
        <form onSubmit={handleJobSearch} className="w-full max-w-4xl bg-white border border-gray-200 rounded-3xl sm:rounded-full shadow-sm p-3 sm:p-2 flex flex-col sm:flex-row items-center relative z-10 hover:shadow-md transition gap-3 sm:gap-0">
          <div className="flex-1 flex items-center px-4 py-1 sm:py-0 w-full sm:w-auto bg-gray-50 sm:bg-transparent rounded-xl sm:rounded-none border border-gray-100 sm:border-none">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search jobs by title, skills, or company" 
              className="w-full bg-transparent border-none focus:ring-0 text-gray-700 ml-2 py-2 outline-none text-sm sm:text-base"
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
            />
          </div>
          <div className="hidden sm:block w-px h-8 bg-gray-200 mx-2"></div>
          <div className="flex-1 flex items-center px-4 py-1 sm:py-0 w-full sm:w-auto bg-gray-50 sm:bg-transparent rounded-xl sm:rounded-none border border-gray-100 sm:border-none">
            <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
            <input 
              type="text" 
              placeholder="All Locations" 
              className="w-full bg-transparent border-none focus:ring-0 text-gray-700 ml-2 py-2 outline-none text-sm sm:text-base"
              value={jobLocation}
              onChange={(e) => setJobLocation(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl sm:rounded-full transition-colors shrink-0"
          >
            Search Jobs
          </button>
        </form>

        {/* Popular Searches */}
        <div className="mt-5 flex flex-wrap justify-center items-center gap-2 text-sm">
          <span className="text-gray-500 font-medium">Popular Searches:</span>
          {['React Developer', 'UI/UX Designer', 'Data Analyst', 'Marketing', 'Python Developer'].map((term) => (
            <button 
              key={term} 
              onClick={() => { 
                setJobSearch(term); 
                if (user?.activeRole === 'provider') {
                  navigate(`/provider/job-for-me`, { state: { formData: { skills: term, location: '' } } });
                } else if (user?.activeRole === 'recruiter') {
                  navigate('/recruiter/dashboard');
                } else {
                  navigate(`/unlock-matches`, { state: { formData: { skills: term, location: '' } } }); 
                }
              }}
              className="px-3.5 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition text-xs sm:text-sm"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Dual Pathway Cards */}
      {!user && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid md:grid-cols-2 gap-6">
          
          {/* Candidate Card */}
          <div className="bg-[#f8fbff] border border-blue-100 rounded-2xl p-6 sm:p-8 flex flex-col relative overflow-hidden group hover:shadow-lg transition duration-300">
            <div className="flex items-center mb-5">
              <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-50 mr-3 text-blue-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">I&apos;m a Candidate</h2>
                <p className="text-xs text-gray-500 mt-0.5">Discover verified opportunities that match your skills and goals.</p>
              </div>
            </div>
            <div className="space-y-3.5 mb-6 flex-1">
              {[
                { title: 'AI-Matched Opportunities', desc: 'Get job recommendations that perfectly match your skills, experience & goals.' },
                { title: 'One Profile, Global Opportunities', desc: 'Build one profile and access opportunities across India and 5+ countries.' },
                { title: 'AI Career Insights', desc: 'Get AI resume score, skill gap analysis and know why you\'re not getting hired.' }
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 flex-shrink-0">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{feature.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/candidate-landing')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm"
            >
              Find Matching Jobs <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Recruiter Card */}
          <div className="bg-[#f6fcf8] border border-green-100 rounded-2xl p-6 sm:p-8 flex flex-col relative overflow-hidden group hover:shadow-lg transition duration-300">
            <div className="flex items-center mb-5">
              <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-green-50 mr-3 text-green-500">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">I&apos;m a Recruiter</h2>
                <p className="text-xs text-gray-500 mt-0.5">Find and hire top talent faster and build high-performing teams.</p>
              </div>
            </div>
            <div className="space-y-3.5 mb-6 flex-1">
              {[
                { title: 'AI Shortlisted Candidates', desc: 'Get AI-matched and pre-screened candidates who fit your job requirements.' },
                { title: 'Verified & Skilled Talent Pool', desc: 'Access a reliable pool of verified and job-ready professionals.' },
                { title: 'Post Jobs & Hire Faster', desc: 'Post your job for free, reach the right talent, and hire with confidence.' }
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 flex-shrink-0">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{feature.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/recruiter-discovery')}
              className="w-full py-3 bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm"
            >
              Post Free Job <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
      )}

      {/* 4. Live Jobs Banner */}
      <div className="w-full bg-[#0a1930] py-6 sm:py-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <h3 className="font-bold text-base sm:text-lg">Live Jobs</h3>
              <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline-block">New jobs added every minute</span>
            </div>
            <button onClick={() => navigate('/provider/job-for-me')} className="text-xs sm:text-sm text-blue-300 hover:text-white flex items-center gap-1 transition">
              View All Jobs <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="flex space-x-4 overflow-x-auto pb-2 hide-scrollbar">
            {isLoadingJobs ? (
              [1, 2, 3, 4, 5].map(i => (
                <div key={i} className="min-w-[220px] sm:min-w-[240px] bg-white/10 rounded-xl p-4 sm:p-5 flex-shrink-0 animate-pulse h-[140px]">
                </div>
              ))
            ) : liveJobsList.length > 0 ? (
              liveJobsList.map(job => (
                <div key={job._id || job.id} onClick={() => navigate('/provider/job-for-me')} className="min-w-[220px] sm:min-w-[240px] bg-white rounded-xl p-4 sm:p-5 flex-shrink-0 cursor-pointer hover:-translate-y-1 transition duration-300">
                  <div className="mb-3 flex justify-between items-start">
                    <CompanyLogo company={job.companyName || job.recruiter?.name || 'Verified Company'} />
                    {job.isBoosted && (
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-purple-200">
                        Boosted
                      </span>
                    )}
                  </div>
                  <h5 className="font-bold text-gray-900 text-sm mb-0.5">{job.title}</h5>
                  <p className="text-xs text-gray-500 mb-3">{job.companyName || job.recruiter?.name || 'Verified Company'}</p>
                  <div className="flex items-center text-xs text-gray-600 font-medium mb-3">
                    <span>{job.city || job.location?.city || 'Remote'}</span>
                    <span className="mx-2">•</span>
                    <span className="text-blue-700 font-bold">
                      {job.budget?.perMonth ? `₹${job.budget.perMonth}/mo` : job.budget?.perHour ? `₹${job.budget.perHour}/hr` : (job.budgetMin || job.budgetMax) ? `₹${(job.budgetMin||0).toLocaleString()} – ₹${(job.budgetMax||0).toLocaleString()} ${job.budgetType === 'hourly' ? '/hr' : job.budgetType === 'yearly' ? '/yr' : '/mo'}` : 'Competitive'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium">{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Just now'}</div>
                </div>
              ))
            ) : (
              <div className="w-full text-center py-10 text-gray-400">
                <p>No live jobs found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Top Talent Available for Hourly Work */}
      <div className="bg-white py-12 sm:py-16 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">
              Top Talent Available for <span className="text-blue-600">Hourly Work</span>
            </h2>
          
            {/* Filters Bar */}
            <form onSubmit={handleTalentSearch} className="bg-white p-2.5 sm:p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 mb-8 sm:mb-10">
              <div className="flex-1 min-w-[180px] flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search talent by skills or name" 
                  className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none"
                  value={talentSearch}
                  onChange={(e) => setTalentSearch(e.target.value)}
                />
              </div>
              <div className="hidden lg:flex items-center gap-2">
                {['Skills', 'Experience', 'Hourly Rate', 'Availability', 'All Locations'].map((filter, i) => (
                  <div key={i} className="flex items-center text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 whitespace-nowrap">
                    {filter === 'All Locations' && <MapPin className="w-3 h-3 mr-1 text-gray-400" />}
                    {filter}
                    <svg className="w-3.5 h-3.5 ml-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                ))}
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg sm:ml-auto transition whitespace-nowrap">
                Search Talent
              </button>
            </form>

            {/* Candidate Cards Carousel */}
            <div className="relative">
              {/* Left Arrow */}
<button 
                onClick={() => scrollCarousel('left')}
                className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>

              <div ref={carouselRef} className="flex space-x-4 overflow-x-auto pb-4 hide-scrollbar scroll-smooth px-1">
                {displayTalent.map(candidate => (
                  <div key={candidate._id} className="min-w-[380px] max-w-[380px] sm:min-w-[420px] sm:max-w-[420px] bg-white rounded-3xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex-shrink-0 flex flex-col relative overflow-hidden">
                    
                    {/* Top Section */}
                    <div className="flex gap-4 mb-5">
                      {/* Left: Avatar with Available Now pill */}
                      <div className="relative shrink-0">
                        {candidate.profilePhoto ? (
                          <img src={candidate.profilePhoto} alt={candidate.profileName} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-1 ring-gray-100" />
                        ) : (
                          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-3xl font-bold ring-1 ring-gray-100 ${candidate.avatarBg || 'bg-blue-100 text-blue-700'}`}>
                            {candidate.profileName?.substring(0, 2).toUpperCase() || 'UN'}
                          </div>
                        )}
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap shadow-md">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                          Available
                        </div>
                      </div>
                      
                      {/* Right: Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight truncate">{candidate.profileName}</h3>
                            <BadgeCheck className="w-5 h-5 text-blue-600 fill-blue-600/10" strokeWidth={2.5} />
                          </div>
                          <MoreVertical className="w-4 h-4 text-gray-400 cursor-pointer" />
                        </div>
                        
                        <p className="text-[13px] font-bold text-indigo-700 mb-2 truncate">
                          {candidate.primaryRole || 'Freelancer'}
                        </p>
                        
                        <div className="flex flex-col gap-1.5 text-[12px] text-gray-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate">{candidate.city || 'India'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            Last active: <span className="text-green-600 font-bold ml-0.5">Today</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3 Stats Row */}
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      <div className="flex items-center gap-2 bg-indigo-50/50 p-2 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-bold text-gray-900 truncate">{candidate.experienceYears || 0}+ Yrs</div>
                          <div className="text-[10px] text-gray-500 font-medium truncate">Experience</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-blue-50/50 p-2 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-bold text-gray-900 truncate">25h/wk</div>
                          <div className="text-[10px] text-gray-500 font-medium truncate">Availability</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-green-50/50 p-2 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-bold text-gray-900 truncate">Ready</div>
                          <div className="text-[10px] text-gray-500 font-medium truncate">To Start</div>
                        </div>
                      </div>
                    </div>

                    {/* Top Skills */}
                    <div className="mb-5">
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.skills?.slice(0, 4).map((tag, idx) => (
                          <span key={idx} className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                            {tag}
                          </span>
                        ))}
                        {(candidate.skills?.length || 0) > 4 && (
                          <span className="bg-gray-50 text-gray-500 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                            +{candidate.skills.length - 4} More
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rate & Verifications */}
                    <div className="flex gap-4 mb-5 border-t border-gray-100 pt-5">
                      <div className="flex-1 bg-[#f0fdf4] rounded-xl p-3 flex flex-col justify-center border border-green-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Wallet className="w-4 h-4 text-green-700" />
                          <span className="text-[11px] text-green-800 font-bold uppercase tracking-wider">Hourly Rate</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-gray-900">₹{candidate.hourlyRate || '1200'}</span>
                          <span className="text-[12px] font-bold text-gray-500">/hr</span>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-center space-y-1.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 fill-green-500/10" />
                          <span className="text-[11px] text-gray-700 font-medium">Resume Verified</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 fill-green-500/10" />
                          <span className="text-[11px] text-gray-700 font-medium">Mobile Verified</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 fill-green-500/10" />
                          <span className="text-[11px] text-gray-700 font-medium">Email Verified</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto flex flex-col gap-2.5">
                      <div className="flex gap-2.5">
                        <button 
                          onClick={() => {
                            if (candidate.user?.whatsappNumber) {
                              window.open(`https://wa.me/${candidate.user.whatsappNumber}`, '_blank');
                            }
                          }}
                          className="flex-[1.5] py-2.5 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#128C7E] transition-colors text-[13px] flex items-center justify-center gap-2 shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4" fill="currentColor" strokeWidth={0} /> Chat on WhatsApp
                        </button>
                        <button 
                          onClick={() => {
                            if (candidate.user?.whatsappNumber) {
                              window.open(`tel:${candidate.user.whatsappNumber}`);
                            }
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors text-[13px] flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Phone className="w-4 h-4" /> Call Now
                        </button>
                      </div>
                      <button 
                        onClick={() => setSelectedCandidate(candidate)}
                        className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-[13px] flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" /> View Full Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Button */}
              {displayTalent.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <button 
                    onClick={() => navigate('/top-talent')}
                    className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-2.5 px-6 rounded-full shadow-sm text-sm transition-all flex items-center gap-2"
                  >
                    View All Talent <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Right Arrow */}
              <button 
                onClick={() => scrollCarousel('right')}
                className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Carousel dots */}
            <div className="flex justify-center mt-4 gap-1.5">
              {displayTalent.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              ))}
            </div>
          </div>
        </div>

      {/* 6. Why Choose Lucohire? */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10 sm:mb-12">Why Choose <span className="text-blue-600">Lucohire</span>?</h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-3">
              <Brain className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1.5 text-sm">AI-Powered Matching</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Our AI matches the right talent to the right opportunity in seconds.</p>
          </div>
          <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1.5 text-sm">Verified & Trusted</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Every profile and job is verified for authenticity and trust.</p>
          </div>
          <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-3">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1.5 text-sm">WhatsApp-First</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Communicate instantly with candidates or recruiters via WhatsApp.</p>
          </div>
          <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-3">
              <Scale className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1.5 text-sm">Fair Distribution</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Equal visibility for everyone — no favoritism, just fairness.</p>
          </div>
        </div>

        {/* Stats Banner */}
        <div className="bg-[#f8fbff] border border-blue-100 rounded-2xl p-5 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="flex items-center justify-center sm:justify-start">
            <Briefcase className="w-7 h-7 text-blue-600 mr-3 hidden sm:block" />
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">10K+</div>
              <div className="text-xs text-gray-500 font-medium">Jobs Live</div>
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-start">
            <CheckCircle2 className="w-7 h-7 text-blue-600 mr-3 hidden sm:block" />
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">50K+</div>
              <div className="text-xs text-gray-500 font-medium">Verified Providers</div>
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-start">
            <Building2 className="w-7 h-7 text-blue-600 mr-3 hidden sm:block" />
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">2K+</div>
              <div className="text-xs text-gray-500 font-medium">Companies</div>
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-start">
            <Target className="w-7 h-7 text-blue-600 mr-3 hidden sm:block" />
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">98%</div>
              <div className="text-xs text-gray-500 font-medium">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. How Lucohire Works */}
      <div className="w-full bg-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-10">How <span className="text-blue-600">Lucohire</span> Works</h2>
          
          {/* Tabs */}
          <div className="flex justify-center mb-8 sm:mb-10">
            <div className="inline-flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setActiveTab('candidates')}
                className={`px-5 sm:px-8 py-2 rounded-full text-sm font-semibold transition ${activeTab === 'candidates' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              >
                For Candidates
              </button>
              <button
                onClick={() => setActiveTab('recruiters')}
                className={`px-5 sm:px-8 py-2 rounded-full text-sm font-semibold transition ${activeTab === 'recruiters' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              >
                For Recruiters
              </button>
            </div>
          </div>

          {/* Steps */}
          {activeTab === 'candidates' ? (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 lg:gap-10">
              {[
                { icon: <Users className="w-7 h-7" />, title: 'Create Profile', desc: 'Build your profile in minutes.', color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: <Search className="w-7 h-7" />, title: 'AI Match', desc: 'Get AI-matched jobs that fit you best.', color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: <Briefcase className="w-7 h-7" />, title: 'Get Hired', desc: 'Apply, connect and get hired faster.', color: 'text-blue-600', bg: 'bg-blue-50' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-4 sm:gap-6">
                  <div className="flex flex-col items-center text-center max-w-[130px]">
                    <div className={`w-14 h-14 ${step.bg} rounded-full flex items-center justify-center ${step.color} mb-3`}>
                      {step.icon}
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 mb-1">{step.title}</h4>
                    <p className="text-xs text-gray-500">{step.desc}</p>
                  </div>
                  {idx < 2 && (
                    <>
                      <ArrowRight className="w-5 h-5 text-gray-300 hidden sm:block shrink-0" />
                      <div className="block sm:hidden text-gray-300 rotate-90">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 lg:gap-10">
              {[
                { icon: <Building2 className="w-7 h-7" />, title: 'Post Job', desc: 'Post your job for free in minutes.', color: 'text-green-600', bg: 'bg-green-50' },
                { icon: <Zap className="w-7 h-7" />, title: 'AI Shortlist', desc: 'AI finds and shortlists the best matches.', color: 'text-green-600', bg: 'bg-green-50' },
                { icon: <CheckCircle2 className="w-7 h-7" />, title: 'Hire Faster', desc: 'Connect, interview and hire the right talent.', color: 'text-green-600', bg: 'bg-green-50' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-4 sm:gap-6">
                  <div className="flex flex-col items-center text-center max-w-[130px]">
                    <div className={`w-14 h-14 ${step.bg} rounded-full flex items-center justify-center ${step.color} mb-3`}>
                      {step.icon}
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 mb-1">{step.title}</h4>
                    <p className="text-xs text-gray-500">{step.desc}</p>
                  </div>
                  {idx < 2 && (
                    <>
                      <ArrowRight className="w-5 h-5 text-gray-300 hidden sm:block shrink-0" />
                      <div className="block sm:hidden text-gray-300 rotate-90">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 8. Trusted By */}
      <div className="w-full border-y border-gray-100 py-8 sm:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="flex justify-between items-center space-x-6 sm:space-x-8 opacity-60 grayscale hover:grayscale-0 transition duration-500 flex-nowrap overflow-x-auto hide-scrollbar">
            <h3 className="text-lg sm:text-xl font-bold tracking-tighter shrink-0"><span className="text-blue-500">G</span>oogle</h3>
            <h3 className="text-lg sm:text-xl font-bold tracking-tighter shrink-0 text-gray-600">Microsoft</h3>
            <h3 className="text-lg sm:text-xl font-bold tracking-tighter shrink-0 text-blue-700">Infosys</h3>
            <h3 className="text-lg sm:text-xl font-bold tracking-tighter shrink-0 text-red-500">tcs</h3>
            <h3 className="text-lg sm:text-xl font-bold tracking-tighter shrink-0 text-green-800">Deloitte.</h3>
            <h3 className="text-lg sm:text-xl font-bold tracking-tighter shrink-0">accenture</h3>
            <h3 className="text-lg sm:text-xl font-bold tracking-tighter shrink-0 text-red-600">wipro</h3>
            <h3 className="text-lg sm:text-xl font-bold tracking-tighter shrink-0 text-yellow-600">amazon</h3>
            <h3 className="text-lg sm:text-xl font-bold tracking-tighter shrink-0 text-blue-900">IBM</h3>
            <h3 className="text-lg sm:text-xl font-bold tracking-tighter shrink-0 text-blue-400">Capgemini</h3>
          </div>
        </div>
      </div>

      {/* 9. Why Candidates / Recruiters Love Lucohire */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20">
          
          {/* Candidates Love */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-blue-600 mb-6 sm:mb-8 text-center sm:text-left">Why Candidates Love Lucohire</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:gap-y-6">
              {[
                { icon: <Search className="w-4 h-4" />, title: 'AI Resume Analysis', desc: 'Get AI feedback to improve your resume.' },
                { icon: <Target className="w-4 h-4" />, title: "Why I'm Not Getting Hired", desc: "AI tells you what's holding you back." },
                { icon: <Zap className="w-4 h-4" />, title: 'Skill Gap Analysis', desc: 'Discover skill gaps and upskill smartly.' },
                { icon: <MapPin className="w-4 h-4" />, title: 'Global Opportunities', desc: 'Explore jobs across India & 5+ countries.' },
                { icon: <ShieldCheck className="w-4 h-4" />, title: 'Verified Jobs Only', desc: 'Apply only to verified and genuine jobs.' },
                { icon: <MessageCircle className="w-4 h-4" />, title: 'WhatsApp Updates', desc: 'Get interview calls & status on WhatsApp.' },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex justify-center items-center text-blue-600 mr-2.5 shrink-0">
                      {item.icon}
                    </div>
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{item.title}</h4>
                  </div>
                  <p className="text-[11px] text-gray-500 pl-[38px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recruiters Love */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-green-600 mb-6 sm:mb-8 text-center sm:text-left">Why Recruiters Love Lucohire</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:gap-y-6">
              {[
                { icon: <Users className="w-4 h-4" />, title: 'Verified Talent Pool', desc: 'Hire from trusted and verified professionals.' },
                { icon: <CheckCircle2 className="w-4 h-4" />, title: 'Duplicate Detection', desc: 'AI removes duplicate profiles automatically.' },
                { icon: <Scale className="w-4 h-4" />, title: 'AI Candidate Ranking', desc: 'AI ranks candidates by best match.' },
                { icon: <Zap className="w-4 h-4" />, title: 'AI Shortlisting', desc: 'Save time with AI shortlisting the best candidates.' },
                { icon: <Briefcase className="w-4 h-4" />, title: 'Free Job Posting', desc: 'Post jobs for free and start hiring instantly.' },
                { icon: <Building2 className="w-4 h-4" />, title: 'ATS Dashboard', desc: 'Manage jobs, applicants and pipelines easily.' },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-green-50 flex justify-center items-center text-green-600 mr-2.5 shrink-0">
                      {item.icon}
                    </div>
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{item.title}</h4>
                  </div>
                  <p className="text-[11px] text-gray-500 pl-[38px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 10. Bottom Stats */}
      <div className="w-full border-t border-gray-100 py-8 sm:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center gap-6">
            <div className="flex items-center">
              <Briefcase className="w-5 h-5 text-blue-600 mr-2.5" />
              <div>
                <div className="font-bold text-gray-900">25K+</div>
                <div className="text-[11px] text-gray-500">Jobs Posted Today</div>
              </div>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 text-green-500 mr-2.5" />
              <div>
                <div className="font-bold text-gray-900">1.5L+</div>
                <div className="text-[11px] text-gray-500">Candidates Hired</div>
              </div>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mr-2.5" />
              <div>
                <div className="font-bold text-gray-900">12K+</div>
                <div className="text-[11px] text-gray-500">Active Recruiters</div>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-blue-600 mr-2.5" />
              <div>
                <div className="font-bold text-gray-900">5+</div>
                <div className="text-[11px] text-gray-500">Countries</div>
              </div>
            </div>
            <div className="flex items-center">
              <Building2 className="w-5 h-5 text-blue-600 mr-2.5" />
              <div>
                <div className="font-bold text-gray-900">1000+</div>
                <div className="text-[11px] text-gray-500">Top Companies</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 11. Final CTA Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="bg-[#0a1930] rounded-2xl p-6 sm:p-10 md:p-12 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Ready to Hire Smarter?</h2>
            <p className="text-blue-200 text-sm sm:text-base">Join Lucohire and experience the power of AI in hiring.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button 
              onClick={() => navigate('/candidate-landing')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 sm:px-8 rounded-xl flex justify-center items-center gap-2 transition whitespace-nowrap text-sm"
            >
              Find Matching Jobs <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 sm:px-8 rounded-xl flex justify-center items-center gap-2 transition whitespace-nowrap text-sm"
            >
              Post Free Job <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Candidate Details Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setSelectedCandidate(null)}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col hide-scrollbar animate-fade-in-up">
            
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 p-5 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-900">Candidate Profile</h2>
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 flex flex-col gap-8">
              
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                {selectedCandidate.profilePhoto ? (
                  <img src={selectedCandidate.profilePhoto} alt={selectedCandidate.profileName} className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover ring-4 ring-gray-50" />
                ) : (
                  <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center text-4xl font-bold ring-4 ring-gray-50 ${selectedCandidate.avatarBg || 'bg-blue-100 text-blue-700'}`}>
                    {selectedCandidate.profileName?.substring(0, 2).toUpperCase() || 'UN'}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{selectedCandidate.profileName}</h3>
                    <BadgeCheck className="w-7 h-7 text-blue-600 fill-blue-600/10" strokeWidth={2.5} />
                  </div>
                  <p className="text-lg font-bold text-indigo-700 mb-3">{selectedCandidate.primaryRole || 'Freelancer'}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 font-medium">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {selectedCandidate.city || 'India'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-gray-400" />
                      Remote Worldwide
                    </div>
                    <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-0.5 rounded-md">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      Available Now
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-indigo-50/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <Briefcase className="w-6 h-6 text-indigo-600 mb-2" />
                  <div className="text-lg font-bold text-gray-900">{selectedCandidate.experienceYears || 0}+ Years</div>
                  <div className="text-xs text-gray-500 font-medium">Experience</div>
                </div>
                <div className="bg-green-50/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <Wallet className="w-6 h-6 text-green-600 mb-2" />
                  <div className="text-lg font-bold text-gray-900">₹{selectedCandidate.hourlyRate || '1200'}/hr</div>
                  <div className="text-xs text-gray-500 font-medium">Hourly Rate</div>
                </div>
                <div className="bg-blue-50/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <Calendar className="w-6 h-6 text-blue-500 mb-2" />
                  <div className="text-lg font-bold text-gray-900">25h/week</div>
                  <div className="text-xs text-gray-500 font-medium">Availability</div>
                </div>
                <div className="bg-yellow-50/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <Star className="w-6 h-6 text-yellow-600 fill-yellow-600/20 mb-2" />
                  <div className="text-lg font-bold text-gray-900">{selectedCandidate.rating || '5.0'}</div>
                  <div className="text-xs text-gray-500 font-medium">Rating ({selectedCandidate.reviewCount || 0})</div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-base font-bold text-gray-900 mb-3">Top Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills?.map((tag, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold">
                      {tag}
                    </span>
                  ))}
                  {(!selectedCandidate.skills || selectedCandidate.skills.length === 0) && (
                    <span className="text-sm text-gray-500 italic">No skills listed</span>
                  )}
                </div>
              </div>

              {/* Bio/About */}
              <div>
                <h4 className="text-base font-bold text-gray-900 mb-3">About</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedCandidate.bio || `${selectedCandidate.profileName} is a highly skilled ${selectedCandidate.primaryRole || 'professional'} based in ${selectedCandidate.city || 'India'} with over ${selectedCandidate.experienceYears || 0} years of experience. They are ready to take on new projects and deliver high-quality results.`}
                </p>
              </div>

              {/* Verifications */}
              <div>
                <h4 className="text-base font-bold text-gray-900 mb-3">Trust & Verification</h4>
                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap gap-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500/10" />
                    <span className="text-sm text-gray-700 font-bold">Resume Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500/10" />
                    <span className="text-sm text-gray-700 font-bold">Mobile Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500/10" />
                    <span className="text-sm text-gray-700 font-bold">Email Verified</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 sm:px-8 flex flex-col sm:flex-row gap-3 mt-auto">
              <button 
                onClick={() => {
                  if (selectedCandidate.user?.whatsappNumber) {
                    window.open(`https://wa.me/${selectedCandidate.user.whatsappNumber}`, '_blank');
                  }
                }}
                className="flex-1 py-3.5 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#128C7E] transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-5 h-5" fill="currentColor" strokeWidth={0} /> Chat on WhatsApp
              </button>
              <button 
                onClick={() => {
                  if (selectedCandidate.user?.whatsappNumber) {
                    window.open(`tel:${selectedCandidate.user.whatsappNumber}`);
                  }
                }}
                className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <Phone className="w-5 h-5" /> Call Now
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}