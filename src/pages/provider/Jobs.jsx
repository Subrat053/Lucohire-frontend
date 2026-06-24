import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
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
} from "react-icons/hi";
import { FaRupeeSign } from "react-icons/fa";
import toast from "react-hot-toast";
import { providerAPI, subscriptionAPI } from "../../services/api";
import { getJobMatchingEngine } from "../../services/providerAIService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import LocationSearch from "../../components/LocationSearch";
import RecruiterProfileModal from "../../components/recruiter/RecruiterProfileModal";

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
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden transform transition-all">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
            Apply for: {job.title}
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
              <span className="font-bold text-gray-800">Recruiter:</span>{" "}
              {job.companyName || job.recruiter?.name || "Recruiter Company"}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              <span className="font-bold text-gray-800">Skill needed:</span>{" "}
              {job.skill} · {job.city}
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Introduce Yourself / Cover Letter{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={5}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              maxLength={1000}
              placeholder="Describe your qualifications, experience, and why you are the best fit for this role..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none outline-none"
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
            >
              Cancel
            </button>
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
              <HiBriefcase className="w-5 h-5 text-indigo-600 shrink-0 animate-pulse" />
              {job.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Posted {postedAgo} by{" "}
              <span
                onClick={() => {
                  if (job.recruiter?._id) {
                    onRecruiterClick(job.recruiter._id, job.companyName || job.recruiter?.name);
                  }
                }}
                className={`font-semibold text-gray-700 ${
                  job.recruiter?._id ? "cursor-pointer hover:text-indigo-600 hover:underline transition-colors" : ""
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
          {/* Main Info Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/50">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold">
                Budget / Salary
              </span>
              <p className="font-extrabold text-gray-900 flex items-center gap-0.5 text-sm sm:text-base">
                <FaRupeeSign className="w-3.5 h-3.5 text-indigo-600" />
                {budgetText}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold">
                Location
              </span>
              <p className="font-bold text-gray-800 flex items-center gap-1">
                <HiLocationMarker className="w-4 h-4 text-indigo-600" />
                {job.city || "Not specified"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold">
                Job Status
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mt-0.5 w-fit">
                Active Job
              </span>
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 text-sm sm:text-base border-l-4 border-indigo-600 pl-2">
              Job Description
            </h4>
            <p className="text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-100/80 whitespace-pre-line text-xs sm:text-sm">
              {job.description || "No detailed description available."}
            </p>
          </div>

          {/* Requirements & Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-sm border-l-4 border-indigo-600 pl-2">
                Experience Needed
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-100/80 font-medium">
                {job.experienceRequired ||
                  "Experience requirement not specified"}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-sm border-l-4 border-indigo-600 pl-2">
                Primary Skill Category
              </h4>
              <p className="text-xs sm:text-sm text-indigo-700 bg-indigo-50/30 px-4 py-3 rounded-xl border border-indigo-100/50 font-bold">
                {job.skill}
              </p>
            </div>
          </div>

          {/* Other Skills Needed */}
          {job.requirements?.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-sm border-l-4 border-indigo-600 pl-2">
                Required Skills / Credentials
              </h4>
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
              <HiOfficeBuilding className="w-5 h-5 text-gray-400" />
              About The Company
            </h4>
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/80 space-y-2">
              <p
                onClick={() => {
                  if (job.recruiter?._id) {
                    onRecruiterClick(job.recruiter._id, job.companyName || job.recruiter?.name);
                  }
                }}
                className={`text-xs sm:text-sm font-bold text-gray-800 ${
                  job.recruiter?._id ? "cursor-pointer hover:text-indigo-600 hover:underline transition-colors w-fit" : ""
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
          >
            Close details
          </button>
          {job.hasApplied ? (
            <div className="flex-1 py-3 bg-green-50 border border-green-200 text-green-700 font-bold rounded-xl text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 shadow-2xs">
              <HiCheckCircle className="w-4 h-4 animate-bounce" /> Applied
              Successfully
            </div>
          ) : job.isExternal && job.externalUrl ? (
            <a
              href={job.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 transition block text-center"
            >
              Apply Externally
            </a>
          ) : (
            <button
              onClick={() => {
                onApplyNow(job);
              }}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 transition"
            >
              Apply Now
            </button>
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
            <div className="h-5 bg-indigo-50/50 rounded-full w-16"></div>
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

/* ── Job Card ────────────────────────────────────────────────────────── */
const JobCard = ({ job, onViewDetails, onRecruiterClick }) => {
  const budgetText =
    job.budgetType === "negotiable"
      ? "Negotiable"
      : `₹${job.budgetMin?.toLocaleString()} – ₹${job.budgetMax?.toLocaleString()} ${BUDGET_LABELS[job.budgetType] || ""}`.trim();

  const postedAgo = (() => {
    const d = Math.floor((Date.now() - new Date(job.createdAt)) / 86400000);
    return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
  })();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all flex flex-col justify-between h-full">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {job.isExternal && job.externalUrl ? (
                <a
                  href={job.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-extrabold text-indigo-600 text-base truncate hover:text-indigo-800 hover:underline transition-colors flex items-center gap-1"
                >
                  {job.title}
                </a>
              ) : (
                <h3 className="font-bold text-gray-900 text-base truncate">
                  {job.title}
                </h3>
              )}
              {job.hasApplied && (
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                  <HiCheckCircle className="w-3.5 h-3.5" /> Applied
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
              <span
                onClick={(e) => {
                  if (job.recruiter?._id) {
                    e.stopPropagation();
                    onRecruiterClick(job.recruiter._id, job.companyName || job.recruiter?.name);
                  }
                }}
                className={`flex items-center gap-1 ${
                  job.recruiter?._id ? "cursor-pointer hover:text-indigo-600 hover:underline transition-colors" : ""
                }`}
              >
                <HiOfficeBuilding className="w-3.5 h-3.5" />
                {job.companyName || job.recruiter?.name || "Company"}
              </span>
              <span className="flex items-center gap-1">
                <HiLocationMarker className="w-3.5 h-3.5" />
                {job.city} {job.distance !== undefined ? `(${job.distance} km)` : ''}
              </span>
              <span className="flex items-center gap-1">
                <HiClock className="w-3.5 h-3.5" />
                {postedAgo}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-block text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-medium border border-indigo-100">
                {job.skill}
              </span>
              {job.isExternal ? (
                <span className="inline-block text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold border border-amber-200">
                  External Job
                </span>
              ) : (
                <span className="inline-block text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold border border-emerald-200">
                  Internal Job
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-left sm:text-right mt-2 sm:mt-0">
            <p className="text-sm font-bold text-gray-900 flex items-center gap-0.5 sm:justify-end">
              <FaRupeeSign className="w-3 h-3 text-gray-500" />
              {job.budgetType === "negotiable"
                ? "Negotiable"
                : `${job.budgetMin?.toLocaleString()}+`}
            </p>
            <p className="text-xs text-gray-400">
              {BUDGET_LABELS[job.budgetType]}
            </p>
          </div>
        </div>

        {job.description && (
          <p className="text-xs sm:text-sm text-gray-500 mt-3 line-clamp-2 leading-relaxed">
            {job.description}
          </p>
        )}

        {job.requirements?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {job.requirements.slice(0, 3).map((r, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-600 rounded-md border border-gray-100"
              >
                {r}
              </span>
            ))}
            {job.requirements.length > 3 && (
              <span className="text-[10px] text-gray-400">
                +{job.requirements.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <HiDocumentText className="w-3.5 h-3.5" />
          {job.applicants?.length || 0} applicant
          {job.applicants?.length !== 1 ? "s" : ""}
        </p>
        {job.isExternal && job.externalUrl ? (
          <a
            href={job.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-bold text-white bg-[#081B3A] rounded-xl hover:bg-[#0E2854] transition shadow-2xs"
          >
            View External Post
          </a>
        ) : (
          <button
            onClick={() => onViewDetails(job)}
            className="px-4 py-2 text-xs font-bold text-white bg-[#081B3A] rounded-xl hover:bg-[#0E2854] transition shadow-2xs"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Applications Tab ────────────────────────────────────────────────── */
const ApplicationsTab = ({ onRecruiterClick }) => {
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
        <p className="font-medium">No applications yet</p>
        <p className="text-sm mt-1">Browse jobs and apply to get started</p>
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
                    (app.jobPost?.recruiter?._id || app.jobPost?.recruiter) ? "cursor-pointer hover:text-indigo-600 hover:underline transition-colors" : ""
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
                  <HiClock className="w-3.5 h-3.5" />
                  Applied{" "}
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
  const [tab, setTab] = useState("browse"); // 'browse' | 'applications'
  const [jobs, setJobs] = useState([]);
  const [topMatches, setTopMatches] = useState([]);
  const [showMatchesDropdown, setShowMatchesDropdown] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [filters, setFilters] = useState({ skill: "", city: "" });
  const [search, setSearch] = useState({ skill: "", city: "" });
  const [applyTarget, setApplyTarget] = useState(null);
  const [viewDetailTarget, setViewDetailTarget] = useState(null);
  const [recruiterProfileTarget, setRecruiterProfileTarget] = useState(null);

  const [aiMatchResults, setAiMatchResults] = useState(null);
  const [isMatchLoading, setIsMatchLoading] = useState(false);
  const [resumeMissing, setResumeMissing] = useState(false);

  const handleRunAIMatch = async () => {
    const fileHash = localStorage.getItem('lastResumeHash');
    if (!fileHash) {
      setResumeMissing(true);
      toast.error("Please upload your resume in the Grow with AI tab first!");
      return;
    }

    if (jobs.length === 0) {
      toast.error("No jobs available to analyze.");
      return;
    }

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
      const res = await getJobMatchingEngine({ fileHash, jobs });
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
    [search, userCoords, radius, nearbyOnly],
  );

  const [scraping, setScraping] = useState(false);

  const handleScrapeMatches = async () => {
    try {
      // Remove response from UI while refreshing
      setAiMatchResults(null);
      setScraping(true);
      setLoading(true);
      
      const res = await providerAPI.scrapeMatches();
      if (res.data?.success) {
        toast.success("Successfully fetched new matches!");
        const matchedJobs = res.data.data || [];
        setJobs(matchedJobs);
        setTopMatches(matchedJobs);
        setPagination({ page: 1, pages: 1, total: matchedJobs.length });
      }
    } catch (error) {
      toast.error("Failed to scrape new matches.");
    } finally {
      setScraping(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (nearbyOnly) {
      if (userCoords) {
        fetchJobs(1, radius, nearbyOnly);
      }
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
  }, [search, fetchJobs, nearbyOnly, userCoords, radius]);

  // Run a fresh scrape automatically on page load in the background
  useEffect(() => {
    providerAPI
      .scrapeMatches()
      .then((res) => {
        if (res.data?.success && !search.skill && !search.city) {
          const matchedJobs = res.data.data || [];
          setJobs(matchedJobs);
          setTopMatches(matchedJobs);
          setPagination({ page: 1, pages: 1, total: matchedJobs.length });
        }
      })
      .catch((err) => console.error("Auto-scrape failed", err));
  }, []);

  useEffect(() => {
    subscriptionAPI
      .getMySubscription()
      .then((r) => setSubscription(r.data))
      .catch(() => {});
  }, []);

  const handleApplySuccess = (jobId) => {
    setApplyTarget(null);
    setViewDetailTarget(null);
    setJobs((prev) =>
      prev.map((j) => (j._id === jobId ? { ...j, hasApplied: true } : j)),
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch({ skill: filters.skill, city: filters.city });
    setShowMatchesDropdown(false);
  };

  const clearFilters = () => {
    setFilters({ skill: "", city: "" });
    setSearch({ skill: "", city: "" });
  };

  const planName = subscription?.plan?.name;
  const applyLimit = subscription?.plan?.jobApplyLimit;
  const remainingApply = subscription?.remainingApplyLimit;

  return (
    <div
      className="min-h-screen bg-gray-50 pb-16 overflow-x-hidden"
      onClick={() => setShowMatchesDropdown(false)}
    >
      {/* Header */}
      <div className="bg-blue-900 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white mb-1">
              Find Recruiters
            </h1>
            <p className="text-indigo-100 text-sm">
              Browse job openings from recruiters looking for your skills
            </p>
            {planName && (
              <div className="mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white font-medium">
                <HiSparkles className="w-3.5 h-3.5" />
                {planName} Plan
                {applyLimit !== -1 && remainingApply !== undefined && (
                  <span className="text-indigo-100">
                    · {remainingApply} applications remaining
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleScrapeMatches}
            disabled={scraping}
            className="rounded-full bg-[linear-gradient(180deg,#67e8f9_0%,#3b82f6_45%,#a855f7_100%)] bg-size-[100%_200%] animate-[gradient_5s_ease_infinite] px-6 py-3 text-white font-semibold border border-cyan-300/30 shadow-[0_0_20px_rgba(34,211,238,0.45),0_0_40px_rgba(168,85,247,0.35)] hover:shadow-[0_0_30px_rgba(34,211,238,0.7),0_0_60px_rgba(168,85,247,0.55)] hover:scale-[1.03] hover:brightness-110 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <HiSparkles
              className={`w-5 h-5 ${scraping ? "animate-spin text-indigo-500" : "text-indigo-600"}`}
            />
            {scraping ? "Scraping..." : "Refresh with AI Scraper"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-xl border border-gray-100 p-1 mb-6 w-fit shadow-xs">
          {[
            ["browse", "Browse Jobs"],
            ["applications", "My Applications"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? "bg-sky-500 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "browse" && (
          <>
            {/* AI Job Matching Engine Panel */}
            <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-6 mb-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <HiSparkles className="w-24 h-24 text-indigo-500" />
              </div>
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                      <HiSparkles className="w-6 h-6 text-indigo-600" />
                      AI Job Matching Engine
                    </h2>
                    <p className="text-sm text-indigo-700 mt-1">
                      Let our AI analyze your uploaded resume against the top jobs to find your perfect fit and growth potential.
                    </p>
                  </div>
                  <button
                    onClick={handleRunAIMatch}
                    disabled={isMatchLoading || jobs.length === 0}
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {isMatchLoading ? (
                      <>
                        <HiSparkles className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <HiSparkles className="w-5 h-5" />
                        Run AI Match
                      </>
                    )}
                  </button>
                </div>

                {resumeMissing && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-start gap-2">
                    <HiExclamationCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <strong>Missing Resume:</strong> We couldn't find your resume data. Please go to the 
                      <Link to="/provider/grow-with-ai" className="font-bold underline ml-1 hover:text-amber-900">Grow with AI</Link> 
                      {" "}tab to upload or update your resume first.
                    </div>
                  </div>
                )}

                {aiMatchResults && aiMatchResults.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-bold text-gray-800 mb-2">Analysis Results for Top Jobs:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiMatchResults.map((match, idx) => {
                        const jobData = jobs.find(j => j._id === match.job_id || j.title === match.job_id) || jobs[idx];
                        if (!jobData) return null;
                        
                        return (
                          <div key={idx} className="bg-white rounded-xl p-4 border border-indigo-50 shadow-sm flex flex-col h-full">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-gray-900 truncate pr-2">{jobData.title}</h4>
                              <div className="flex flex-col items-end">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${match.match_score >= 80 ? 'bg-green-100 text-green-700' : match.match_score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                  {match.match_score}% Match
                                </span>
                                <span className="text-[10px] text-gray-500 font-medium mt-1 uppercase">Priority: {match.apply_priority}</span>
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-600 space-y-2 flex-1">
                              <p><strong className="text-gray-800">Fit Reason:</strong> {match.fit_reason}</p>
                              {match.missing_skills?.length > 0 && (
                                <div>
                                  <strong className="text-gray-800">Missing Skills:</strong>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {match.missing_skills.map((skill, sIdx) => (
                                      <span key={sIdx} className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] border border-red-100">{skill}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <p><strong className="text-indigo-800">Growth:</strong> {match.growth_potential}</p>
                            </div>
                            
                            <button
                              onClick={() => setViewDetailTarget(jobData)}
                              className="mt-3 w-full py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                            >
                              View Job Details
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <form
                onSubmit={handleSearch}
                className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-col md:flex-row md:flex-wrap gap-3 md:items-end shadow-2xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex-1 w-full relative">
                  <label className="block text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                    Skill / Job Title
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 rounded-full border border-indigo-100">
                      AI Enabled
                    </span>
                  </label>
                  <div className="relative">
                    <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. Plumber, Designer…"
                      value={filters.skill}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, skill: e.target.value }))
                      }
                      onFocus={() => setShowMatchesDropdown(true)}
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                  </div>

                  {/* AI Top Matches Dropdown */}
                  {showMatchesDropdown && topMatches.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 z-50 max-h-[350px] overflow-y-auto animate-fadeInUp">
                      <div className="p-3 border-b border-gray-50 bg-indigo-50/50 sticky top-0">
                        <h4 className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                          <HiSparkles className="w-3.5 h-3.5" />
                          Top Matches Based On Your Profile
                        </h4>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {topMatches.map((match) => (
                          <div
                            key={match._id}
                            onClick={() => {
                              setViewDetailTarget(match);
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
                  <label className="block text-xs text-gray-500 font-medium mb-1">
                    City / Location
                  </label>
                  <LocationSearch
                    value={filters.city}
                    onChange={(value) =>
                      setFilters((f) => ({ ...f, city: value }))
                    }
                    onSelect={(item) =>
                      setFilters((f) => ({ ...f, city: item?.name || f.city }))
                    }
                    placeholder="e.g. Mumbai, Delhi…"
                    className="focus:ring-indigo-300"
                  />
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0 items-center">
                  <button
                    type="button"
                    onClick={toggleNearbyOnly}
                    className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold border rounded-xl transition duration-200 flex items-center gap-1.5 ${
                      nearbyOnly
                        ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-md"
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
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 outline-none"
                    >
                      <option value={10}>Within 10 km</option>
                      <option value={25}>Within 25 km</option>
                      <option value={50}>Within 50 km</option>
                      <option value={100}>Within 100 km</option>
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
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={nearbyOnly}
                    className="flex-1 md:flex-none justify-center px-5 py-2 text-sm font-bold text-white bg-[#081B3A] rounded-xl hover:bg-[#0E2854] transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <HiFilter className="w-4 h-4" /> Search
                  </button>
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
                <p className="font-medium text-gray-600">No jobs found</p>
                {nearbyOnly ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm">There are no jobs within {radius} km of your location.</p>
                    {radius < 100 && (
                      <button
                        onClick={() => handleRadiusChange(100)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                      >
                        Expand Search to 100 km
                      </button>
                    )}
                  </div>
                ) : (
                  (search.skill || search.city) && (
                    <p className="text-sm mt-1">
                      Try different keywords or{" "}
                      <button
                        onClick={clearFilters}
                        className="text-indigo-600 font-medium"
                      >
                        clear filters
                      </button>
                    </p>
                  )
                )}
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-3">
                  {pagination.total} job{pagination.total !== 1 ? "s" : ""}{" "}
                  found
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {jobs.map((job) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      onViewDetails={setViewDetailTarget}
                      onRecruiterClick={handleRecruiterClick}
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
                    <span className="text-sm text-gray-600 font-semibold">
                      Page {pagination.page} of {pagination.pages}
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
              </>
            )}
          </>
        )}

        {tab === "applications" && (
          <ApplicationsTab onRecruiterClick={handleRecruiterClick} />
        )}
      </div>

      {/* View Details Modal */}
      {viewDetailTarget && (
        <JobDetailsModal
          job={viewDetailTarget}
          onClose={() => setViewDetailTarget(null)}
          onApplyNow={(job) => setApplyTarget(job)}
          onRecruiterClick={handleRecruiterClick}
        />
      )}

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
