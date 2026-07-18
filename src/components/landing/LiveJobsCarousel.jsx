import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useTranslation from '../../hooks/useTranslation';

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

export default function LiveJobsCarousel({ isLoadingJobs, liveJobsList, onJobClick }) {
  const { t } = useTranslation();
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-1">
      <div className="max-w-7xl mx-auto bg-[#f4f7ff] border border-blue-100 rounded-[24px] p-3 sm:p-4 relative shadow-sm">
        <div className="flex justify-between items-center mb-3 px-2 sm:px-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-200"></div>
            <h3 className="font-extrabold text-[#0B1536] text-lg">{t("Live Jobs")}</h3>
            <span className="text-xs font-semibold text-gray-400 ml-2 hidden sm:inline-block tracking-wide">{t("New jobs added every minute")}</span>
          </div>
          <Link 
            to="/provider/job-for-me"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
          >
            {t("View All Jobs")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {/* Buttons on the sides */}
        <div className="absolute left-2 sm:left-3 top-[55%] -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center cursor-pointer text-gray-700 z-10 hidden md:flex hover:bg-gray-50 transition-all">
          <svg className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
        <div className="absolute right-2 sm:right-3 top-[55%] -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center cursor-pointer text-gray-700 z-10 hidden md:flex hover:bg-gray-50 transition-all">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>

        <div className="flex space-x-3 overflow-x-auto pb-2 hide-scrollbar px-2 sm:px-10">
          {isLoadingJobs ? (
            [1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-[180px] sm:w-[200px] bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 flex-shrink-0 animate-pulse h-[140px]">
              </div>
            ))
          ) : liveJobsList.length > 0 ? (
            liveJobsList.map(job => (
              <div 
                key={job._id || job.id} 
                onClick={() => onJobClick && onJobClick(job)}
                className="w-[180px] sm:w-[200px] bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 flex-shrink-0 cursor-pointer hover:shadow-md transition duration-300 block relative"
              >
                <div className="mb-2 flex justify-between items-start">
                  <CompanyLogo company={job.companyName || job.recruiter?.name || 'Company'} className="text-lg" />
                  <svg className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 absolute top-3 right-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                </div>
                <h5 className="font-extrabold text-gray-900 text-[11px] sm:text-xs mb-1 truncate pr-5">{job.title}</h5>
                <p className="text-[9px] sm:text-[10px] text-gray-700 font-bold mb-1.5 truncate">{job.companyName || job.recruiter?.name || 'Company'}</p>
                <div className="flex items-center text-[9px] sm:text-[10px] text-gray-500 font-medium mb-1 truncate">
                  <span>{job.city || job.location?.city || 'Remote'}</span>
                  <span className="mx-1">•</span>
                  <span>
                    {job.budget?.perMonth ? `₹${job.budget.perMonth}` : job.budget?.perHour ? `₹${job.budget.perHour}` : (job.budgetMin || job.budgetMax) ? `₹${(job.budgetMin||0).toLocaleString()} – ${(job.budgetMax||0).toLocaleString()}` : 'Competitive'}
                  </span>
                </div>
                <div className="text-[9px] text-gray-400 font-medium mb-3">{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : t('2m ago')}</div>
                
                {/* Bottom Tags */}
                <div className="flex gap-1.5">
                   <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-2 py-0.5 rounded-md">{job.workMode || 'Full-time'}</span>
                   <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-2 py-0.5 rounded-md">{job.jobType || 'On-site'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full text-center py-6 text-gray-400">
              <p>{t("No live jobs found.")}</p>
            </div>
          )}
        </div>
        
        {/* Pagination Dots */}
        <div className="flex justify-center items-center gap-1.5 mt-2">
          <div className="w-4 h-1.5 bg-blue-600 rounded-full"></div>
          <div className="w-2 h-1.5 bg-blue-100 rounded-full"></div>
          <div className="w-2 h-1.5 bg-blue-100 rounded-full"></div>
          <div className="w-2 h-1.5 bg-blue-100 rounded-full"></div>
          <div className="w-2 h-1.5 bg-blue-100 rounded-full"></div>
        </div>

      </div>
    </div>
  );
}
