import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobsAPI, providerAPI } from '../services/api';

import HeroSection from '../components/landing/HeroSection';
import TopTalentCarousel from '../components/landing/TopTalentCarousel';
import FeaturesSection from '../components/landing/FeaturesSection';
import CandidateModal from '../components/landing/CandidateModal';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [jobSearch, setJobSearch] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [talentSearch, setTalentSearch] = useState('');
  
  const [liveJobsList, setLiveJobsList] = useState([]);
  const [topTalent, setTopTalent] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    const fetchLiveJobs = async () => {
      try {
        // Fetch up to 50 tech-related jobs to have a pool to randomize from
        const params = { limit: 50, skill: 'developer|engineer|software|tech|react|node|mern|data|web|app|frontend|backend|fullstack' };
        
        let fetchedJobs = [];
        if (user && user.activeRole === 'provider') {
          const { data } = await providerAPI.getJobs(params);
          fetchedJobs = (data?.data?.jobs) || data?.jobs || [];
        } else {
          const { data } = await jobsAPI.getAvailableJobs(params);
          fetchedJobs = (data?.data?.jobs) || data?.jobs || [];
        }

        // Randomly shuffle the jobs and take the first 10
        if (fetchedJobs.length > 0) {
          const shuffled = [...fetchedJobs].sort(() => 0.5 - Math.random());
          setLiveJobsList(shuffled.slice(0, 10));
        } else {
          setLiveJobsList([]);
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

    const intervalId = setInterval(() => {
      fetchLiveJobs();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(intervalId);
  }, [user, profile]);

  const handleJobSearch = (e) => {
    e.preventDefault();
    
    // Create query string for search params
    const queryParams = new URLSearchParams();
    if (jobSearch) queryParams.append('skills', jobSearch);
    if (jobLocation) queryParams.append('location', jobLocation);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    if (user?.activeRole === 'provider') {
      navigate(`/provider/job-for-me${queryString}`, { state: { formData: { skills: jobSearch, location: jobLocation } } });
    } else if (user?.activeRole === 'recruiter') {
      navigate('/recruiter/dashboard');
    } else {
      navigate(`/candidate-landing${queryString}`, { state: { formData: { skills: jobSearch, location: jobLocation } } });
    }
  };

  const handleTalentSearch = (e) => {
    e.preventDefault();
    navigate(`/search?query=${encodeURIComponent(talentSearch)}`);
  };

  return (
    <div className="w-full bg-white font-sans text-gray-900 overflow-hidden">
      <HeroSection 
        user={user}
        jobSearch={jobSearch}
        setJobSearch={setJobSearch}
        jobLocation={jobLocation}
        setJobLocation={setJobLocation}
        handleJobSearch={handleJobSearch}
        isLoadingJobs={isLoadingJobs}
        liveJobsList={liveJobsList}
        onJobClick={(job) => setSelectedJob(job)}
      />
      
      <TopTalentCarousel 
        displayTalent={topTalent}
        talentSearch={talentSearch}
        setTalentSearch={setTalentSearch}
        handleTalentSearch={handleTalentSearch}
        setSelectedCandidate={setSelectedCandidate}
      />
      
      <FeaturesSection />
      
      <CandidateModal 
        selectedCandidate={selectedCandidate}
        setSelectedCandidate={setSelectedCandidate}
      />

      {/* Guest Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative">
            <button 
              onClick={() => setSelectedJob(null)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl border border-blue-100">
                {(selectedJob.companyName || selectedJob.recruiter?.name || selectedJob.recruiter?.companyName || 'C').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{selectedJob.title}</h2>
                <p className="text-gray-500 font-medium">{selectedJob.companyName || selectedJob.recruiter?.name || selectedJob.recruiter?.companyName || 'Confidential'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Location</p>
                <p className="font-semibold text-gray-800 text-sm">{selectedJob.city || selectedJob.location?.city || 'Remote'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Salary / Budget</p>
                <p className="font-semibold text-gray-800 text-sm">{selectedJob.budget?.perMonth ? `₹${selectedJob.budget.perMonth.toLocaleString()}` : selectedJob.budget?.perHour ? `₹${selectedJob.budget.perHour.toLocaleString()}/hr` : (selectedJob.budgetMin || selectedJob.budgetMax) ? `₹${(selectedJob.budgetMin||0).toLocaleString()} – ${(selectedJob.budgetMax||0).toLocaleString()}` : 'Competitive'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Experience</p>
                <p className="font-semibold text-gray-800 text-sm">{selectedJob.experienceRequired || 'Not specified'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Type</p>
                <p className="font-semibold text-gray-800 text-sm">{selectedJob.workMode || 'Full-time'}</p>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm font-bold text-blue-900 mb-1">Ready to apply?</p>
                <p className="text-xs text-blue-700">Sign in as a candidate to view the full description and submit your application.</p>
              </div>
              <button onClick={() => navigate('/login')} className="w-full sm:w-auto whitespace-nowrap bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-md">
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}