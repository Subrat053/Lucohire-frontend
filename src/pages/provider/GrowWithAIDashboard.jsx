import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  HiLockClosed, HiSparkles, HiBriefcase, HiTrendingUp, HiExclamationCircle, HiCheckCircle, HiArrowRight, HiDocumentSearch, HiOutlineDocumentSearch, HiCheck, HiOutlineExclamationCircle, HiExclamation
} from 'react-icons/hi';
import { getCareerGPS, getHiringBarriers, getSkillGap, getAtsOptimizer } from '../../services/providerAIService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function GrowWithAIDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('gps'); // 'gps' or 'barriers'
  
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsData, setGpsData] = useState(null);
  const [gpsLocked, setGpsLocked] = useState(false);

  const [barriersLoading, setBarriersLoading] = useState(true);
  const [barriersData, setBarriersData] = useState(null);
  const [barriersLocked, setBarriersLocked] = useState(false);

  const [errorMessage, setErrorMessage] = useState(null);

  const { state } = location;
  const fileHash = state?.fileHash || localStorage.getItem('lastResumeHash');
  const parsedData = state?.parsedData;

  useEffect(() => {
    fetchGPS();
    fetchBarriers();
  }, [fileHash, parsedData]);

  const fetchGPS = async () => {
    try {
      setGpsLoading(true);
      setErrorMessage(null);
      
      const { data } = await getCareerGPS({ fileHash, parsedData });
      if (data.success) {
        console.log("=== GPS Data from OpenAI ===", data.data);
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
        console.log("=== Hiring Barriers from OpenAI ===", data.data);
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
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-xs">
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <HiSparkles className="w-10 h-10 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Grow with AI</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {errorMessage}
          </p>
          <Link
            to="/provider/profile"
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <span>Go to Profile</span>
            <HiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#081B3A] p-8 rounded-3xl text-white shadow-xl">
        <div className="flex items-center space-x-5">
          <HiSparkles className="w-10 h-10 text-blue-400" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Grow with AI</h1>
            <p className="text-slate-400 mt-1 text-sm md:text-base font-medium">
              Data-driven insights to accelerate your career trajectory.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('gps')}
          className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'gps' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <HiTrendingUp className="w-5 h-5" />
            <span>AI Career GPS</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('barriers')}
          className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'barriers' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <HiExclamationCircle className="w-5 h-5" />
            <span>Why Am I Not Getting Hired?</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('skillgap')}
          className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'skillgap' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <HiDocumentSearch className="w-5 h-5" />
            <span>Test Skill Gap Report</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('ats')}
          className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'ats' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <HiOutlineDocumentSearch className="w-5 h-5" />
            <span>ATS Optimizer</span>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
        {activeTab === 'gps' && (
          <CareerGPSPanel 
            loading={gpsLoading} 
            data={gpsData} 
            isLocked={gpsLocked} 
          />
        )}
        
        {activeTab === 'barriers' && (
          <HiringBarriersPanel 
            loading={barriersLoading} 
            data={barriersData} 
            isLocked={barriersLocked} 
            gpsData={gpsData}
          />
        )}

        {activeTab === 'skillgap' && (
          <SkillGapPanel 
            fileHash={fileHash}
            parsedData={parsedData}
          />
        )}

        {activeTab === 'ats' && (
          <AtsOptimizerPanel 
            fileHash={fileHash}
            parsedData={parsedData}
          />
        )}
      </div>
    </div>
  );
}

function CareerGPSPanel({ loading, data, isLocked }) {
  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Calculating your optimal career trajectory...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="relative">
      {/* Content */}
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Role</p>
            <h3 className="text-xl font-bold text-slate-900">{data.current_role || 'Not Specified'}</h3>
          </div>
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-2">Recommended Next Role</p>
            <h3 className="text-xl font-bold text-indigo-900">{data.recommended_next_role}</h3>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
          <h4 className="text-lg font-bold text-gray-900 mb-4">Reasoning Summary</h4>
          <p className="text-gray-600 leading-relaxed">{data.reasoning_summary}</p>
        </div>

        {/* Locked Content Area */}
        <div className="relative">
          <div className={isLocked ? "blur-md pointer-events-none opacity-50 select-none" : ""}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <HiCheckCircle className="text-green-500" />
                    Required Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(data.required_skills || ['React', 'Node.js', 'System Design']).map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <HiExclamationCircle className="text-amber-500" />
                    Missing Skills to Acquire
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(data.missing_skills || ['AWS', 'GraphQL']).map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Learning Path</h4>
                  <div className="space-y-4">
                    {(data.learning_path || [{ step: 'Step 1', description: 'Sample' }]).map((path, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                          {i + 1}
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-900">{path.step}</h5>
                          <p className="text-gray-600 text-sm mt-1">{path.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                  <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-2">Salary Growth Potential</p>
                  <h3 className="text-4xl font-black text-emerald-600">+{data.salary_growth_potential_percent || 45}%</h3>
                  <p className="text-emerald-600 text-sm mt-2 font-medium">Estimated increase upon transition</p>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-2">Timeline</p>
                  <h3 className="text-3xl font-bold text-blue-900">{data.estimated_timeline_months || 6} Months</h3>
                  <p className="text-blue-600 text-sm mt-2 font-medium">Estimated time to upskill</p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Alternative Roles</h4>
                  <ul className="space-y-2">
                    {(data.alternative_roles || ['Role A', 'Role B']).map((role, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                        {role}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Blur Overlay */}
          {isLocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
              <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-gray-100 text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
                  <HiLockClosed className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Unlock Full GPS Plan</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  Upgrade your plan to see the exact skills you're missing, your personalized learning path, and salary growth potential.
                </p>
                <Link
                  to="/provider/plans"
                  className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  View Upgrade Plans
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HiringBarriersPanel({ loading, data, isLocked, gpsData }) {
  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
        <p className="mt-4 text-gray-500">Analyzing your hiring barriers...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="relative">
      <div className="p-8 space-y-8">
        
        {/* Score Card */}
        <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-50 p-8 rounded-3xl border border-slate-100">
          <div className="relative w-32 h-32 flex shrink-0 items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${data.hiring_barrier_score > 60 ? 'text-red-500' : data.hiring_barrier_score > 30 ? 'text-amber-500' : 'text-green-500'}`}
                strokeDasharray={`${data.hiring_barrier_score}, 100`}
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-900">{data.hiring_barrier_score}</span>
              <span className="text-xs font-bold text-gray-400 uppercase">Score</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Hiring Barrier Score</h3>
            <p className="text-gray-600">
              A lower score is better. Your score indicates {data.hiring_barrier_score > 60 ? 'significant' : data.hiring_barrier_score > 30 ? 'moderate' : 'few'} barriers to getting hired based on your current resume presentation and skills.
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-4">Top Reason You Aren't Getting Hired</h4>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl text-red-900 font-medium">
            {data.top_reasons && data.top_reasons[0] ? data.top_reasons[0] : "Needs more data."}
          </div>
        </div>

        {/* Locked Content Area */}
        <div className="relative">
          <div className={isLocked ? "blur-md pointer-events-none opacity-50 select-none" : ""}>
            
            {data.top_reasons && data.top_reasons.length > 1 && (
              <div className="mb-8">
                <h4 className="font-bold text-gray-900 mb-3">Other Major Reasons</h4>
                <ul className="space-y-2">
                  {(data.top_reasons.slice(1) || ['Reason 2', 'Reason 3']).map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs">
                <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <HiBriefcase className="text-blue-500" /> Resume Issues
                </h5>
                <ul className="space-y-2 text-sm text-gray-600">
                  {(data.resume_issues || ['Issue 1']).map((issue, i) => (
                    <li key={i}>• {issue}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs">
                <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <HiCheckCircle className="text-amber-500" /> Skill Issues
                </h5>
                <ul className="space-y-2 text-sm text-gray-600">
                  {((gpsData?.missing_skills?.length > 0 ? gpsData.missing_skills : data.skill_issues) || ['No major skill issues detected']).map((issue, i) => (
                    <li key={i}>• {issue}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs">
                <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <HiTrendingUp className="text-emerald-500" /> Salary/Location
                </h5>
                <ul className="space-y-2 text-sm text-gray-600">
                  {(data.salary_or_location_issues || ['Issue 1']).map((issue, i) => (
                    <li key={i}>• {issue}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-4">Immediate Action Plan</h4>
              <div className="space-y-3">
                {(data.immediate_action_plan || [{ action: 'Update resume', priority: 'High' }]).map((plan, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-100 p-4 rounded-xl">
                    <span className="font-medium text-gray-800">{plan.action}</span>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                      plan.priority === 'High' ? 'bg-red-100 text-red-700' :
                      plan.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {plan.priority} Priority
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Blur Overlay */}
          {isLocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
              <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-gray-100 text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
                  <HiLockClosed className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Unlock Full Analysis</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  Upgrade your plan to see your detailed resume/skill issues and get a prioritized immediate action plan to get hired.
                </p>
                <Link
                  to="/provider/plans"
                  className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  View Upgrade Plans
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SkillGapPanel({ fileHash, parsedData }) {
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleAnalyze = async () => {
    if (!jd.trim()) return;
    try {
      setLoading(true);
      const res = await getSkillGap({ fileHash, parsedData, jobDescription: jd });
      if (res.data.success) {
        console.log("=== Skill Gap Data from OpenAI ===", res.data.data);
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch Skill Gap data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Input area */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <HiDocumentSearch className="text-indigo-600 w-6 h-6" />
          Test AI Skill Gap Analysis
        </h3>
        <p className="text-gray-500 mb-4 text-sm">
          Paste a Job Description here. The AI will analyze your resume against the JD and generate a detailed Skill Gap Report exactly as recruiters will see it.
        </p>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          className="w-full h-40 p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          placeholder="Paste Job Description here..."
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !jd.trim()}
          className="mt-4 inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Analyzing Skill Gap...</span>
            </>
          ) : (
            <>
              <HiSparkles className="w-5 h-5" />
              <span>Generate Skill Gap Report</span>
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {data && (
        <div className="relative">
          <div className="p-6 md:p-8 space-y-8 border border-gray-200 rounded-3xl shadow-xs">
            
            {/* Score Card */}
            <div className="flex flex-col md:flex-row gap-8 items-center bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
              <div className="relative w-24 h-24 flex shrink-0 items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`${data.job_match_score > 75 ? 'text-green-500' : data.job_match_score > 50 ? 'text-amber-500' : 'text-red-500'}`}
                    strokeDasharray={`${data.job_match_score}, 100`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-indigo-900">{data.job_match_score}%</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-indigo-900 mb-1">Job Match Score</h3>
                <p className="text-indigo-700 text-sm">
                  Based on your resume, you are a {data.job_match_score}% match for this job description.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Matched Skills */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <HiCheckCircle className="text-green-500" />
                  Matched Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(data.matched_skills || []).map((skill, i) => (
                    <span key={i} className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded-lg text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                  {(!data.matched_skills || data.matched_skills.length === 0) && (
                    <p className="text-sm text-gray-500">No matched skills found.</p>
                  )}
                </div>
              </div>

              {/* Missing Critical */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <HiExclamationCircle className="text-red-500" />
                  Missing Critical Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(data.missing_critical_skills || []).map((skill, i) => (
                    <span key={i} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                  {(!data.missing_critical_skills || data.missing_critical_skills.length === 0) && (
                    <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">None!</span>
                  )}
                </div>

                {/* Missing Optional */}
                {data.missing_optional_skills && data.missing_optional_skills.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-bold text-gray-700 mb-2">Missing Nice-to-Have Skills</h5>
                    <div className="flex flex-wrap gap-2">
                      {data.missing_optional_skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fastest Hire Path */}
            <div className="bg-gradient-to-br from-indigo-900 to-[#081B3A] p-6 rounded-2xl text-white mt-8 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <HiSparkles className="text-yellow-400 w-6 h-6" />
                <h4 className="text-lg font-bold text-white">Fastest Hire Path</h4>
              </div>
              <p className="text-indigo-100 leading-relaxed text-sm md:text-base">
                {data.fastest_hire_path || "No clear path identified."}
              </p>
              
              <div className="mt-6 pt-6 border-t border-indigo-800/50 flex items-center justify-between">
                <span className="text-indigo-200 text-sm font-medium">Estimated time to be hire-ready:</span>
                <span className="px-4 py-1.5 bg-indigo-800 text-white rounded-lg font-bold text-sm">
                  {data.hire_ready_after || "Unknown"}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function AtsOptimizerPanel({ fileHash, parsedData }) {
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleOptimize = async () => {
    if (!jd.trim()) return;
    try {
      setLoading(true);
      const res = await getAtsOptimizer({ fileHash, parsedData, jobDescription: jd });
      if (res.success || res.data) {
        const payload = res.data || res;
        console.log("=== ATS Optimizer Data from OpenAI ===", payload.data);
        setData(payload.data);
      }
    } catch (error) {
      console.error("Failed to fetch ATS Optimizer data:", error);
      toast.error('Failed to analyze ATS compatibility.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Input area */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <HiOutlineDocumentSearch className="text-indigo-600 w-6 h-6" />
          ATS Resume Optimizer
        </h3>
        <p className="text-gray-500 mb-4 text-sm">
          Paste the target Job Description to see how an ATS (Applicant Tracking System) evaluates your resume. We will suggest actionable improvements to boost your score without adding fake experience.
        </p>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          className="w-full h-40 p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          placeholder="Paste Target Job Description here..."
        />
        <button
          onClick={handleOptimize}
          disabled={loading || !jd.trim()}
          className="mt-4 inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Optimizing Resume...</span>
            </>
          ) : (
            <>
              <HiSparkles className="w-5 h-5" />
              <span>Optimize for ATS</span>
            </>
          )}
        </button>
      </div>

      {/* Results Area */}
      {data && (
        <div className="space-y-8 animate-fadeIn">
          {/* Warnings */}
          {data.warnings && data.warnings.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
              <div className="flex">
                <div className="flex-shrink-0">
                  <HiExclamation className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-bold text-red-800">AI Integrity Warnings</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {data.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl flex items-center gap-6 shadow-sm">
              <div className="relative w-20 h-20 flex shrink-0 items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-gray-200" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className={`${data.ats_score_before > 75 ? 'text-green-500' : data.ats_score_before > 50 ? 'text-amber-500' : 'text-red-500'}`} strokeDasharray={`${data.ats_score_before}, 100`} strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-gray-700">{data.ats_score_before}</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Original ATS Score</h4>
                <p className="text-sm text-gray-500">Your resume's current match percentage.</p>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex items-center gap-6 shadow-sm">
              <div className="relative w-20 h-20 flex shrink-0 items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-indigo-200" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-indigo-600" strokeDasharray={`${data.ats_score_after}, 100`} strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-indigo-700">{data.ats_score_after}</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-indigo-900 mb-1">Potential ATS Score</h4>
                <p className="text-sm text-indigo-700">Your score after applying these improvements.</p>
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-rose-100 p-6 rounded-2xl shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <HiOutlineExclamationCircle className="text-rose-500 w-5 h-5" />
                Missing Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {(data.missing_keywords || []).map((keyword, i) => (
                  <span key={i} className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">
                    {keyword}
                  </span>
                ))}
                {(!data.missing_keywords || data.missing_keywords.length === 0) && (
                  <span className="text-sm text-gray-500 italic">No missing keywords found.</span>
                )}
              </div>
            </div>

            <div className="bg-white border border-emerald-100 p-6 rounded-2xl shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <HiCheck className="text-emerald-500 w-5 h-5" />
                Recommended Keywords to Add
              </h4>
              <div className="flex flex-wrap gap-2">
                {(data.added_keywords || []).map((keyword, i) => (
                  <span key={i} className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold">
                    + {keyword}
                  </span>
                ))}
                {(!data.added_keywords || data.added_keywords.length === 0) && (
                  <span className="text-sm text-gray-500 italic">No new keywords suggested.</span>
                )}
              </div>
            </div>
          </div>

          {/* Summary & Experience Improvements */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-900 to-[#081B3A] p-6 rounded-2xl text-white shadow-lg">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <HiSparkles className="text-yellow-400 w-5 h-5" />
                Optimized Resume Summary
              </h4>
              <p className="text-indigo-100 leading-relaxed text-sm">
                {data.improved_summary || "No summary improvements suggested."}
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <HiBriefcase className="text-indigo-500 w-5 h-5" />
                Improved Experience Bullets
              </h4>
              <ul className="space-y-4">
                {(data.improved_experience_bullets || []).map((bullet, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <HiCheckCircle className="text-indigo-500 w-5 h-5 shrink-0 mt-0.5" />
                    <span dangerouslySetInnerHTML={{ __html: bullet.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </li>
                ))}
                {(!data.improved_experience_bullets || data.improved_experience_bullets.length === 0) && (
                  <p className="text-sm text-gray-500 italic">No bullet point improvements suggested.</p>
                )}
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

