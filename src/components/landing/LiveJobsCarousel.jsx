import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useTranslation from '../../hooks/useTranslation';

const CompanyLogo = ({ company, className = '' }) => {
  const initial = company ? company.charAt(0).toUpperCase() : 'C';
  
  // Generate a consistent color based on the company name
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-rose-100 text-rose-700',
    'bg-amber-100 text-amber-700',
    'bg-purple-100 text-purple-700',
    'bg-indigo-100 text-indigo-700',
    'bg-cyan-100 text-cyan-700',
    'bg-fuchsia-100 text-fuchsia-700'
  ];
  
  let hash = 0;
  if (company) {
    for (let i = 0; i < company.length; i++) {
      hash = company.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const colorClass = colors[colorIndex];

  return (
    <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center font-black text-lg shrink-0 shadow-sm border border-white/50 ${colorClass} ${className}`}>
      {initial}
    </div>
  );
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

        <div className="flex space-x-4 overflow-x-auto pb-4 pt-2 hide-scrollbar px-2 sm:px-10">
          {isLoadingJobs ? (
            [1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-[220px] sm:w-[260px] bg-white border border-gray-100 rounded-[20px] p-4 sm:p-5 flex-shrink-0 animate-pulse h-[160px]">
              </div>
            ))
          ) : liveJobsList.length > 0 ? (
            liveJobsList.map((job) => {
              return (
              <div 
                key={job._id || job.id} 
                onClick={() => onJobClick && onJobClick(job)}
                className="w-[220px] sm:w-[260px] h-full bg-white border border-gray-100/80 rounded-[20px] p-4 sm:p-5 flex-shrink-0 cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_40px_-5px_rgba(0,0,0,0.12)] hover:border-blue-200 transition-all duration-300 flex flex-col relative transform hover:-translate-y-1.5"
              >
                <div className="mb-2.5 flex justify-between items-start">
                  <CompanyLogo company={job.companyName || job.recruiter?.name || 'Company'} className="text-lg" />
                  <svg className="w-4 h-4 text-gray-300 hover:text-blue-500 shrink-0 ml-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                </div>
                
                <h5 className="font-black text-gray-900 text-sm sm:text-[15px] leading-tight mb-1 truncate">{job.title}</h5>
                <p className="text-[11px] sm:text-xs text-indigo-600 font-semibold mb-2.5 truncate">{job.companyName || job.recruiter?.name || 'Company'}</p>
                
                <div className="flex flex-col gap-1.5 mb-3">
                  <div className="flex items-center text-[10px] sm:text-[11px] text-gray-600 font-medium truncate">
                    <svg className="w-3 h-3 mr-1.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span className="truncate">{job.city || job.location?.city || 'Remote'}</span>
                  </div>
                  <div className="flex items-center text-[10px] sm:text-[11px] text-gray-600 font-medium truncate">
                    <svg className="w-3 h-3 mr-1.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span className="font-semibold text-gray-800">
                      {job.budget?.perMonth ? `₹${job.budget.perMonth}` : job.budget?.perHour ? `₹${job.budget.perHour}` : (job.budgetMin || job.budgetMax) ? `₹${(job.budgetMin||0).toLocaleString()} – ${(job.budgetMax||0).toLocaleString()}` : 'Competitive'}
                    </span>
                  </div>
                </div>
                
                {/* Bottom Tags */}
                <div className="mt-auto border-t border-gray-100 pt-2.5 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5 overflow-hidden max-h-5">
                    <span className="bg-[#f4f7fa] text-[#4b5563] text-[9px] font-bold px-2 py-0.5 rounded-full border border-gray-200/60 shadow-sm whitespace-nowrap">{job.workMode || 'Full-time'}</span>
                    <span className="bg-[#f4f7fa] text-[#4b5563] text-[9px] font-bold px-2 py-0.5 rounded-full border border-gray-200/60 shadow-sm whitespace-nowrap">{job.jobType || 'On-site'}</span>
                  </div>
                  <div className="text-[9px] text-gray-400 font-semibold shrink-0">{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : t('2m ago')}</div>
                </div>
              </div>
            )})
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
