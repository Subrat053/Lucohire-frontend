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
      navigate(`/candidate-landing`, { state: { formData: { skills: jobSearch, location: jobLocation } } });
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