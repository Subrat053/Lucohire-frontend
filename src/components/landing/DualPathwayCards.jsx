import { 
  User, Briefcase, ChevronRight, Target, FileText, PieChart, TrendingUp, Globe,
  Users, ShieldCheck, Send, MessageCircle, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useTranslation from '../../hooks/useTranslation';

export default function DualPathwayCards({ user }) {
  const { t } = useTranslation();
  if (user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-0 w-full -mt-[25px]">
      <div className="grid md:grid-cols-2 gap-4 lg:gap-5 w-full">
      
        {/* Candidate Card */}
        <Link to="/candidate-landing" className="bg-white border border-gray-100 rounded-[16px] px-4 py-3 lg:px-5 lg:py-4 h-[200px] flex flex-col relative group hover:shadow-lg hover:border-blue-100 transition duration-300 shadow-sm cursor-pointer block">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-blue-50 text-blue-600 shrink-0 shadow-sm">
                <User className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-blue-600 mb-2 leading-normal tracking-tight">{t("I'm a Candidate")}</h2>
                <p className="text-sm lg:text-base font-semibold text-gray-700 leading-[1.6]">{t("Find jobs that match your skills and goals.")}</p>
              </div>
            </div>
            <div className="w-6 h-6 flex items-center justify-center text-gray-800 shrink-0">
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </div>
          </div>
          
          <div className="mt-auto flex items-center justify-between">
            <div className="flex flex-col items-center gap-1.5 text-blue-600">
              <Target className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[9px] font-bold text-gray-700 whitespace-nowrap">{t("AI Match")}</span>
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex flex-col items-center gap-1.5 text-gray-600">
              <FileText className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[9px] font-bold text-gray-700 whitespace-nowrap">{t("Resume Score")}</span>
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex flex-col items-center gap-1.5 text-gray-600">
              <PieChart className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[9px] font-bold text-gray-700 whitespace-nowrap">{t("Skill Insights")}</span>
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex flex-col items-center gap-1.5 text-gray-600">
              <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[9px] font-bold text-gray-700 whitespace-nowrap">{t("Career Tips")}</span>
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex flex-col items-center gap-1.5 text-gray-600">
              <Globe className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[9px] font-bold text-gray-700 whitespace-nowrap">{t("Global Jobs")}</span>
            </div>
          </div>
        </Link>

        {/* Recruiter Card */}
        <Link to="/recruiter-discovery" className="bg-[#fafffb] border border-green-100/50 rounded-[16px] px-4 py-3 lg:px-5 lg:py-4 h-[200px] flex flex-col relative group hover:shadow-lg hover:border-green-200 transition duration-300 shadow-sm cursor-pointer block">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-green-50 text-green-600 shrink-0 shadow-sm">
                <Briefcase className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-green-600 mb-2 leading-normal tracking-tight">{t("I'm a Recruiter")}</h2>
                <p className="text-sm lg:text-base font-semibold text-gray-700 leading-[1.6]">{t("Hire verified talent faster and build teams.")}</p>
              </div>
            </div>
            <div className="w-6 h-6 flex items-center justify-center text-gray-800 shrink-0">
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </div>
          </div>
          
          <div className="mt-auto flex items-center justify-between">
            <div className="flex flex-col items-center gap-1.5 text-green-500">
              <Users className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[9px] font-bold text-gray-700 whitespace-nowrap">{t("Verified Talent")}</span>
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex flex-col items-center gap-1.5 text-green-500">
              <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[9px] font-bold text-gray-700 whitespace-nowrap">{t("Post Jobs Free")}</span>
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex flex-col items-center gap-1.5 text-green-500">
              <Send className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[9px] font-bold text-gray-700 whitespace-nowrap">{t("Smart Shortlist")}</span>
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex flex-col items-center gap-1.5 text-green-500">
              <MessageCircle className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[9px] font-bold text-gray-700 whitespace-nowrap">{t("WhatsApp Connect")}</span>
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex flex-col items-center gap-1.5 text-green-500">
              <Award className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[9px] font-bold text-gray-700 whitespace-nowrap">{t("AI Ranking")}</span>
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
