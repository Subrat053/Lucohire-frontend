import React, { useState } from 'react';
import { Search, Sparkles, AlertCircle, CheckCircle2, Briefcase } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import toast from 'react-hot-toast';
import useTranslation from '../../hooks/useTranslation';
import { getAtsOptimizer } from '../../services/providerAIService';

export default function AtsOptimizerPanel({ fileHash, parsedData }) {
  const { t } = useTranslation();
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleOptimize = async () => {
    if (!jd.trim()) return;
    try {
      setLoading(true);
      const res = await getAtsOptimizer({ fileHash, parsedData, jobDescription: jd });
      if (res.success || res.data) {
        setData(res.data?.data || res.data || res);
      }
    } catch (error) {
      console.error("Failed to fetch ATS Optimizer data:", error);
      toast.error(error.response?.data?.message || "Failed to analyze ATS compatibility. Please ensure resume is uploaded.");
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
