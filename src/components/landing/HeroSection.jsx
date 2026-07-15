import { Search, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function HeroSection({ user, jobSearch, setJobSearch, jobLocation, setJobLocation, handleJobSearch }) {
  const navigate = useNavigate();

  const getPopularSearchLink = (term) => {
    if (user?.activeRole === 'provider') {
      return `/provider/job-for-me`; 
    } else if (user?.activeRole === 'recruiter') {
      return `/recruiter/dashboard`;
    } else {
      return `/unlock-matches`;
    }
  };

  return (
    <>
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
            <Link 
              key={term} 
              to={getPopularSearchLink(term)}
              state={{ formData: { skills: term, location: '' } }}
              onClick={() => setJobSearch(term)}
              className="px-3.5 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition text-xs sm:text-sm block"
            >
              {term}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
