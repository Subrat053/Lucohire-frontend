import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles, AlertCircle, ArrowRight, Briefcase, TrendingUp, Lightbulb, Target, CheckCircle2 } from "lucide-react";
import { getAICareerReport } from "../../services/providerAIService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";

export default function AITips() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAICareerReport();
  }, []);

  const fetchAICareerReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fileHash = localStorage.getItem('lastResumeHash');
      
      if (!fileHash) {
        setError("Please upload your resume in the 'Grow with AI' tab to generate your AI Career Report.");
        setLoading(false);
        return;
      }

      const response = await getAICareerReport({ fileHash });
      if (response?.data?.data) {
        setReportData(response.data.data);
      } else {
        setError("Please upload your resume in the 'Grow with AI' tab to generate your AI Career Report.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load AI Career Report. Ensure you have uploaded your resume.");
      toast.error("Failed to load AI Career Report");
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
          <h2 className="text-xl font-bold text-red-800 mb-2">Resume Data Required</h2>
          <p className="text-red-600 mb-6 max-w-md mx-auto">{error}</p>
          <Link
            to="/provider/grow-with-ai"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors gap-2"
          >
            Go to Grow with AI <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20">
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
  );
}
