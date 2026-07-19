import useTranslation from "../../hooks/useTranslation";
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Lock, Sparkles, Briefcase, TrendingUp, AlertCircle, CheckCircle2, ArrowRight, FileSearch, Search, Check, Info, Bot, MapPin, Heart, ChevronRight, Bookmark
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { getCareerGPS, getHiringBarriers, getSkillGap, getAtsOptimizer, getAiUsage, improveCareerGPS, improveHiringBarriers, improveSkillGap } from '../../services/providerAIService';
import AiCareerReportModal from '../../components/provider/AiCareerReportModal';
import AICoachModal from '../../components/provider/AICoachModal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function GrowWithAIDashboard() {
  const {
    t
  } = useTranslation();

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('gps'); // 'gps' or 'barriers' or 'skillgap' or 'ats'

  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsData, setGpsData] = useState(null);
  const [gpsLocked, setGpsLocked] = useState(false);

  const [barriersLoading, setBarriersLoading] = useState(true);
  const [barriersData, setBarriersData] = useState(null);
  const [barriersLocked, setBarriersLocked] = useState(false);

  const [errorMessage, setErrorMessage] = useState(null);

  const [aiUsage, setAiUsage] = useState({ limits: {}, usage: {} });
  const [usageLoading, setUsageLoading] = useState(true);
  const [isAiReportModalOpen, setIsAiReportModalOpen] = useState(false);

  const { state } = location;
  const fileHash = state?.fileHash || localStorage.getItem('lastResumeHash');
  const parsedData = state?.parsedData;

  useEffect(() => {
    fetchUsage();
    fetchGPS();
    fetchBarriers();
  }, [fileHash, parsedData]);

  const fetchUsage = async () => {
    try {
      setUsageLoading(true);
      const { data } = await getAiUsage();
      if (data.success) {
        setAiUsage({ limits: data.limits || {}, usage: data.usage || {} });
      }
    } catch (error) {
      console.error('Failed to fetch AI usage', error);
    } finally {
      setUsageLoading(false);
    }
  };

  const fetchGPS = async () => {
    try {
      setGpsLoading(true);
      setErrorMessage(null);
      
      const { data } = await getCareerGPS({ fileHash, parsedData });
      if (data.success) {
        setGpsData(data.data);
        setGpsLocked(false);
        if (fileHash) localStorage.setItem('lastResumeHash', fileHash);
      }
    } catch (error) {
      console.error("Failed to fetch GPS data:", error);
      if (error.response?.data?.code === 'REQUIRED_DATA_MISSING') {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("An error occurred while loading your AI Career GPS.");
      }
    } finally {
      setGpsLoading(false);
    }
  };

  const fetchBarriers = async () => {
    try {
      setBarriersLoading(true);
      
      const { data } = await getHiringBarriers({ fileHash, parsedData });
      if (data.success) {
        setBarriersData(data.data);
        setBarriersLocked(false);
      }
    } catch (error) {
      console.error("Failed to fetch Hiring Barriers data:", error);
    } finally {
      setBarriersLoading(false);
    }
  };

  if (errorMessage) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center mt-10">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">{t("Grow with AI")}</h2>
          <p className="text-red-600 mb-6 max-w-md mx-auto">{errorMessage}</p>
          <Link
            to="/provider/profile"
            className="inline-flex items-center px-6 py-3 bg-[#0f766e] hover:bg-teal-800 text-white font-bold rounded-xl transition-colors gap-2"
          >{t("Go to Profile")}<ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 space-y-8 pb-20 relative">
      {/* Usage Banner */}
      {!usageLoading && (
        <div className="bg-indigo-50/50 border border-indigo-100 px-6 py-3 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">
              {activeTab === 'gps' && 'Career GPS Limit: '}
              {activeTab === 'barriers' && 'Why Not Hired Limit: '}
              {activeTab === 'skillgap' && 'Skill Gap Limit: '}
              {activeTab === 'ats' && 'ATS Score Limit: '}
              
              {(() => {
                const map = { gps: 'careerGps', barriers: 'whyNotHired', skillgap: 'skillGapReport', ats: 'atsScore' };
                const key = map[activeTab];
                const limit = aiUsage.limits[key] || 0;
                const used = aiUsage.usage[key] || 0;
                if (limit === -1) return <span className="font-bold text-indigo-700 ml-1">{t("Unlimited")}</span>;
                if (limit === 0) return <span className="font-bold text-red-600 ml-1">{t("Not included in plan")}</span>;
                return <span className="font-bold text-indigo-700 ml-1">{Math.max(0, limit - used)} / {limit}{t("requests remaining")}</span>;
              })()}
            </span>
          </div>
          <Link to="/provider/plans" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full transition-colors">{t("Upgrade Plan")}</Link>
        </div>
      )}
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Main Content */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">{t("Grow with AI")}<span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-teal-100">{t("Pro")}</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">{t("Data-driven insights to accelerate your career trajectory.")}</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={async () => {
                  if (activeTab === 'gps') {
                    try {
                      setGpsLoading(true);
                      const { data } = await improveCareerGPS({ fileHash, parsedData, improve: true });
                      if (data.success) {
                        setGpsData(data.data);
                        toast.success("Career GPS Insights updated!");
                        fetchUsage();
                      }
                    } catch (err) {
                      toast.error("Failed to improve insights");
                    } finally {
                      setGpsLoading(false);
                    }
                  } else if (activeTab === 'barriers') {
                    try {
                      setBarriersLoading(true);
                      const { data } = await improveHiringBarriers({ fileHash, parsedData, improve: true });
                      if (data.success) {
                        setBarriersData(data.data);
                        toast.success("Hiring Barriers updated!");
                        fetchUsage();
                      }
                    } catch (err) {
                      toast.error("Failed to improve insights");
                    } finally {
                      setBarriersLoading(false);
                    }
                  }
                }}
                disabled={(activeTab === 'gps' && gpsLoading) || (activeTab === 'barriers' && barriersLoading) || activeTab === 'skillgap' || activeTab === 'ats'}
                className={`bg-[#0f766e] hover:bg-teal-800 text-white px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 shadow-sm transition ${(activeTab === 'skillgap' || activeTab === 'ats') ? 'hidden' : ''} disabled:opacity-50`}
              >
                <Sparkles className="w-4 h-4" />{t("Refresh Insights")}</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-6 border-b border-gray-100 overflow-x-auto scrollbar-hide pb-0.5">
            {[
              { id: 'gps', icon: TrendingUp, label: 'AI Career GPS' },
              { id: 'barriers', icon: AlertCircle, label: 'Why Am I Not Getting Hired?' },
              { id: 'skillgap', icon: FileSearch, label: 'Skill Gap Report' },
              { id: 'ats', icon: Search, label: 'ATS Optimizer' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 text-[13px] font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id 
                    ? 'border-[#0f766e] text-[#0f766e]' 
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {/* Locked State Overlay Logic */}
          <div className="relative bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] min-h-[400px]">
            {!usageLoading && (() => {
              const map = { gps: 'careerGps', barriers: 'whyNotHired', skillgap: 'skillGapReport', ats: 'atsScore' };
              const key = map[activeTab];
              const limit = aiUsage.limits[key] || 0;
              const used = aiUsage.usage[key] || 0;
              
              if (limit !== -1 && (limit === 0 || used >= limit)) {
                return (
                  <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-2xl">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {limit === 0 ? 'Feature Not Available' : 'Usage Limit Reached'}
                    </h3>
                    <p className="text-gray-500 max-w-md mb-6 font-medium">
                      {limit === 0 
                        ? "Your current plan does not include access to this feature. Upgrade to unlock."
                        : `You have used all ${limit} requests for this feature in the current billing cycle.`}
                    </p>
                    <Link to="/provider/plans" className="px-6 py-3 bg-[#0f766e] text-white font-bold rounded-xl hover:bg-teal-800 transition shadow-sm">{t("Upgrade Plan")}</Link>
                  </div>
                );
              }
              return null;
            })()}

            <div className={!usageLoading && (() => {
              const map = { gps: 'careerGps', barriers: 'whyNotHired', skillgap: 'skillGapReport', ats: 'atsScore' };
              const key = map[activeTab];
              const limit = aiUsage.limits[key] || 0;
              const used = aiUsage.usage[key] || 0;
              return (limit !== -1 && (limit === 0 || used >= limit)) ? 'opacity-30 pointer-events-none' : '';
            })() ? 'opacity-30 pointer-events-none' : ''}>
              
              {activeTab === 'gps' && <CareerGPSPanel loading={gpsLoading} data={gpsData} isLocked={gpsLocked} />}
              {activeTab === 'barriers' && <HiringBarriersPanel loading={barriersLoading} data={barriersData} isLocked={barriersLocked} gpsData={gpsData} />}
              {activeTab === 'skillgap' && <SkillGapPanel fileHash={fileHash} parsedData={parsedData} />}
              {activeTab === 'ats' && <AtsOptimizerPanel fileHash={fileHash} parsedData={parsedData} />}
              
            </div>
          </div>
        </div>

        {/* Right Sidebar - Identical to AITips */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* AI Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#0f766e]" />
              <h3 className="font-bold text-gray-900 text-[14px]">{t("AI Summary")}</h3>
            </div>
            <p className="text-[11px] text-gray-500 mb-5 leading-relaxed font-medium">{t("Here's what AI thinks about your job search progress.")}</p>
            
            <ul className="space-y-3.5 mb-6">
              <li className="flex items-start gap-2 text-[11px] font-bold text-gray-700">
                <Check className="w-4 h-4 text-[#0f766e] shrink-0 mt-0.5" />{t("Your profile is well optimized")}</li>
              <li className="flex items-start gap-2 text-[11px] font-bold text-gray-700">
                <Check className="w-4 h-4 text-[#0f766e] shrink-0 mt-0.5" />{t("You have strong skills for your roles")}</li>
              <li className="flex items-start gap-2 text-[11px] font-bold text-gray-700">
                <Check className="w-4 h-4 text-[#0f766e] shrink-0 mt-0.5" />{t("Keep applying consistently")}</li>
              <li className="flex items-start gap-2 text-[11px] font-bold text-gray-700">
                <Check className="w-4 h-4 text-[#0f766e] shrink-0 mt-0.5" />{t("Improve these skills to get more interviews")}</li>
            </ul>
            <button 
              onClick={() => setIsAiReportModalOpen(true)}
              className="w-full py-2.5 border border-gray-200 rounded-xl text-[11px] font-bold text-gray-600 hover:bg-gray-50 transition flex justify-center items-center gap-1.5"
            >
              {t("View Full AI Analysis")}<ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI Coach */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-gray-900 text-[14px]">{t("AI Coach")}</h3>
              </div>
              <span className="bg-indigo-50 text-indigo-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">{t("Premium")}</span>
            </div>
            <p className="text-[11px] text-gray-500 mb-5 leading-relaxed font-medium">{t("Get personalized guidance to move ahead in your career.")}</p>
            
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl rounded-tr-sm mb-5 relative ml-6">
              <p className="text-[11px] text-gray-700 leading-relaxed font-medium">{t(
                "Hi! I analyzed your profile and applications. Would you like me to suggest some ways to improve your chances?"
              )}</p>
              <div className="absolute -left-8 top-0 w-8 h-8 bg-[#0f766e] shadow-sm rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <button onClick={() => window.dispatchEvent(new CustomEvent('open-ai-coach'))} className="w-full py-2.5 border border-gray-200 rounded-xl text-[11px] font-bold text-[#0f766e] hover:bg-gray-50 transition flex justify-center items-center gap-1.5 cursor-pointer">{t("Chat with AI Coach")}<ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* WhatsApp AI Alerts */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center"><FaWhatsapp className="w-3.5 h-3.5 text-white" /></div>
              <h3 className="font-bold text-gray-900 text-[14px]">{t("WhatsApp AI Alerts")}</h3>
            </div>
            <p className="text-[11px] text-gray-500 mb-4 font-medium">{t("Stay updated on the go!")}</p>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-[11px] font-bold text-gray-700"><Check className="w-3.5 h-3.5 text-[#0f766e]" />{t("New job matches")}</li>
              <li className="flex items-center gap-2 text-[11px] font-bold text-gray-700"><Check className="w-3.5 h-3.5 text-[#0f766e]" />{t("Application status updates")}</li>
              <li className="flex items-center gap-2 text-[11px] font-bold text-gray-700"><Check className="w-3.5 h-3.5 text-[#0f766e]" />{t("Interview reminders")}</li>
              <li className="flex items-center gap-2 text-[11px] font-bold text-gray-700"><Check className="w-3.5 h-3.5 text-[#0f766e]" />{t("Salary drops & more")}</li>
            </ul>
            
            <button className="w-full py-2.5 border border-gray-200 rounded-xl text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition flex justify-center items-center gap-2">{t("Enable WhatsApp Alerts")}<FaWhatsapp className="w-4 h-4 text-[#25D366]" />
            </button>
          </div>

          {/* Earn Extra Income */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-orange-50 border border-orange-100 rounded-lg flex items-center justify-center text-[10px]">💰</div>
              <h3 className="font-bold text-gray-900 text-[14px]">{t("Earn Extra Income")}</h3>
              <span className="bg-orange-50 text-orange-600 border border-orange-100 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{t("New")}</span>
            </div>
            
            <div className="flex items-center justify-between gap-2 mb-5 mt-4">
              <p className="text-[11px] text-gray-600 leading-relaxed max-w-[130px] font-medium">{t("Discover freelance projects matching your skills.")}</p>
              <div className="w-10 h-10 bg-[#0f766e]/10 rounded-xl flex items-center justify-center border border-[#0f766e]/20">
                <Briefcase className="w-5 h-5 text-[#0f766e]" />
              </div>
            </div>

            <button className="w-full py-2.5 border border-[#0f766e]/20 bg-[#0f766e]/5 rounded-xl text-[11px] font-bold text-[#0f766e] hover:bg-[#0f766e]/10 transition flex justify-center items-center gap-1.5 shadow-sm">{t("Explore Freelance Jobs")}<ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      <AiCareerReportModal 
        isOpen={isAiReportModalOpen} 
        onClose={() => setIsAiReportModalOpen(false)} 
        fileHash={fileHash} 
        parsedData={parsedData} 
      />
      <AICoachModal role="provider" />
    </div>
  );
}

// -------------------------------------------------------------------------
// SUB-PANELS
// -------------------------------------------------------------------------

function CareerGPSPanel({ loading, data, isLocked }) {
  const {
    t
  } = useTranslation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0f766e] mb-4"></div>
        <p className="text-[13px] font-bold text-gray-500">{t("Calculating your optimal career trajectory...")}</p>
      </div>
    );
  }
  if (!data) return <div className="p-10 text-center text-gray-500 text-[13px] font-medium">{t("No GPS data available. Refresh insights.")}</div>;

  return (
    <div className="relative p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 flex flex-col justify-center">
          <p className="text-[11px] font-bold text-gray-500 mb-1">{t("CURRENT ROLE")}</p>
          <h3 className="text-[18px] font-black text-gray-900">{data.current_role || 'Not Specified'}</h3>
        </div>
        <div className="bg-teal-50/50 p-5 rounded-2xl border border-teal-100 flex flex-col justify-center">
          <p className="text-[11px] font-bold text-teal-700 mb-1">{t("RECOMMENDED NEXT ROLE")}</p>
          <h3 className="text-[18px] font-black text-[#0f766e]">{data.recommended_next_role}</h3>
        </div>
      </div>
      <div className="mb-8">
        <h4 className="text-[14px] font-bold text-gray-900 mb-2">{t("Reasoning Summary")}</h4>
        <p className="text-[12px] text-gray-600 leading-relaxed font-medium">{data.reasoning_summary}</p>
      </div>
      <div className={isLocked ? "blur-md pointer-events-none opacity-50 select-none" : ""}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h4 className="text-[13px] font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" />{t("Required Skills")}</h4>
            <div className="flex flex-wrap gap-1.5">
              {(data.required_skills || ['React', 'System Design']).map((skill, i) => (
                <span key={i} className="px-2.5 py-1.5 bg-gray-50 border border-gray-100 text-gray-700 rounded-lg text-[11px] font-bold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-orange-500" />{t("Missing Skills to Acquire")}</h4>
            <div className="flex flex-wrap gap-1.5">
              {(data.missing_skills && data.missing_skills.length > 0 ? data.missing_skills : ['TypeScript', 'System Design']).map((skill, i) => (
                <span key={i} className="px-2.5 py-1.5 bg-orange-50 border border-orange-100 text-orange-700 rounded-lg text-[11px] font-bold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2">
            <h4 className="text-[14px] font-bold text-gray-900 mb-4">{t("Step-by-Step Learning Path")}</h4>
            <div className="space-y-3">
              {(data.learning_path || [{ step: 'Step 1', description: 'Sample' }]).map((path, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                  <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 border border-teal-100">
                    {i + 1}
                  </div>
                  <div>
                    <h5 className="font-bold text-[12px] text-gray-900">{path.step}</h5>
                    <p className="text-gray-500 text-[11px] mt-1 font-medium">{path.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-700 mb-1">{t("SALARY POTENTIAL")}</p>
              <h3 className="text-3xl font-black text-emerald-600">
                {data.salary_growth_potential_percent 
                  ? `+${String(data.salary_growth_potential_percent).replace('%', '')}%` 
                  : 'N/A'}
              </h3>
              <p className="text-emerald-700/80 text-[10px] mt-1 font-medium">{t("Estimated increase")}</p>
            </div>
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
              <p className="text-[10px] font-bold text-indigo-700 mb-1">{t("ESTIMATED TIMELINE")}</p>
              <h3 className="text-3xl font-black text-indigo-700">
                {data.estimated_timeline_months 
                  ? `${String(data.estimated_timeline_months).replace(/mo|months/i, '').trim()} mo` 
                  : 'N/A'}
              </h3>
              <p className="text-indigo-700/80 text-[10px] mt-1 font-medium">{t("To reach readiness")}</p>
            </div>
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <h4 className="text-[12px] font-bold text-gray-900 mb-3">{t("Alternative Roles")}</h4>
              <ul className="space-y-2">
                {(data.alternative_roles || ['Role A']).map((role, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600">
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" /> {role}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HiringBarriersPanel({ loading, data, isLocked, gpsData }) {
  const {
    t
  } = useTranslation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0f766e] mb-4"></div>
        <p className="text-[13px] font-bold text-gray-500">{t("Analyzing your hiring barriers...")}</p>
      </div>
    );
  }
  if (!data) return <div className="p-10 text-center text-gray-500 text-[13px] font-medium">{t("No barrier data available. Refresh insights.")}</div>;

  return (
    <div className="relative p-6">
      {/* Score Card */}
      <div className="flex flex-col md:flex-row gap-6 items-center bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-8">
        <div className="w-[84px] h-[84px] shrink-0 relative">
          <CircularProgressbar 
            value={data.hiring_barrier_score || 0} 
            strokeWidth={10} 
            styles={buildStyles({ 
              pathColor: data.hiring_barrier_score > 60 ? '#ef4444' : data.hiring_barrier_score > 30 ? '#f59e0b' : '#10b981', 
              trailColor: '#f1f5f9' 
            })}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-gray-900 leading-none">{data.hiring_barrier_score}</span>
          </div>
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-gray-900 mb-1">{t("Hiring Barrier Score")}</h3>
          <p className="text-[12px] text-gray-600 font-medium leading-relaxed">{t("A lower score is better. Your score indicates")}<span className="font-bold text-gray-800">{data.hiring_barrier_score > 60 ? 'significant' : data.hiring_barrier_score > 30 ? 'moderate' : 'few'}</span>{t("barriers to getting hired based on your current presentation and skills.")}</p>
        </div>
      </div>
      <div className="mb-8">
        <h4 className="text-[14px] font-bold text-gray-900 mb-3">{t("Top Reason You Aren't Getting Hired")}</h4>
        <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl text-red-800 text-[13px] font-bold flex items-start gap-3">
           <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
           {data.top_reasons?.[0] || "Needs more data."}
        </div>
      </div>
      <div className={isLocked ? "blur-md pointer-events-none opacity-50 select-none" : ""}>
        
        {data.top_reasons?.length > 1 && (
          <div className="mb-8">
            <h4 className="text-[13px] font-bold text-gray-900 mb-3">{t("Other Major Reasons")}</h4>
            <ul className="space-y-2.5">
              {data.top_reasons.slice(1).map((reason, i) => (
                <li key={i} className="flex items-start gap-2.5 text-gray-600 text-[12px] font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></div>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
            <h5 className="font-bold text-[13px] text-gray-900 mb-3 flex items-center gap-2">
              <Briefcase className="text-blue-500 w-4 h-4" />{t("Resume Issues")}</h5>
            <ul className="space-y-2.5 text-[11px] text-gray-600 font-medium">
              {(data.resume_issues || ['Issue 1']).map((issue, i) => (
                <li key={i} className="flex items-start gap-2"><Check className="w-3 h-3 text-blue-400 mt-0.5 shrink-0"/> {issue}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
            <h5 className="font-bold text-[13px] text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="text-amber-500 w-4 h-4" />{t("Skill Issues")}</h5>
            <ul className="space-y-2.5 text-[11px] text-gray-600 font-medium">
              {((gpsData?.missing_skills?.length > 0 ? gpsData.missing_skills : data.skill_issues) || ['No major issues']).map((issue, i) => (
                <li key={i} className="flex items-start gap-2"><Check className="w-3 h-3 text-amber-400 mt-0.5 shrink-0"/> {issue}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
            <h5 className="font-bold text-[13px] text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="text-emerald-500 w-4 h-4" />{t("Salary/Location")}</h5>
            <ul className="space-y-2.5 text-[11px] text-gray-600 font-medium">
              {(data.salary_or_location_issues || ['Issue 1']).map((issue, i) => (
                <li key={i} className="flex items-start gap-2"><Check className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0"/> {issue}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h4 className="text-[14px] font-bold text-gray-900 mb-4">{t("Immediate Action Plan")}</h4>
          <div className="space-y-3">
            {(data.immediate_action_plan || [{ action: 'Update resume', priority: 'High' }]).map((plan, i) => (
              <div key={i} className="flex items-center justify-between bg-white border border-gray-100 shadow-sm p-4 rounded-xl">
                <span className="font-bold text-gray-700 text-[12px]">{plan.action}</span>
                <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${
                  plan.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' :
                  plan.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                  'bg-green-50 text-green-600 border border-green-100'
                }`}>
                  {plan.priority}{t("Priority")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillGapPanel({ fileHash, parsedData }) {
  const {
    t
  } = useTranslation();

  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleAnalyze = async () => {
    if (!jd.trim()) return;
    try {
      setLoading(true);
      const res = await getSkillGap({ fileHash, parsedData, jobDescription: jd });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch Skill Gap data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Input area */}
      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
        <h3 className="text-[15px] font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FileSearch className="text-[#0f766e] w-5 h-5" />{t("Test AI Skill Gap Analysis")}</h3>
        <p className="text-gray-500 mb-5 text-[12px] font-medium">{t("Paste a Job Description here to see how your resume holds up against it.")}</p>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] text-[12px] outline-none transition shadow-inner font-medium text-gray-700"
          placeholder={t("Paste Job Description here...")}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !jd.trim()}
          className="mt-4 bg-[#0f766e] hover:bg-teal-800 text-white px-5 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
        >
          {loading ? (
            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>{t("Analyzing...")}</>
          ) : (
            <><Sparkles className="w-4 h-4" />{t("Generate Skill Gap Report")}</>
          )}
        </button>
      </div>
      {/* Results */}
      {data && (
        <div className="animate-fadeIn space-y-8">
          
          <div className="flex flex-col md:flex-row gap-6 items-center bg-teal-50/30 p-6 rounded-2xl border border-teal-100">
            <div className="w-[84px] h-[84px] shrink-0 relative">
              <CircularProgressbar 
                value={data.job_match_score || 0} 
                strokeWidth={10} 
                styles={buildStyles({ 
                  pathColor: data.job_match_score > 75 ? '#0f766e' : data.job_match_score > 50 ? '#f59e0b' : '#ef4444', 
                  trailColor: '#e2e8f0' 
                })}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-gray-900 leading-none">{data.job_match_score}%</span>
              </div>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900 mb-1">{t("Job Match Score")}</h3>
              <p className="text-gray-600 text-[12px] font-medium">{t("Based on your resume, you are a")}<span className="font-bold text-gray-800">{data.job_match_score}{t("% match")}</span>{t("for this job description.")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h4 className="text-[13px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="text-green-600 w-4 h-4" />{t("Matched Skills")}</h4>
              <div className="flex flex-wrap gap-1.5">
                {(data.matched_skills || []).map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-md text-[11px] font-bold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h4 className="text-[13px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="text-red-500 w-4 h-4" />{t("Missing Critical Skills")}</h4>
              <div className="flex flex-wrap gap-1.5">
                {(data.missing_critical_skills || []).map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-md text-[11px] font-bold">
                    {skill}
                  </span>
                ))}
                {(!data.missing_critical_skills || data.missing_critical_skills.length === 0) && (
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-md text-[11px] font-bold">{t("None!")}</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="text-indigo-600 w-5 h-5" />
              <h4 className="text-[14px] font-bold text-gray-900">{t("Fastest Hire Path")}</h4>
            </div>
            <p className="text-gray-700 leading-relaxed text-[12px] font-medium mb-4">
              {data.fastest_hire_path || "No clear path identified."}
            </p>
            <div className="pt-4 border-t border-indigo-100 flex items-center justify-between">
              <span className="text-gray-500 text-[11px] font-bold">{t("Estimated time to be hire-ready:")}</span>
              <span className="px-3 py-1 bg-white border border-indigo-100 text-indigo-700 rounded-lg font-black text-[11px]">
                {data.hire_ready_after || "Unknown"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AtsOptimizerPanel({ fileHash, parsedData }) {
  const {
    t
  } = useTranslation();

  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleOptimize = async () => {
    if (!jd.trim()) return;
    try {
      setLoading(true);
      const res = await getAtsOptimizer({ fileHash, parsedData, jobDescription: jd });
      if (res.success || res.data) {
        setData(res.data.data || res.data);
      }
    } catch (error) {
      console.error("Failed to fetch ATS Optimizer data:", error);
      toast.error('Failed to analyze ATS compatibility.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
        <h3 className="text-[15px] font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Search className="text-[#0f766e] w-5 h-5" />{t("ATS Resume Optimizer")}</h3>
        <p className="text-gray-500 mb-5 text-[12px] font-medium">{t(
          "Paste the target Job Description to see how an ATS evaluates your resume. We will suggest actionable improvements."
        )}</p>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] text-[12px] outline-none transition shadow-inner font-medium text-gray-700"
          placeholder={t("Paste Target Job Description here...")}
        />
        <button
          onClick={handleOptimize}
          disabled={loading || !jd.trim()}
          className="mt-4 bg-[#0f766e] hover:bg-teal-800 text-white px-5 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
        >
          {loading ? (
            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>{t("Optimizing...")}</>
          ) : (
            <><Sparkles className="w-4 h-4" />{t("Optimize for ATS")}</>
          )}
        </button>
      </div>
      {data && (
        <div className="animate-fadeIn space-y-8">
          
          {data.warnings?.length > 0 && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-[13px] font-bold text-red-800 mb-1">{t("AI Integrity Warnings")}</h3>
                <ul className="text-[11px] text-red-700 font-medium space-y-1">
                  {data.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                </ul>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-5 shadow-sm">
              <div className="w-[64px] h-[64px] shrink-0 relative">
                <CircularProgressbar 
                  value={data.ats_score_before || 0} strokeWidth={8} 
                  styles={buildStyles({ pathColor: '#64748b', trailColor: '#f1f5f9' })}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[18px] font-black text-gray-700">{data.ats_score_before}</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-[13px] text-gray-900 mb-1">{t("Original ATS Score")}</h4>
                <p className="text-[11px] font-medium text-gray-500">{t("Your current match percentage.")}</p>
              </div>
            </div>

            <div className="bg-teal-50/50 border border-teal-100 p-5 rounded-2xl flex items-center gap-5 shadow-sm">
              <div className="w-[64px] h-[64px] shrink-0 relative">
                <CircularProgressbar 
                  value={data.ats_score_after || 0} strokeWidth={8} 
                  styles={buildStyles({ pathColor: '#0f766e', trailColor: '#ccfbf1' })}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[18px] font-black text-[#0f766e]">{data.ats_score_after}</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-[13px] text-gray-900 mb-1">{t("Potential ATS Score")}</h4>
                <p className="text-[11px] font-medium text-teal-700">{t("Score after applying improvements.")}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <h4 className="font-bold text-[13px] text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="text-orange-500 w-4 h-4" />{t("Missing Keywords")}</h4>
              <div className="flex flex-wrap gap-1.5">
                {(data.missing_keywords || []).map((keyword, i) => (
                  <span key={i} className="px-2 py-1 bg-orange-50 border border-orange-100 text-orange-700 rounded-md text-[10px] font-bold">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <h4 className="font-bold text-[13px] text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="text-green-500 w-4 h-4" />{t("Recommended to Add")}</h4>
              <div className="flex flex-wrap gap-1.5">
                {(data.added_keywords || []).map((keyword, i) => (
                  <span key={i} className="px-2 py-1 bg-green-50 border border-green-100 text-green-700 rounded-md text-[10px] font-bold">
                    + {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
              <h4 className="text-[14px] font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="text-indigo-600 w-4 h-4" />{t("Optimized Resume Summary")}</h4>
              <p className="text-indigo-900 leading-relaxed text-[12px] font-medium">
                {data.improved_summary || "No summary improvements suggested."}
              </p>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
              <h4 className="text-[14px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="text-[#0f766e] w-4 h-4" />{t("Improved Experience Bullets")}</h4>
              <ul className="space-y-3">
                {(data.improved_experience_bullets || []).map((bullet, i) => (
                  <li key={i} className="flex gap-3 text-[12px] text-gray-700 bg-gray-50/50 p-3 rounded-xl border border-gray-100 font-medium leading-relaxed">
                    <CheckCircle2 className="text-[#0f766e] w-4 h-4 shrink-0 mt-0.5" />
                    <span dangerouslySetInnerHTML={{ __html: bullet.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
