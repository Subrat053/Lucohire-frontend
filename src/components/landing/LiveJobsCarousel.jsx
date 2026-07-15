import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export default function LiveJobsCarousel({ isLoadingJobs, liveJobsList }) {
  return (
    <div className="w-full bg-[#0a1930] py-6 sm:py-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <h3 className="font-bold text-base sm:text-lg">Live Jobs</h3>
            <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline-block">New jobs added every minute</span>
          </div>
          <Link 
            to="/provider/job-for-me"
            className="text-xs sm:text-sm text-blue-300 hover:text-white flex items-center gap-1 transition"
          >
            View All Jobs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        
        <div className="flex space-x-4 overflow-x-auto pb-2 hide-scrollbar">
          {isLoadingJobs ? (
            [1, 2, 3, 4, 5].map(i => (
              <div key={i} className="min-w-[220px] sm:min-w-[240px] bg-white/10 rounded-xl p-4 sm:p-5 flex-shrink-0 animate-pulse h-[140px]">
              </div>
            ))
          ) : liveJobsList.length > 0 ? (
            liveJobsList.map(job => (
              <Link 
                key={job._id || job.id} 
                to="/provider/job-for-me" 
                className="min-w-[220px] sm:min-w-[240px] bg-white rounded-xl p-4 sm:p-5 flex-shrink-0 cursor-pointer hover:-translate-y-1 transition duration-300 block"
              >
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
              </Link>
            ))
          ) : (
            <div className="w-full text-center py-10 text-gray-400">
              <p>No live jobs found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
