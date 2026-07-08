import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles, AlertCircle, ArrowRight, Briefcase, TrendingUp, Lightbulb, Target, CheckCircle2, Lock } from "lucide-react";
import { getAICareerReport, getAiUsage } from "../../services/providerAIService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";

export default function AITips() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiUsage, setAiUsage] = useState({ limits: {}, usage: {} });
  const [usageLoading, setUsageLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
    fetchAICareerReport();
  }, []);

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

  const fetchAICareerReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fileHash = localStorage.getItem('lastResumeHash');
      
      const response = await getAICareerReport({ fileHash });
      if (response?.data?.data) {
        setReportData(response.data.data);
      } else {
        setError("To generate your AI Career Report, please upload your resume or complete your profile details.");
      }
    } catch (err) {
      if (err.response?.data?.code === 'REQUIRED_DATA_MISSING') {
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || "Failed to load AI Career Report. Ensure you have uploaded your resume or completed your profile.");
      }
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
        <LoadingSpinner size="lg" className="text-indigo-600 mb-4" />
        <p className="text-gray-500 font-medium">Analyzing your profile to generate AI Career Tips...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center mt-10">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Profile Actions Required</h2>
          <p className="text-red-600 mb-6 max-w-md mx-auto">{error}</p>
          <Link
            to="/provider/profile"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors gap-2"
          >
            Go to Profile <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20 relative">
      
      {/* Usage Banner */}
      {!usageLoading && (
        <div className="bg-indigo-50/50 border border-indigo-100 px-6 py-3 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">
              Career Report Limit: 
              {(() => {
                const limit = aiUsage.limits['aiCareerAnalysis'] || 0;
                const used = aiUsage.usage['aiCareerAnalysis'] || 0;
                if (limit === -1) return <span className="font-bold text-indigo-700 ml-1">Unlimited</span>;
                if (limit === 0) return <span className="font-bold text-red-600 ml-1">Not included in plan</span>;
                return <span className="font-bold text-indigo-700 ml-1">{Math.max(0, limit - used)} / {limit} requests remaining</span>;
              })()}
            </span>
          </div>
          <Link to="/provider/plans" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full transition-colors">
            Upgrade Plan
          </Link>
        </div>
      )}
      
      {/* UI Block Overlay */}
      {!usageLoading && (() => {
        const limit = aiUsage.limits['aiCareerAnalysis'] || 0;
        const used = aiUsage.usage['aiCareerAnalysis'] || 0;
        
        if (limit !== -1 && (limit === 0 || used >= limit)) {
          return (
            <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-2xl">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {limit === 0 ? 'Feature Not Available' : 'Usage Limit Reached'}
              </h3>
              <p className="text-gray-500 max-w-md mb-6">
                {limit === 0 
                  ? "Your current plan does not include access to AI Career Reports. Upgrade your plan to unlock."
                  : `You have used all ${limit} requests for this feature in the current billing cycle.`}
              </p>
              <Link to="/provider/plans" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                Upgrade Plan
              </Link>
            </div>
          );
        }
        return null;
      })()}

      <div className={!usageLoading && (() => {
        const limit = aiUsage.limits['aiCareerAnalysis'] || 0;
        const used = aiUsage.usage['aiCareerAnalysis'] || 0;
        return (limit !== -1 && (limit === 0 || used >= limit)) ? 'opacity-30 pointer-events-none' : '';
      })() ? 'opacity-30 pointer-events-none space-y-8' : 'space-y-8'}>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-indigo-500" />
          AI Career Report
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Personalized tips and market analytics based on your unique profile.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Missing Skills */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Missing Skills</h3>
          </div>
          <ul className="space-y-3">
            {reportData.missing_skills?.map((skill, i) => (
              <li key={i} className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span className="text-gray-700 leading-relaxed">{skill}</span>
              </li>
            ))}
            {(!reportData.missing_skills || reportData.missing_skills.length === 0) && (
              <li className="text-gray-500 italic">No critical missing skills identified.</li>
            )}
          </ul>
        </div>

        {/* Future Opportunities */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Future Opportunities</h3>
          </div>
          <ul className="space-y-3">
            {reportData.future_opportunities?.map((opp, i) => (
              <li key={i} className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-gray-700 leading-relaxed">{opp}</span>
              </li>
            ))}
            {(!reportData.future_opportunities || reportData.future_opportunities.length === 0) && (
              <li className="text-gray-500 italic">No specific future opportunities identified.</li>
            )}
          </ul>
        </div>

        {/* Job Retention Tips */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Job Retention Tips</h3>
          </div>
          <ul className="space-y-3">
            {reportData.job_retention_tips?.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <span className="text-gray-700 leading-relaxed">{tip}</span>
              </li>
            ))}
             {(!reportData.job_retention_tips || reportData.job_retention_tips.length === 0) && (
              <li className="text-gray-500 italic">No retention tips available.</li>
            )}
          </ul>
        </div>

        {/* Interview Tips */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Lightbulb className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Tips to Crack Interviews</h3>
          </div>
          <ul className="space-y-3">
            {reportData.interview_tips?.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-gray-700 leading-relaxed">{tip}</span>
              </li>
            ))}
             {(!reportData.interview_tips || reportData.interview_tips.length === 0) && (
              <li className="text-gray-500 italic">No interview tips available.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Market Demand */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Market Demand & Scarcity Analytics</h3>
        </div>
        
        {reportData.market_demand_analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
              <div className="text-sm font-medium text-purple-800 mb-1">Scarcity Level</div>
              <div className="text-2xl font-black text-purple-900">{reportData.market_demand_analytics.scarcity_level}</div>
            </div>
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div className="text-sm font-medium text-indigo-800 mb-1">Demand Trend</div>
              <div className="text-2xl font-black text-indigo-900">{reportData.market_demand_analytics.demand_trend}</div>
            </div>
            <div className="md:col-span-3 bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div className="text-sm font-medium text-gray-700 mb-2">Market Insight</div>
              <p className="text-gray-800 leading-relaxed">
                {reportData.market_demand_analytics.market_insight}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 italic">Market analytics not available for this profile.</p>
        )}
      </div>

        </div>
      </div>
  );
}
