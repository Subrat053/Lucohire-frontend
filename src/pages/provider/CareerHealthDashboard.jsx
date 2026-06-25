import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  HiLockClosed, HiTrendingUp, HiLightBulb, HiChartBar, HiCheckCircle, HiExclamationCircle, HiBriefcase 
} from 'react-icons/hi';
import { getCareerHealth } from '../../services/providerAIService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function CareerHealthDashboard({ tab = 'overview' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [activeTab, setActiveTab] = useState('employability');
  const [errorMessage, setErrorMessage] = useState(null);

  // When coming from Profile.jsx after resume upload, we might pass fileHash or parsedData in state
  const { state } = location;
  const fileHash = state?.fileHash || localStorage.getItem('lastResumeHash');
  const parsedData = state?.parsedData;

  useEffect(() => {
    fetchReport();
  }, [fileHash, parsedData]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const { data } = await getCareerHealth({ fileHash, parsedData });
      if (data.success) {
        console.log("=== Career Health Data from Gemini ===", data.data);
        setReport(data.data);
        // setIsLocked(data.data.isLocked);
        setIsLocked(false);
        if (fileHash) {
          localStorage.setItem('lastResumeHash', fileHash);
        }
      }
    } catch (error) {
      console.error("Failed to fetch career health report:", error);
      if (error.response?.data?.code === 'REQUIRED_DATA_MISSING') {
        setErrorMessage(error.response.data.message);
      } else {
        toast.error("Failed to generate career health report.");
        setErrorMessage("An error occurred while loading your AI Career Health Report.");
      }
    } finally {
      setLoading(false);
    }
  };

  const mockDeepData = useMemo(() => ({
    employability_score: 85,
    salary_growth_score: 78,
    market_demand_score: 92,
    future_readiness_score: 70,
    ai_resistance_score: 65,
    summary: "Your profile indicates a strong foundation in frontend engineering, but with strategic upskilling, you could easily transition into a Senior Full Stack role.",
    top_strengths: [
      "Excellent mastery of modern frontend frameworks like React and Vue.",
      "Proven track record of improving application performance and load times.",
      "Strong understanding of CI/CD pipelines and deployment strategies."
    ],
    top_weaknesses: [
      "Limited exposure to backend database optimization (SQL tuning).",
      "Missing verifiable portfolio links for recent projects.",
    ],
    next_best_actions: [
      "Add 2-3 links to live projects or GitHub repositories.",
      "Consider getting an AWS or Azure basic certification.",
      "Expand your listed skills to include DevOps practices."
    ],
    employability_breakdown: {
      core_skills_match: 88,
      experience_relevance: 82,
      resume_formatting: 85
    },
    salary_growth_breakdown: {
      industry_benchmark: 75,
      promotion_velocity: 80,
      skill_scarcity: 79
    },
    market_demand_breakdown: {
      job_openings_trend: 95,
      remote_opportunities: 90,
      industry_growth_rate: 91
    },
    future_readiness_breakdown: {
      trend_alignment: 72,
      continuous_learning: 68,
      adaptability_indicators: 70
    },
    ai_resistance_breakdown: {
      automation_risk_inverted: 60,
      creative_thinking: 70,
      strategic_complexity: 65
    }
  }), []);

  const mockOverviewData = useMemo(() => ({
    career_health_score: 0,
    summary: "Upload your resume to generate a personalized AI career health summary, highlighting your strengths, weaknesses, and potential growth."
  }), []);

  const isEmptyState = (!report && !loading) || !!errorMessage;
  const displayData = isLocked || isEmptyState ? { ...report, ...mockDeepData } : report;
  const overviewData = isEmptyState ? mockOverviewData : report;

  const categoryDetails = {
    employability: {
      title: 'Employability',
      score: displayData?.employability_score || 0,
      icon: HiBriefcase,
      description: 'How likely you are to secure a job in the current market.',
      breakdowns: [
        { name: 'Core Skills Match', score: displayData?.employability_breakdown?.core_skills_match || 0 },
        { name: 'Experience Relevance', score: displayData?.employability_breakdown?.experience_relevance || 0 },
        { name: 'Resume Formatting (ATS)', score: displayData?.employability_breakdown?.resume_formatting || 0 }
      ]
    },
    salaryGrowth: {
      title: 'Salary Growth',
      score: displayData?.salary_growth_score || 0,
      icon: HiTrendingUp,
      description: 'Your potential for compensation increases over the next 3-5 years.',
      breakdowns: [
        { name: 'Industry Benchmark', score: displayData?.salary_growth_breakdown?.industry_benchmark || 0 },
        { name: 'Promotion Velocity', score: displayData?.salary_growth_breakdown?.promotion_velocity || 0 },
        { name: 'Skill Scarcity', score: displayData?.salary_growth_breakdown?.skill_scarcity || 0 }
      ]
    },
    marketDemand: {
      title: 'Market Demand',
      score: displayData?.market_demand_score || 0,
      icon: HiChartBar,
      description: 'The overall volume of job opportunities matching your profile.',
      breakdowns: [
        { name: 'Job Openings Trend', score: displayData?.market_demand_breakdown?.job_openings_trend || 0 },
        { name: 'Remote Opportunities', score: displayData?.market_demand_breakdown?.remote_opportunities || 0 },
        { name: 'Industry Growth Rate', score: displayData?.market_demand_breakdown?.industry_growth_rate || 0 }
      ]
    },
    futureReadiness: {
      title: 'Future Readiness',
      score: displayData?.future_readiness_score || 0,
      icon: HiLightBulb,
      description: 'How prepared you are for upcoming shifts and disruptions in your field.',
      breakdowns: [
        { name: 'Trend Alignment', score: displayData?.future_readiness_breakdown?.trend_alignment || 0 },
        { name: 'Continuous Learning', score: displayData?.future_readiness_breakdown?.continuous_learning || 0 },
        { name: 'Adaptability Indicators', score: displayData?.future_readiness_breakdown?.adaptability_indicators || 0 }
      ]
    },
    aiResistance: {
      title: 'AI Resistance',
      score: displayData?.ai_resistance_score || 0,
      icon: HiLockClosed,
      description: 'The likelihood that your core responsibilities cannot be automated by AI.',
      breakdowns: [
        { name: 'Automation Risk (Inverted)', score: displayData?.ai_resistance_breakdown?.automation_risk_inverted || 0 },
        { name: 'Creative Thinking', score: displayData?.ai_resistance_breakdown?.creative_thinking || 0 },
        { name: 'Strategic Complexity', score: displayData?.ai_resistance_breakdown?.strategic_complexity || 0 }
      ]
    }
  };

  const tabs = [
    { id: 'employability', label: 'Employability', icon: HiBriefcase },
    { id: 'salaryGrowth', label: 'Salary Growth', icon: HiTrendingUp },
    { id: 'marketDemand', label: 'Market Demand', icon: HiChartBar },
    { id: 'futureReadiness', label: 'Future Readiness', icon: HiLightBulb },
    { id: 'aiResistance', label: 'AI Resistance', icon: HiLockClosed },
  ];

  const currentPanel = categoryDetails[activeTab];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-gray-500">Analyzing your career profile...</p>
      </div>
    );
  }

  const renderScoreMeter = (score, size = 'lg') => {
    let color = 'text-green-500';
    let strokeColor = 'stroke-green-500';
    if (score < 50) { color = 'text-red-500'; strokeColor = 'stroke-red-500'; }
    else if (score < 75) { color = 'text-amber-500'; strokeColor = 'stroke-amber-500'; }

    const radius = size === 'lg' ? 45 : 20;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg className="transform -rotate-90" width={size === 'lg' ? "120" : "60"} height={size === 'lg' ? "120" : "60"}>
          <circle cx={size === 'lg' ? "60" : "30"} cy={size === 'lg' ? "60" : "30"} r={radius} stroke="currentColor" strokeWidth={size === 'lg' ? "8" : "4"} fill="transparent" className="text-gray-100" />
          <circle cx={size === 'lg' ? "60" : "30"} cy={size === 'lg' ? "60" : "30"} r={radius} stroke="currentColor" strokeWidth={size === 'lg' ? "8" : "4"} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} className={`${strokeColor} transition-all duration-1000 ease-out`} />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`font-black ${size === 'lg' ? 'text-3xl' : 'text-sm'} ${color}`}>{score}</span>
          {size === 'lg' && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">/ 100</span>}
        </div>
      </div>
    );
  };

  const SubScoreProgressBar = ({ name, score }) => (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center text-sm font-bold text-gray-700">
        <span>{name}</span>
        <span>{score}/100</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div 
          className="bg-indigo-600 h-2 rounded-full transition-all duration-1000" 
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="w-full mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <HiLightBulb className="text-amber-400" /> AI Career Health
        </h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Deep insights based on your resume and profile data.</p>
      </div>



      <div className="relative">
        {isEmptyState && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center backdrop-blur-xl bg-white/60 rounded-3xl pb-10 pointer-events-auto shadow-sm">
            <HiExclamationCircle className="w-16 h-16 text-indigo-600 mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Profile Actions Required</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto text-center px-4">
              {errorMessage || "Our AI needs to analyze your latest resume to generate your deep Career Health metrics and personalized action plan."}
            </p>
            <Link 
              to="/provider/profile" 
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Go to Profile
            </Link>
          </div>
        )}

        {/* Global Overview Row */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-6">
          <div className="flex flex-col items-center shrink-0">
            {renderScoreMeter(overviewData.career_health_score || 0, 'lg')}
            <span className="mt-4 text-xs font-black uppercase tracking-widest text-gray-400">Overall Health</span>
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">AI Summary</h3>
            <p className="text-sm text-gray-600 leading-relaxed bg-indigo-50/50 p-4 rounded-xl border border-indigo-50">
              {overviewData.summary}
            </p>
          </div>
        </div>

        {/* 5 Tabs Detailed Breakdown Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden mb-6">
          {/* Tabs Navigation */}
          <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50 hide-scrollbar">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                    isActive 
                      ? 'border-indigo-600 text-indigo-700 bg-white' 
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Panel Content */}
          <div className="p-6 md:p-8 relative">
            {isLocked && !isEmptyState && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center backdrop-blur-md bg-white/50 pointer-events-auto">
                <HiLockClosed className="w-12 h-12 text-amber-500 mb-3" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Upgrade to Unlock Breakdown</h3>
                <Link to="/provider/plans" className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-md hover:shadow-lg transition-all">
                  View Plans
                </Link>
              </div>
            )}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
              {/* Category Overall Score */}
              <div className="flex flex-col items-center bg-gray-50 p-6 rounded-2xl border border-gray-100 min-w-[200px]">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 mb-6">
                  <currentPanel.icon className="w-6 h-6" />
                </div>
                {renderScoreMeter(currentPanel.score, 'lg')}
                <h4 className="mt-4 font-bold text-gray-800 text-center">{currentPanel.title} Score</h4>
                <p className="text-xs text-gray-500 text-center mt-2 font-medium max-w-[160px]">
                  {currentPanel.description}
                </p>
              </div>

              {/* Detailed Breakdown Bars */}
              <div className="flex-1 w-full space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">Detailed Breakdown</h4>
                <div className="space-y-5">
                  {currentPanel.breakdowns.map((bk, i) => (
                    <SubScoreProgressBar key={i} name={bk.name} score={bk.score} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Analysis and Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
          {isLocked && !isEmptyState && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center backdrop-blur-md bg-white/50 rounded-3xl pointer-events-auto border border-gray-100">
              <div className="bg-white p-4 rounded-full shadow-lg mb-4 border border-gray-100">
                <HiLockClosed className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Deep Insights Locked</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto text-center text-sm font-medium">
                Upgrade to see your custom Action Plan and Top Strengths & Weaknesses.
              </p>
              <Link to="/provider/plans" className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md hover:shadow-lg transition-all">
                Unlock Insights
              </Link>
            </div>
          )}

          {/* Card 3: Action Plan (Strengths & Weaknesses) */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-6">Deep Profile Analysis</h3>
              <div className="space-y-6">
                <div className="bg-green-50/50 p-5 rounded-2xl border border-green-100">
                  <h4 className="text-sm font-black uppercase text-green-700 mb-3 flex items-center gap-2"><HiCheckCircle className="w-5 h-5" /> Top Strengths</h4>
                  <ul className="space-y-2">
                    {displayData.top_strengths?.map((str, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" /> {str}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                  <h4 className="text-sm font-black uppercase text-amber-700 mb-3 flex items-center gap-2"><HiExclamationCircle className="w-5 h-5" /> Areas to Improve</h4>
                  <ul className="space-y-2">
                    {displayData.top_weaknesses?.map((wk, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" /> {wk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Next Best Actions */}
          <div className="bg-[#081B3A] text-white rounded-3xl border border-[#0A224A] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/30">
                <HiTrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">Action Plan</h3>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4">Recommended Next Steps</h4>
              <ul className="space-y-3">
                {displayData.next_best_actions?.map((act, i) => (
                  <li key={i} className="text-sm text-blue-50 bg-[#0A224A] p-4 rounded-xl border border-[#133060] flex items-start gap-3 shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-black shrink-0">
                      {i + 1}
                    </div>
                    <span className="mt-0.5 leading-relaxed">{act}</span>
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
