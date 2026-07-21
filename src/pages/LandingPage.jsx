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
        onJobClick={(job) => navigate(`/job/${job._id || job.id}`)}
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
    </div>
  );
}