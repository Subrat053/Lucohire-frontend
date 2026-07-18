import useTranslation from "../../hooks/useTranslation";
import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
  HiBriefcase,
  HiLocationMarker,
  HiCurrencyRupee,
  HiSearch,
  HiFilter,
  HiCheckCircle,
  HiClock,
  HiOfficeBuilding,
  HiChevronLeft,
  HiChevronRight,
  HiX,
  HiDocumentText,
  HiExclamationCircle,
  HiSparkles,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineLockClosed,
  HiOutlinePaperAirplane,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineBriefcase,
} from "react-icons/hi";
import { FaRupeeSign, FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";
import { providerAPI, subscriptionAPI } from "../../services/api";
import { getJobMatchingEngine } from "../../services/providerAIService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import LocationSearch from "../../components/LocationSearch";
import RecruiterProfileModal from "../../components/recruiter/RecruiterProfileModal";
import AIExpiryBadge from "../../components/ai/AIExpiryBadge";

const BUDGET_LABELS = {
  fixed: "Fixed",
  hourly: "/hr",
  monthly: "/mo",
  negotiable: "Negotiable",
};
const STATUS_COLORS = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  reviewed: "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  hired: "bg-green-50 text-green-700 border-green-200",
};

/* ── Apply Modal ─────────────────────────────────────────────────────── */
const ApplyModal = ({ job, onClose, onSuccess }) => {
  const {
    t
  } = useTranslation();

  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await providerAPI.applyToJob(job._id, { coverLetter });
      toast.success("Application submitted successfully!");
      onSuccess(job._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply to this job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden transform transition-all">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">{t("Apply for:")}{job.title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-xl transition text-gray-500"
          >
            <HiX className="w-5.5 h-5.5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-gray-600">
              <span className="font-bold text-gray-800">{t("Recruiter:")}</span>{" "}
              {job.companyName || job.recruiter?.name || "Recruiter Company"}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              <span className="font-bold text-gray-800">{t("Skill needed:")}</span>{" "}
              {job.skill} · {job.city}
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("Introduce Yourself / Cover Letter")}{" "}
              <span className="text-gray-400 font-normal">{t("(optional)")}</span>
            </label>
            <textarea
              rows={5}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              maxLength={1000}
              placeholder={t(
                "Describe your qualifications, experience, and why you are the best fit for this role..."
              )}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none outline-none"
            />
            <p className="text-right text-[10px] text-gray-400 mt-0.5">
              {coverLetter.length}/1000
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition"
            >{t("Cancel")}</button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {loading ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Job Details Modal ────────────────────────────────────────────────── */
const JobDetailsModal = ({ job, onClose, onApplyNow, onRecruiterClick }) => {
  const {
    t
  } = useTranslation();

  useEffect(() => {
    let metaTag = null;
    if (job?.isExternal) {
      metaTag = document.createElement("meta");
      metaTag.name = "robots";
      metaTag.content = "noindex, nofollow";
      document.head.appendChild(metaTag);
    }
    return () => {
      if (metaTag) {
        document.head.removeChild(metaTag);
      }
    };
  }, [job]);
  const budgetText =
    job.budgetType === "negotiable"
      ? "Negotiable"
      : `₹${job.budgetMin?.toLocaleString()} – ₹${job.budgetMax?.toLocaleString()} ${BUDGET_LABELS[job.budgetType] || ""}`.trim();

  const postedAgo = (() => {
    const d = Math.floor((Date.now() - new Date(job.createdAt)) / 86400000);
    return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all border border-gray-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="font-extrabold text-gray-900 text-lg sm:text-xl flex items-center gap-2">
              <HiBriefcase className="w-5 h-5 text-emerald-600 shrink-0 animate-pulse" />
              {job.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{t("Posted")}{postedAgo}{t("by")}{" "}
              <span
                onClick={() => {
                  if (job.recruiter?._id) {
                    onRecruiterClick(job.recruiter._id, job.companyName || job.recruiter?.name);
                  }
                }}
                className={`font-semibold text-gray-700 ${
                  job.recruiter?._id ? "cursor-pointer hover:text-emerald-600 hover:underline transition-colors" : ""
                }`}
              >
                {job.recruiter?.name || "Company"}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200/80 rounded-xl transition text-gray-500 hover:text-gray-800"
          >
            <HiX className="w-5.5 h-5.5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-gray-700">
          
          {/* AI Expiry Predictor Badge */}
          <AIExpiryBadge jobId={job._id} />

          {/* Main Info Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/50">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">{t("Budget / Salary")}</span>
              <p className="font-extrabold text-gray-900 flex items-center gap-0.5 text-sm sm:text-base">
                <FaRupeeSign className="w-3.5 h-3.5 text-emerald-600" />
                {budgetText}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">{t("Location")}</span>
              <p className="font-bold text-gray-800 flex items-center gap-1">
                <HiLocationMarker className="w-4 h-4 text-emerald-600" />
                {job.city || "Not specified"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">{t("Job Status")}</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mt-0.5 w-fit">{t("Active Job")}</span>
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 text-sm sm:text-base border-l-4 border-emerald-600 pl-2">{t("Job Description")}</h4>
            {job.description ? (
              <div 
                className="text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-100/80 text-xs sm:text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            ) : (
              <p className="text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-100/80 whitespace-pre-line text-xs sm:text-sm">{t("No detailed description available.")}</p>
            )}
          </div>

          {/* Requirements & Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-sm border-l-4 border-emerald-600 pl-2">{t("Experience Needed")}</h4>
              <p className="text-xs sm:text-sm text-gray-600 bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-100/80 font-medium">
                {job.experienceRequired ||
                  "Experience requirement not specified"}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-sm border-l-4 border-emerald-600 pl-2">{t("Primary Skill Category")}</h4>
              <p className="text-xs sm:text-sm text-emerald-700 bg-emerald-50/30 px-4 py-3 rounded-xl border border-emerald-100/50 font-bold">
                {job.skill}
              </p>
            </div>
          </div>

          {/* Other Skills Needed */}
          {job.requirements?.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-sm border-l-4 border-emerald-600 pl-2">{t("Required Skills / Credentials")}</h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {job.requirements.map((r, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl border border-gray-200 font-semibold shadow-2xs"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Company / Recruiter Basic Info */}
          <div className="space-y-2 border-t border-gray-100 pt-5">
            <h4 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-1">
              <HiOfficeBuilding className="w-5 h-5 text-gray-400" />{t("About The Company")}</h4>
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/80 space-y-2">
              <p
                onClick={() => {
                  if (job.recruiter?._id) {
                    onRecruiterClick(job.recruiter._id, job.companyName || job.recruiter?.name);
                  }
                }}
                className={`text-xs sm:text-sm font-bold text-gray-800 ${
                  job.recruiter?._id ? "cursor-pointer hover:text-emerald-600 hover:underline transition-colors w-fit" : ""
                }`}
              >
                {job.companyName || job.recruiter?.name || "Recruiter Company"}
              </p>
              <p className="text-xs text-gray-600 leading-relaxed italic">
                "
                {job.companyInfo ||
                  "This company is registered under the ServiceHub network, providing jobs across multiple sectors."}
                "
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition"
          >{t("Close details")}</button>
          {job.hasApplied ? (
            <div className="flex-1 py-3 bg-green-50 border border-green-200 text-green-700 font-bold rounded-xl text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 shadow-2xs">
              <HiCheckCircle className="w-4 h-4 animate-bounce" />{t("Applied\n              Successfully")}</div>
          ) : job.isExternal && job.externalUrl ? (
            <a
              href={job.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 transition block text-center"
            >{t("Apply Externally")}</a>
          ) : (
            <button
              onClick={() => {
                onApplyNow(job);
              }}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 transition"
            >{t("Apply Now")}</button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Job Card Skeleton ────────────────────────────────────────────────── */
const JobCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all flex flex-col justify-between h-full animate-pulse">
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="h-5 bg-gray-200 rounded-lg w-3/4"></div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <div className="h-3 bg-gray-100 rounded-md w-24"></div>
            <div className="h-3 bg-gray-100 rounded-md w-20"></div>
            <div className="h-3 bg-gray-100 rounded-md w-16"></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-5 bg-emerald-50/50 rounded-full w-16"></div>
            <div className="h-5 bg-gray-100 rounded-full w-24"></div>
          </div>
        </div>
        <div className="shrink-0 space-y-1">
          <div className="h-4 bg-gray-200 rounded-lg w-16"></div>
          <div className="h-3 bg-gray-100 rounded-lg w-10"></div>
        </div>
      </div>
      <div className="space-y-2 mt-4">
        <div className="h-3 bg-gray-100 rounded-md w-full"></div>
        <div className="h-3 bg-gray-100 rounded-md w-5/6"></div>
      </div>
    </div>
    <div className="flex items-center justify-between mt-6 pt-3 border-t border-gray-50">
      <div className="h-3 bg-gray-100 rounded-md w-20"></div>
      <div className="h-8 bg-gray-200 rounded-xl w-28"></div>
    </div>
  </div>
);

const JobCard = ({
  job,
  onViewDetails,
  onApplyNow,
  aiInsights,
  onRecruiterClick,
  hasActivePlan,
  onToggleSave
}) => {
  const { t } = useTranslation();

  const budgetText =
    job.budgetType === "negotiable"
      ? "Negotiable"
      : `₹${job.budgetMin?.toLocaleString()} – ₹${job.budgetMax?.toLocaleString()} ${BUDGET_LABELS[job.budgetType] || ""}`.trim();

  const postedAgo = (() => {
    const d = Math.floor((Date.now() - new Date(job.createdAt)) / 86400000);
    return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
  })();

  const matchScore = aiInsights?.matchScore || job.matchScore || 0;
  
  // Extract missing skills string to reuse in insights
  const missingSkillsStr = aiInsights?.missingSkills?.length > 0 ? aiInsights.missingSkills.join(", ") : "Figma, UI Design, Strategy";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-all mb-4 flex flex-col xl:flex-row gap-6 xl:items-center">
      
      {/* 1. Logo & Basic Info */}
      <div className="flex flex-row gap-4 xl:gap-5 flex-1 w-full xl:w-auto relative min-w-0">
        {job.isSaved ? (
          <HiBookmark onClick={(e) => { e.stopPropagation(); onToggleSave && onToggleSave(job); }} className="w-5 h-5 text-blue-600 absolute right-0 top-0 cursor-pointer hover:text-blue-700 hidden xl:block" />
        ) : (
          <HiOutlineBookmark onClick={(e) => { e.stopPropagation(); onToggleSave && onToggleSave(job); }} className="w-5 h-5 text-blue-600 absolute right-0 top-0 cursor-pointer hover:text-blue-700 hidden xl:block" />
        )}
        <div className="shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-gray-100 flex flex-col items-center justify-center p-2 shadow-xs relative">
            <span className="font-extrabold text-xl sm:text-2xl text-gray-800 tracking-tighter capitalize">{job.companyName?.substring(0,2) || "CO"}</span>
            <div className="absolute -bottom-2 bg-emerald-50 text-emerald-600 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 whitespace-nowrap shadow-sm">
              {matchScore}% Match
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-1.5 w-full pr-6 xl:pr-0 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">
              {job.title}
            </h3>
            {matchScore >= 80 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Best Match</span>
            )}
            {job.isSaved ? (
              <HiBookmark onClick={(e) => { e.stopPropagation(); onToggleSave && onToggleSave(job); }} className="w-5 h-5 text-blue-600 ml-auto cursor-pointer xl:hidden" />
            ) : (
              <HiOutlineBookmark onClick={(e) => { e.stopPropagation(); onToggleSave && onToggleSave(job); }} className="w-5 h-5 text-blue-600 ml-auto cursor-pointer xl:hidden" />
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-1 text-[12px] sm:text-[13px] font-medium text-gray-500">
             <span className="cursor-pointer hover:text-blue-600 font-semibold truncate max-w-[120px] sm:max-w-[200px]" onClick={() => job.recruiter?._id && onRecruiterClick(job.recruiter._id, job.companyName)}>
               {job.companyName || job.recruiter?.name || "Company"}
             </span>
             <span className="text-gray-300">•</span>
             <span>{job.city}</span>
             <span className="text-gray-300">•</span>
             <span>{job.workMode || 'Full-time'}</span>
          </div>

          <div className="flex flex-wrap gap-2 mt-1">
             {job.skill && (
               <span className="text-xs px-3 py-1 bg-gray-50 text-gray-600 rounded-full font-medium">{job.skill}</span>
             )}
             {job.requirements?.slice(0, 3).map((r, i) => (
               <span key={i} className="text-xs px-3 py-1 bg-gray-50 text-gray-600 rounded-full font-medium">{r}</span>
             ))}
             {job.requirements?.length > 3 && (
               <span className="text-xs px-3 py-1 bg-gray-50 text-gray-600 rounded-full font-medium">+{job.requirements.length - 3}</span>
             )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500 mt-2">
            <div className="flex items-center gap-1.5">
               <HiOutlineBriefcase className="w-4 h-4" /> {t("Posted")} {postedAgo}
            </div>
            <div className="flex items-center gap-1.5">
               <span className="text-gray-300">•</span> 120 applicants
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-gray-700 mt-2">
            <div className="flex items-center gap-1.5">
               <HiOutlineBriefcase className="w-4 h-4 text-gray-400" /> {job.experienceRequired || '2-5 Yrs'}
            </div>
            <div className="flex items-center gap-1.5">
               <HiCurrencyRupee className="w-4 h-4 text-gray-400" /> {budgetText}
            </div>
            <div className="flex items-center gap-1.5">
               <HiLocationMarker className="w-4 h-4 text-gray-400" /> {job.workMode || 'On-site'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Match Score & Action Buttons */}
      <div className="flex flex-col sm:flex-row xl:flex-col items-center justify-center gap-4 xl:gap-3 px-2 w-full xl:w-auto shrink-0 mt-4 xl:mt-0">
        <div className="flex flex-col items-center gap-1">
          {/* Match Score Circle */}
          <div className="w-16 h-16 rounded-full border-[4px] border-emerald-500 border-l-emerald-100 flex items-center justify-center -rotate-45">
             <span className="font-bold text-[15px] text-emerald-600 rotate-45">{matchScore}%</span>
          </div>
          <span className="text-[10px] font-semibold text-gray-500">Match Score</span>
        </div>
        <div className="flex flex-col items-center gap-2 w-full sm:w-auto xl:w-full">
          <button
            onClick={() => onApplyNow ? onApplyNow(job) : onViewDetails(job)}
            className="w-full sm:w-40 xl:w-36 py-2.5 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm"
          >
            {t("Apply Now")} <HiOutlinePaperAirplane className="w-4 h-4 -rotate-45" />
          </button>
          <button
            onClick={() => onViewDetails(job)}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            {t("View Job Details")}
          </button>
        </div>
      </div>

      {/* 3. Right Section: AI Insights Box */}
      <div className="w-full xl:w-[330px] shrink-0 bg-[#f9fafb] rounded-xl p-3.5 border border-gray-100 flex flex-col relative overflow-hidden mt-4 xl:mt-0">
        <div className="flex items-center justify-between mb-3">
           <h4 className="font-bold text-sm text-[#1e293b]">Your AI Career Insights</h4>
           <HiOutlineLockClosed className="w-4 h-4 text-blue-600" />
        </div>

        <div className="space-y-3 relative min-h-[110px]">
          {/* If no plan, overlay banner at the bottom */}
          {!hasActivePlan && (
            <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end">
               <div className="bg-[#eff6ff] border border-blue-100 rounded-lg p-2.5 flex gap-2.5 items-center">
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-50">
                    <HiOutlineLockClosed className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[#1e3a8a] truncate">Want more clarity?</span>
                    <Link to="/provider/my-plan" className="text-[10px] text-blue-600 hover:underline mt-0.5 truncate">
                      Unlock complete insights
                    </Link>
                  </div>
               </div>
            </div>
          )}

          {/* List of insights — labels always visible, values blurred for free users */}
          <div className="flex items-start gap-2 w-full">
            <HiExclamationCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <span className="font-semibold text-xs text-gray-700 whitespace-nowrap shrink-0">Missing Skills</span>
            <span className="text-gray-300 shrink-0 text-xs">•</span>
            <div className={`flex-1 ${!hasActivePlan ? 'blur-sm select-none opacity-60' : ''}`}>
              <span className="text-xs text-gray-500 leading-snug">
                {!hasActivePlan
                  ? "Figma, Bootstrap, HTML5, CSS, Web Design"
                  : aiInsights
                    ? (aiInsights.missingSkills?.length > 0 ? aiInsights.missingSkills.join(", ") : "None")
                    : "Generating..."}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 w-full">
            <HiOutlineMail className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="font-semibold text-xs text-gray-700 whitespace-nowrap shrink-0">Not Getting Hired?</span>
            <span className="text-gray-300 shrink-0 text-xs">•</span>
            <div className={`flex-1 ${!hasActivePlan ? 'blur-sm select-none opacity-60' : ''}`}>
              <span className="text-xs text-gray-500 leading-snug">
                {!hasActivePlan
                  ? "Portfolio lacks strong mobile UI/UX examples."
                  : aiInsights
                    ? (aiInsights.hireBlocker || "No major blockers found.")
                    : "Generating..."}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 w-full">
            <HiOutlinePhone className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span className="font-semibold text-xs text-gray-700 whitespace-nowrap shrink-0">Call Probability</span>
            <span className="text-gray-300 shrink-0 text-xs">•</span>
            <div className={`flex-1 ${!hasActivePlan ? 'blur-sm select-none opacity-60' : ''}`}>
              <span className="text-xs text-gray-500 leading-snug">
                {!hasActivePlan
                  ? "Based on call probability 65%"
                  : aiInsights
                    ? (aiInsights.interviewProbability != null ? `Interview probability: ${aiInsights.interviewProbability}%` : "Not enough data")
                    : "Generating..."}
              </span>
            </div>
          </div>

          {/* Spacer so lock banner doesn't cover last row */}
          {!hasActivePlan && <div className="h-8" />}
        </div>
      </div>

    </div>
  );
};

/* ── Applications Tab ────────────────────────────────────────────────── */
const ApplicationsTab = ({ onRecruiterClick }) => {
  const {
    t
  } = useTranslation();

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    providerAPI
      .getApplications()
      .then((r) => setApps(r.data.applications || []))
      .catch(() => toast.error("Failed to load applications"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  if (!apps.length)
    return (
      <div className="text-center py-16 text-gray-400">
        <HiDocumentText className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">{t("No applications yet")}</p>
        <p className="text-sm mt-1">{t("Browse jobs and apply to get started")}</p>
      </div>
    );

  return (
    <div className="space-y-3">
      {apps.map((app) => (
        <div
          key={app._id}
          className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-bold text-gray-900">
                {app.jobPost?.title || "Job"}
              </h4>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                <span
                  onClick={() => {
                    const recruiter = app.jobPost?.recruiter;
                    const recId = recruiter?._id || (typeof recruiter === "string" ? recruiter : null);
                    if (recId) {
                      onRecruiterClick(recId, app.jobPost?.companyName || recruiter?.name);
                    }
                  }}
                  className={`flex items-center gap-1 ${
                    (app.jobPost?.recruiter?._id || app.jobPost?.recruiter) ? "cursor-pointer hover:text-emerald-600 hover:underline transition-colors" : ""
                  }`}
                >
                  <HiOfficeBuilding className="w-3.5 h-3.5" />
                  {app.jobPost?.companyName ||
                    app.jobPost?.recruiter?.name ||
                    "Recruiter"}
                </span>
                <span className="flex items-center gap-1">
                  <HiLocationMarker className="w-3.5 h-3.5" />
                  {app.jobPost?.city}
                </span>
                <span className="flex items-center gap-1">
                  <HiClock className="w-3.5 h-3.5" />{t("Applied")}{" "}
                  {new Date(
                    app.appliedAt || app.createdAt,
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>
            <span
              className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[app.status] || "bg-gray-50 text-gray-600 border-gray-200"}`}
            >
              {app.status}
            </span>
          </div>
          {app.coverLetter && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-2 bg-gray-50 rounded-xl px-3 py-2">
              {app.coverLetter}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Main Page ───────────────────────────────────────────────────────── */
const ProviderJobs = () => {
  const {
    t
  } = useTranslation();

  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState("browse"); // 'browse' | 'applications'
  const [jobs, setJobs] = useState([]);
  const [topMatches, setTopMatches] = useState([]);
  const [showMatchesDropdown, setShowMatchesDropdown] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [filters, setFilters] = useState({ skill: "", city: "", origin: "all", source: "" });
  const [search, setSearch] = useState({ skill: "", city: "", origin: "all", source: "" });
  const [applyTarget, setApplyTarget] = useState(null);
  // viewDetailTarget removed — now navigates to /provider/job/:jobId
  const [recruiterProfileTarget, setRecruiterProfileTarget] = useState(null);

  const [aiMatchResults, setAiMatchResults] = useState(null);
  const [isMatchLoading, setIsMatchLoading] = useState(false);
  const [resumeMissing, setResumeMissing] = useState(false);

  // ── Income Path Filter ──────────────────────────────────────────────
  // Computed SYNCHRONOUSLY from location.state so the first data-fetch
  // useEffect already sees the correct value (no async race condition).
  const navState = location.state;
  const initialIncomeFilter = (() => {
    if (!navState?.fromIncomePath) return null;
    const f = { pathTitle: navState.pathTitle || navState.pathType || 'Related Jobs' };
    if (navState.scheduleType) f.scheduleType = navState.scheduleType;
    if (navState.workMode) f.workMode = navState.workMode;
    return f;
  })();
  const [incomePathFilter, setIncomePathFilter] = useState(initialIncomeFilter);
  const [incomePathBanner, setIncomePathBanner] = useState(
    navState?.fromIncomePath ? (navState.pathTitle || 'Income Path Jobs') : null
  );

  const [aiInsightsMap, setAiInsightsMap] = useState({});

  // Track whether subscription has finished loading (null = loading, object/false = done)
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);

  // Trigger AI insights load for visible jobs — only after subscription status is known
  useEffect(() => {
    // subscription starts as null; wait until the fetch completes
    if (!subscriptionLoaded) return;
    if (jobs.length === 0) return;

    // Only fetch jobs that don't already have real (non-mock) insights
    const jobsToFetch = jobs.slice(0, 10).filter(j => {
      const existing = aiInsightsMap[j._id];
      return !existing || existing._isMock === true;
    });

    if (jobsToFetch.length === 0) return;

    // Always call backend — it decides paid vs free and returns _isMock: true for free users.
    (async () => {
      for (const j of jobsToFetch) {
        try {
          const res = await providerAPI.getJobAiInsights([{
            _id: j._id || j.id,
            title: j.title,
            skill: j.skill,
            requirements: j.requirements,
            experienceRequired: j.experienceRequired
          }]);
          if (res.data?.success && res.data.data.length > 0) {
            const item = res.data.data[0];
            setAiInsightsMap(prev => ({ ...prev, [item.jobId]: item.insights }));
          }
        } catch (error) {
          console.error("Failed to load AI insight for job:", j._id, error);
        }
      }
    })();
  }, [jobs, subscriptionLoaded]);


  const handleRunAIMatch = async () => {
    if (jobs.length === 0) {
      toast.error("No jobs available to analyze.");
      return;
    }

    // Pass undefined/null for fileHash so backend dynamically pulls from profile/resume
    const fileHash = null;

    // Check local cache first
    const currentJobsHash = jobs.map(j => j._id || j.title).join(',');
    const cachedHash = localStorage.getItem('cachedScrapeJobsHash');
    if (cachedHash && currentJobsHash === cachedHash) {
      const cachedData = localStorage.getItem('cachedAiMatchResults');
      if (cachedData) {
         setAiMatchResults(JSON.parse(cachedData));
         toast.success("AI Analysis Complete!");
         return;
      }
    }

    setIsMatchLoading(true);
    setResumeMissing(false);
    
    try {
      // Backend validates max 100 jobs at a time, so we slice it
      const jobsToAnalyze = jobs.slice(0, 100);
      const res = await getJobMatchingEngine({ fileHash, jobs: jobsToAnalyze });
      if (res.data?.success && res.data?.data?.matched_jobs) {
        setAiMatchResults(res.data.data.matched_jobs);
        
        // Save to cache
        localStorage.setItem('cachedScrapeJobsHash', currentJobsHash);
        localStorage.setItem('cachedAiMatchResults', JSON.stringify(res.data.data.matched_jobs));
        
        toast.success("AI Analysis Complete!");
      } else {
        toast.error("Failed to generate AI match analysis.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during AI analysis.");
    } finally {
      setIsMatchLoading(false);
    }
  };

  const handleRecruiterClick = (id, name) => {
    setRecruiterProfileTarget({ id, name });
  };

  const handleToggleSave = async (job) => {
    try {
      const res = await providerAPI.toggleSaveJob(job._id, !!job.isExternal);
      if (res.data?.isSaved !== undefined) {
        setJobs(prev => prev.map(j => j._id === job._id ? { ...j, isSaved: res.data.isSaved } : j));
        toast.success(res.data.message || (res.data.isSaved ? "Job saved!" : "Job removed from saved jobs."));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle saved job");
    }
  };

  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [radius, setRadius] = useState(50);
  const [userCoords, setUserCoords] = useState(null);

  const toggleNearbyOnly = () => {
    if (nearbyOnly) {
      setNearbyOnly(false);
    } else {
      if (userCoords) {
        setNearbyOnly(true);
      } else {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserCoords(coords);
            setNearbyOnly(true);
            setLoading(false);
          },
          (error) => {
            setLoading(false);
            console.error("Geolocation error:", error);
            toast.error("Location access denied or unavailable. Please enable location permissions in your browser.");
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
  };

  const fetchJobs = useCallback(
    async (page = 1, currentRadius = radius, currentNearbyOnly = nearbyOnly) => {
      setLoading(true);
      try {
        const params = { page, limit: 15 };
        if (currentNearbyOnly && userCoords) {
          params.lat = userCoords.lat;
          params.lng = userCoords.lng;
          params.radius = currentRadius;
          const { data } = await providerAPI.getNearbyJobs(params);
          setJobs(data.jobs || []);
          setPagination(data.pagination || { page: 1, pages: 1, total: (data.jobs || []).length });
        } else {
          if (search.skill) params.skill = search.skill;
          if (search.city) params.city = search.city;
          if (search.origin) params.origin = search.origin;
          if (search.source) params.source = search.source;
          // Apply income path type filters when navigated from Dashboard cards
          if (incomePathFilter?.scheduleType) params.scheduleType = incomePathFilter.scheduleType;
          if (incomePathFilter?.workMode) params.workMode = incomePathFilter.workMode;
          const { data } = await providerAPI.getJobs(params);
          setJobs(data.jobs || []);
          setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        }
      } catch (err) {
        toast.error("Failed to load jobs");
      } finally {
        setLoading(false);
      }
    },
    [search, userCoords, radius, nearbyOnly, incomePathFilter],
  );



  useEffect(() => {
    if (nearbyOnly) {
      if (userCoords) {
        fetchJobs(1, radius, nearbyOnly);
      }
    } else if (incomePathFilter) {
      // Navigated from Dashboard income path card — fetch by scheduleType/workMode
      fetchJobs(1, radius, nearbyOnly);
    } else if (search.skill || search.city) {
      fetchJobs(1, radius, nearbyOnly);
    } else {
      setLoading(true);
      providerAPI
        .getMatches()
        .then((res) => {
          if (res.data?.success) {
            const matchedJobs = res.data.data || [];
            setJobs(matchedJobs);
            setTopMatches(matchedJobs);
            setPagination({ page: 1, pages: 1, total: matchedJobs.length });
          }
        })
        .catch((err) => {
          console.error("Failed to fetch top matches", err);
          fetchJobs(1, radius, nearbyOnly);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [search, fetchJobs, nearbyOnly, userCoords, radius, incomePathFilter]);



  useEffect(() => {
    subscriptionAPI
      .getMySubscription()
      .then((r) => {
        setSubscription(r.data?.subscription || null);
        setSubscriptionLoaded(true);
      })
      .catch(() => {
        setSubscriptionLoaded(true); // even on error, we know there's no plan
      });
  }, []);

  const handleApplySuccess = (jobId) => {
    setApplyTarget(null);
    setJobs((prev) =>
      prev.map((j) => (j._id === jobId ? { ...j, hasApplied: true } : j)),
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch({ 
      skill: filters.skill, 
      city: filters.city, 
      origin: filters.origin, 
      source: filters.source 
    });
    setShowMatchesDropdown(false);
  };

  const clearFilters = () => {
    setFilters({ skill: "", city: "", origin: "all", source: "" });
    setSearch({ skill: "", city: "", origin: "all", source: "" });
  };

  const planName = subscription?.planId?.name || subscription?.plan?.name;
  const applyLimit = subscription?.planId?.jobApplyLimit || subscription?.plan?.jobApplyLimit;
  const remainingApply = subscription?.remainingApplyLimit;

  return (
    <div
      className="min-h-screen bg-gray-50 pb-16 overflow-x-hidden"
      onClick={() => setShowMatchesDropdown(false)}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-10 shadow-inner">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">{t("Explore Opportunities")}</h1>
            <p className="text-emerald-50 text-sm md:text-base opacity-90 max-w-xl">{t(
              "Discover and apply to top jobs perfectly tailored to your skills, experience, and preferences."
            )}</p>
            {planName && (
              <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 text-xs text-white font-medium border border-white/20 shadow-sm">
                <HiSparkles className="w-4 h-4 text-emerald-200" />
                {planName}{t("Plan")}{applyLimit !== -1 && remainingApply !== undefined && (
                  <span className="text-emerald-100/80 ml-1">
                    · {remainingApply}{t("applications remaining")}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1.5 mb-6 w-fit shadow-xs">
          {[
            ["browse", "Browse Jobs"],
            ["applications", "My Applications"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${tab === key ? "bg-emerald-600 text-white shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "browse" && (
          <>
            {/* Income Path Context Banner — shown when arriving from Dashboard income cards */}
            {incomePathBanner && (
              <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100 rounded-xl px-4 py-3 mb-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <HiSparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm text-emerald-800 font-medium">{t("Showing jobs related to:")}<strong>{incomePathBanner}</strong>
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIncomePathBanner(null);
                    setIncomePathFilter(null);
                    setSearch({ skill: "", city: "" });
                    setFilters({ skill: "", city: "" });
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold ml-3 shrink-0 flex items-center gap-1"
                >
                  <HiX className="w-3.5 h-3.5" />{t("Clear filter")}</button>
              </div>
            )}


            {/* Search Bar */}
            <div className="relative">
              <form
                onSubmit={handleSearch}
                className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-col md:flex-row md:flex-wrap gap-3 md:items-end shadow-2xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex-1 w-full relative">
                  <label className="block text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">{t("Skill / Job Title")}<span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 rounded-full border border-emerald-100">{t("AI Enabled")}</span>
                  </label>
                  <div className="relative">
                    <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t("e.g. Plumber, Designer…")}
                      value={filters.skill}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, skill: e.target.value }))
                      }
                      onFocus={() => setShowMatchesDropdown(true)}
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 outline-none"
                    />
                  </div>

                  {/* AI Top Matches Dropdown */}
                  {showMatchesDropdown && topMatches.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 z-50 max-h-[350px] overflow-y-auto animate-fadeInUp">
                      <div className="p-3 border-b border-gray-50 bg-emerald-50/50 sticky top-0">
                        <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <HiSparkles className="w-3.5 h-3.5" />{t("Top Matches Based On Your Profile")}</h4>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {topMatches.map((match) => (
                          <div
                            key={match._id}
                            onClick={() => {
                              navigate(`/provider/job/${match._id}`);
                              setShowMatchesDropdown(false);
                            }}
                            className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <h5 className="font-semibold text-sm text-gray-800">
                              {match.title}
                            </h5>
                            <div className="flex gap-2 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <HiOfficeBuilding className="w-3 h-3" />{" "}
                                {match.companyName || "Company"}
                              </span>
                              <span className="flex items-center gap-1">
                                <HiLocationMarker className="w-3 h-3" />{" "}
                                {match.city}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs text-gray-500 font-medium mb-1">{t("City / Location")}</label>
                  <LocationSearch
                    allowRemote={true}
                    value={filters.city}
                    onChange={(value) =>
                      setFilters((f) => ({ ...f, city: value }))
                    }
                    onSelect={(item) =>
                      setFilters((f) => ({ ...f, city: item?.name || f.city }))
                    }
                    placeholder={t("e.g. Mumbai, Delhi…")}
                    className="focus:ring-emerald-300"
                  />
                </div>
                <div className="flex-1 min-w-[200px] w-full">
                  <label className="block text-xs text-gray-500 font-medium mb-1">{t("Job Source / Type")}</label>
                  <select
                    value={filters.origin}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, origin: e.target.value, source: e.target.value !== "external" ? "" : f.source }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 outline-none h-[38px]"
                  >
                    <option value="all">{t("All Jobs (Internal & Ingested)")}</option>
                    <option value="internal">{t("Direct Jobs (Internal Platform)")}</option>
                    <option value="external">{t("Ingested Jobs (Aggregators & ATS)")}</option>
                  </select>
                </div>

                {filters.origin === "external" && (
                  <div className="flex-1 min-w-[200px] w-full">
                    <label className="block text-xs text-gray-500 font-medium mb-1">{t("Ingestion Source")}</label>
                    <select
                      value={filters.source}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, source: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 outline-none h-[38px]"
                    >
                      <option value="">{t("All Ingestion Sources")}</option>
                      <option value="adzuna">{t("Adzuna")}</option>
                      <option value="jooble">{t("Jooble")}</option>
                      <option value="remoteok">{t("RemoteOK")}</option>
                      <option value="remotive">{t("Remotive")}</option>
                      <option value="arbeitnow">{t("Arbeitnow")}</option>
                      <option value="themuse">{t("The Muse")}</option>
                      <option value="greenhouse">{t("Greenhouse")}</option>
                      <option value="lever">{t("Lever")}</option>
                      <option value="ashby">{t("Ashby")}</option>
                      <option value="smartrecruiters">{t("SmartRecruiters")}</option>
                      <option value="workable">{t("Workable")}</option>
                    </select>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0 items-center">
                  <button
                    type="button"
                    onClick={toggleNearbyOnly}
                    className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold border rounded-xl transition duration-200 flex items-center gap-1.5 ${
                      nearbyOnly
                        ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <HiLocationMarker className={`w-4 h-4 ${nearbyOnly ? "text-white" : "text-gray-400"}`} />
                    {nearbyOnly ? `Nearby` : "Show Nearby"}
                  </button>

                  {nearbyOnly && (
                    <select
                      value={radius}
                      onChange={(e) => handleRadiusChange(Number(e.target.value))}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 outline-none"
                    >
                      <option value={10}>{t("Within 10 km")}</option>
                      <option value={25}>{t("Within 25 km")}</option>
                      <option value={50}>{t("Within 50 km")}</option>
                      <option value={100}>{t("Within 100 km")}</option>
                    </select>
                  )}

                  {(search.skill || search.city || nearbyOnly) && (
                    <button
                      type="button"
                      onClick={() => {
                        clearFilters();
                        setNearbyOnly(false);
                      }}
                      className="flex-1 md:flex-none px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-center"
                    >{t("Clear")}</button>
                  )}
                  <button
                    type="submit"
                    disabled={nearbyOnly}
                    className="flex-1 md:flex-none justify-center px-5 py-2 text-sm font-bold text-white bg-[#081B3A] rounded-xl hover:bg-[#0E2854] transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <HiFilter className="w-4 h-4" />{t("Search")}</button>
                </div>
              </form>
            </div>

            {/* Results */}
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((n) => (
                  <JobCardSkeleton key={n} />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-2xs">
                <HiBriefcase className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium text-gray-600">{t("No jobs found")}</p>
                {nearbyOnly ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm">{t("There are no jobs within")}{radius}{t("km of your location.")}</p>
                    {radius < 100 && (
                      <button
                        onClick={() => handleRadiusChange(100)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                      >{t("Expand Search to 100 km")}</button>
                    )}
                  </div>
                ) : (
                  (search.skill || search.city) && (
                    <p className="text-sm mt-1">{t("Try different keywords or")}{" "}
                      <button
                        onClick={clearFilters}
                        className="text-emerald-600 font-medium"
                      >{t("clear filters")}</button>
                    </p>
                  )
                )}
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-3">
                  {pagination.total}{t("job")}{pagination.total !== 1 ? "s" : ""}{" "}{t("found")}</p>
                <div className="flex flex-col gap-4">
                  {jobs.map((job) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      onViewDetails={() => navigate(`/provider/job/${job._id}`)}
                      onApplyNow={() => setApplyTarget(job)}
                      aiInsights={aiInsightsMap[job._id]}
                      onRecruiterClick={handleRecruiterClick}
                      hasActivePlan={aiInsightsMap[job._id]?._isMock !== true}
                      onToggleSave={handleToggleSave}
                    />
                  ))}
                </div>
                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => fetchJobs(pagination.page - 1)}
                      className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                    >
                      <HiChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="text-sm text-gray-600 font-semibold">{t("Page")}{pagination.page}{t("of")}{pagination.pages}
                    </span>
                    <button
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => fetchJobs(pagination.page + 1)}
                      className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                    >
                      <HiChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )}
                
                {/* Subscription CTA Banner */}
                <div className="mt-8 bg-blue-50/80 rounded-2xl border border-blue-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-50">
                      <span className="text-2xl text-purple-500">👑</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{t("Want to see deeper insights & boost your chances?")}</h4>
                      <p className="text-sm text-gray-600">{t(
                        "Unlock detailed analytics, skill gap reports, and personalized career guidance."
                      )}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Link to="/provider/plans" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-md flex items-center gap-2">{t("Explore Subscription Plans")}<span className="text-sm">👑</span>
                    </Link>
                    <span className="text-[10px] text-gray-500 mt-2 font-medium">{t("Starting at just ₹299/month")}</span>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab === "applications" && (
          <ApplicationsTab onRecruiterClick={handleRecruiterClick} />
        )}
      </div>
      {/* View Details navigates to dedicated page — no modal here */}
      {/* Apply Modal */}
      {applyTarget && (
        <ApplyModal
          job={applyTarget}
          onClose={() => setApplyTarget(null)}
          onSuccess={handleApplySuccess}
        />
      )}
      {/* Recruiter Profile Modal */}
      {recruiterProfileTarget && (
        <RecruiterProfileModal
          recruiterId={recruiterProfileTarget.id}
          companyFallbackName={recruiterProfileTarget.name}
          onClose={() => setRecruiterProfileTarget(null)}
        />
      )}
    </div>
  );
};

export default ProviderJobs;
