import { useRef } from 'react';
import { Search, MapPin, ChevronLeft, ChevronRight, BadgeCheck, MoreVertical, Clock, Briefcase, Calendar, Zap, Wallet, CheckCircle2, MessageCircle, Phone, Eye, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useTranslation from '../../hooks/useTranslation';

export default function TopTalentCarousel({ displayTalent, talentSearch, setTalentSearch, handleTalentSearch, setSelectedCandidate }) {
  const { t } = useTranslation();
  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-white py-12 sm:py-16 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">
          {t("Top Talent Available for")} <span className="text-blue-600">{t("Hourly Work")}</span>
        </h2>
      
        {/* Filters Bar */}
        <form onSubmit={handleTalentSearch} className="bg-white p-2.5 sm:p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 mb-8 sm:mb-10">
          <div className="flex-1 min-w-[180px] flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input 
              type="text" 
              placeholder={t("Search talent by skills or name")} 
              className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none"
              value={talentSearch}
              onChange={(e) => setTalentSearch(e.target.value)}
            />
          </div>
          <div className="hidden lg:flex items-center gap-2">
            {[t('Skills'), t('Experience'), t('Hourly Rate'), t('Availability'), t('All Locations')].map((filter, i) => (
              <div key={i} className="flex items-center text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 whitespace-nowrap">
                {filter === t('All Locations') && <MapPin className="w-3 h-3 mr-1 text-gray-400" />}
                {filter}
                <svg className="w-3.5 h-3.5 ml-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            ))}
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg sm:ml-auto transition whitespace-nowrap">
            {t("Search Talent")}
          </button>
        </form>

        {/* Candidate Cards Carousel */}
        <div className="relative">
          {/* Left Arrow */}
          <button 
            type="button"
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
                      {t("Available")}
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
                      {candidate.primaryRole || t('Freelancer')}
                    </p>
                    
                    <div className="flex flex-col gap-1.5 text-[12px] text-gray-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{candidate.city || t('India')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {t("Last active:")} <span className="text-green-600 font-bold ml-0.5">{t("Today")}</span>
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
                      <div className="text-[12px] font-bold text-gray-900 truncate">{candidate.experienceYears || 0}+ {t("Yrs")}</div>
                      <div className="text-[10px] text-gray-500 font-medium truncate">{t("Experience")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-50/50 p-2 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-gray-900 truncate">25{t("h/wk")}</div>
                      <div className="text-[10px] text-gray-500 font-medium truncate">{t("Availability")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-green-50/50 p-2 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-gray-900 truncate">{t("Ready")}</div>
                      <div className="text-[10px] text-gray-500 font-medium truncate">{t("To Start")}</div>
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
                        +{candidate.skills.length - 4} {t("More")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rate & Verifications */}
                <div className="flex gap-4 mb-5 border-t border-gray-100 pt-5">
                  <div className="flex-1 bg-[#f0fdf4] rounded-xl p-3 flex flex-col justify-center border border-green-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-4 h-4 text-green-700" />
                      <span className="text-[11px] text-green-800 font-bold uppercase tracking-wider">{t("Hourly Rate")}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-gray-900">₹{candidate.hourlyRate || '1200'}</span>
                      <span className="text-[12px] font-bold text-gray-500">{t("/hr")}</span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 fill-green-500/10" />
                      <span className="text-[11px] text-gray-700 font-medium">{t("Resume Verified")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 fill-green-500/10" />
                      <span className="text-[11px] text-gray-700 font-medium">{t("Mobile Verified")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 fill-green-500/10" />
                      <span className="text-[11px] text-gray-700 font-medium">{t("Email Verified")}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-auto flex flex-col gap-2.5">
                  <div className="flex gap-2.5">
                    <a 
                      href={candidate._id ? `${import.meta.env.VITE_API_URL}/provider/public/${candidate._id}/whatsapp-redirect` : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-[1.5] py-2.5 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#128C7E] transition-colors text-[13px] flex items-center justify-center gap-2 shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" fill="currentColor" strokeWidth={0} /> {t("Chat on WhatsApp")}
                    </a>
                    <a 
                      href={candidate.user?.whatsappNumber ? `tel:${candidate.user.whatsappNumber}` : '#'}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors text-[13px] flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Phone className="w-4 h-4" /> {t("Call")}
                    </a>
                  </div>
                  <button 
                    onClick={() => setSelectedCandidate(candidate)}
                    className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-[13px] flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" strokeWidth={2.5} /> {t("View Full Profile")}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          {displayTalent.length > 0 && (
            <div className="mt-8 flex justify-center">
              <Link 
                to="/top-talent"
                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-2.5 px-6 rounded-full shadow-sm text-sm transition-all flex items-center gap-2 block"
              >
                View All Talent <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Right Arrow */}
          <button 
            type="button"
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
  );
}
