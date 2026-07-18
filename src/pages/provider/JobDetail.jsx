import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  HiArrowLeft,
  HiArrowRight,
  HiLocationMarker,
  HiCurrencyRupee,
  HiBriefcase,
  HiClock,
  HiUsers,
  HiCheckCircle,
  HiBookmark,
  HiShare,
  HiExternalLink,
  HiSparkles,
  HiLockClosed,
  HiOfficeBuilding,
  HiShieldCheck,
  HiExclamationCircle,
  HiOutlineMail,
  HiPhone,
  HiX,
  HiChevronRight,
  HiChevronDown,
  HiOutlineBookmark,
} from "react-icons/hi";
import { FaWhatsapp, FaLinkedin, FaTwitter } from "react-icons/fa";
import { providerAPI, subscriptionAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";

const BUDGET_LABELS = { fixed: "Fixed", hourly: "/hr", monthly: "/mo", negotiable: "Negotiable" };

/* ── Apply Modal ─────────────────────────────────────────────────────────── */
const ApplyModal = ({ job, onClose, onSuccess }) => {
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await providerAPI.applyToJob(job._id, { coverLetter });
      toast.success("Application submitted successfully!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900">Apply for: {job.title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-xl transition text-gray-500">
            <HiX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Introduce Yourself / Cover Letter <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={5}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              maxLength={1000}
              placeholder="Describe your qualifications and why you're the best fit..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
            />
            <p className="text-right text-[10px] text-gray-400">{coverLetter.length}/1000</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition">
              {loading ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [saved, setSaved] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [jobRes, subRes] = await Promise.allSettled([
          providerAPI.getJobById(jobId),
          subscriptionAPI.getMySubscription(),
        ]);

        const jobData = jobRes.status === "fulfilled" ? jobRes.value.data?.job || jobRes.value.data : null;
        if (!jobData) { toast.error("Job not found"); navigate(-1); return; }
        setJob(jobData);
        setHasApplied(!!jobData.hasApplied);

        const sub = subRes.status === "fulfilled" ? subRes.value.data?.subscription : null;
        setSubscription(sub);

        // Always call backend — it checks ProviderSubscription and returns _isMock: true for free users
        try {
          const insRes = await providerAPI.getJobAiInsights([{
            _id: jobData._id,
            title: jobData.title,
            skill: jobData.skill,
            requirements: jobData.requirements,
            experienceRequired: jobData.experienceRequired,
          }]);
          if (insRes.data?.success && insRes.data.data.length > 0) {
            setAiInsights(insRes.data.data[0].insights);
          }
        } catch {/* silently fail */}
        // Fetch Similar Jobs
        try {
          const matchRes = await providerAPI.getMatches();
          if (matchRes.data?.success && matchRes.data.data) {
            setSimilarJobs(matchRes.data.data.filter(j => j._id !== jobId).slice(0, 4));
          }
        } catch { /* silently fail */ }

      } catch {
        toast.error("Failed to load job details");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [jobId, navigate]);

  // hasActivePlan is derived from backend response — _isMock: true means free user
  const hasActivePlan = !aiInsights?._isMock;

  const handleSave = useCallback(async () => {
    try {
      await providerAPI.toggleSaveJob({ jobId: job._id });
      setSaved(s => !s);
    } catch { toast.error("Could not save job"); }
  }, [job]);

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out this job: ${job?.title}`;
    const links = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      copy: null,
    };
    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } else {
      window.open(links[platform], "_blank");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner />
    </div>
  );

  if (!job) return null;

  const budgetText = job.budgetType === "negotiable"
    ? "Negotiable"
    : `₹${job.budgetMin?.toLocaleString()} – ₹${job.budgetMax?.toLocaleString()} ${BUDGET_LABELS[job.budgetType] || ""}`.trim();

  const postedAgo = (() => {
    const d = Math.floor((Date.now() - new Date(job.createdAt)) / 86400000);
    return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
  })();

  const matchScore = aiInsights?.matchScore || 0;

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Back bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition">
            <HiArrowLeft className="w-4 h-4" /> Back to Jobs
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <button className="p-1.5 hover:bg-gray-100 rounded-lg"><HiArrowLeft className="w-4 h-4" /></button>
            Previous
            <span className="mx-1 text-gray-200">|</span>
            Next
            <button className="p-1.5 hover:bg-gray-100 rounded-lg"><HiArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        {/* ── Left Column ── */}
        <div className="space-y-5">

          {/* ── AI Match Banner ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-col xl:flex-row items-center gap-8">
              {/* Score */}
              <div className="flex flex-col items-center justify-center min-w-[120px]">
                <p className="text-[10px] font-bold text-gray-500 mb-2 tracking-wide uppercase">AI Match Score</p>
                <div className="relative w-[100px] h-[100px] mb-2">
                  <svg className="w-[100px] h-[100px] -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={matchScore >= 80 ? "#10b981" : "#f59e0b"}
                      strokeWidth="3.5"
                      strokeDasharray={`${matchScore} ${100 - matchScore}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-extrabold text-3xl text-gray-900 tracking-tighter">{matchScore}%</span>
                  </div>
                </div>
                <span className={`text-[13px] font-bold ${matchScore >= 80 ? "text-emerald-600" : "text-yellow-600"}`}>
                  {matchScore >= 80 ? "Excellent Match" : matchScore >= 60 ? "Good Match" : "Fair Match"}
                </span>
                <div className="flex gap-1 mt-1">
                  {[1,2,3,4,5].map(s => <span key={s} className={`text-xs ${s <= Math.round(matchScore/20) ? "text-emerald-500" : "text-gray-200"}`}>★</span>)}
                </div>
              </div>

              {/* Why this job is great for you — AI Report */}
              <div className="flex-1 min-w-0 xl:border-l border-gray-100 xl:pl-8">
                <h3 className="font-bold text-gray-900 text-[15px] mb-3">Why this job is a great match for you</h3>

                {/* Checklist bullets */}
                <ul className="space-y-2.5 mb-4">
                  {(hasActivePlan
                    ? (aiInsights?.whyMatch || [])
                    : [
                        "Your Figma skills match 90% of job requirements",
                        "Strong match on UX Research & User Testing",
                        "Your portfolio aligns with company needs",
                      ]
                  ).slice(0,3).map((point, i) => (
                    <li key={i} className={`flex items-start gap-2.5 text-[13px] text-gray-700 font-medium ${!hasActivePlan && i > 0 ? "blur-md opacity-50 select-none" : ""}`}>
                      <HiCheckCircle className="w-[18px] h-[18px] text-emerald-500 shrink-0" />
                      {point}
                    </li>
                  ))}

                  {/* Improvement tip */}
                  <li className={`flex items-start gap-2.5 text-[13px] font-medium text-amber-700 ${!hasActivePlan ? "blur-md opacity-50 select-none" : ""}`}>
                    <HiArrowRight className="w-[18px] h-[18px] text-amber-500 -rotate-45 shrink-0" />
                    <span>
                      {hasActivePlan
                        ? (aiInsights?.improve || "Improve Design Systems skills to increase match to 97%")
                        : "Improve Design Systems skills to increase match to 97%"}
                    </span>
                  </li>
                </ul>

                <button className="text-[13px] font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition flex items-center gap-1.5">
                  View AI Match Report {!hasActivePlan && <HiLockClosed className="w-3 h-3" />}
                </button>
              </div>

              {/* Right Metrics */}
              <div className="w-full xl:w-[200px] shrink-0 xl:border-l border-gray-100 xl:pl-8 space-y-4 pt-4 xl:pt-0 border-t xl:border-t-0">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <HiBriefcase className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-extrabold text-lg text-gray-900 leading-none">23</p>
                    <p className="text-[11px] font-medium text-gray-500 mt-1 leading-tight">Similar jobs found</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <HiUsers className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-extrabold text-lg text-gray-900 leading-none">18</p>
                    <p className="text-[11px] font-medium text-gray-500 mt-1 leading-tight">Recruiters viewed candidates like you</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <HiClock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-bold text-[13px] text-gray-900 leading-tight">Updated</p>
                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">Today, 9:30 AM</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Company Header ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-0 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-[60px] h-[60px] rounded-[16px] border border-gray-100 flex flex-col items-center justify-center shadow-sm bg-white overflow-hidden shrink-0">
                    {job.companyLogo ? (
                      <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-extrabold text-2xl text-gray-900 tracking-tighter capitalize">
                        {job.companyName?.substring(0,1) || "C"}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-extrabold text-gray-900 text-lg">{job.companyName || job.recruiter?.name || "Company"}</span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                        <HiCheckCircle className="w-3 h-3" /> Verified
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                      <span className="text-yellow-400">★</span>
                      <span className="font-bold text-gray-700">4.6</span>
                      <span>(12.4K reviews)</span>
                      <span className="mx-1 text-gray-300">|</span>
                      <button className="text-blue-600 font-bold hover:underline flex items-center gap-1">View Company <HiArrowRight className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleShare("copy")} className="flex items-center gap-1.5 text-[13px] font-bold text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-xl transition">
                    <HiShare className="w-4 h-4" /> Share
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 transition tracking-widest font-bold">•••</button>
                </div>
              </div>

              {/* Title */}
              <div className="mt-6">
                <h1 className="font-extrabold text-3xl text-gray-900">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-[13px] font-medium text-gray-500">
                  <span className="flex items-center gap-1.5"><HiLocationMarker className="w-4 h-4 text-gray-400" /> {job.city || "Location not specified"} {job.workMode && `(${job.workMode})`}</span>
                  <span className="flex items-center gap-1.5"><HiClock className="w-4 h-4 text-gray-400" /> {job.jobType || "Full-time"}</span>
                  <span className="flex items-center gap-1.5"><HiCurrencyRupee className="w-4 h-4 text-gray-400" /> {budgetText}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-[12px] font-medium text-gray-400">
                  <span className="flex items-center gap-1.5"><HiOutlineBookmark className="w-4 h-4" /> Posted {postedAgo}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="flex items-center gap-1.5 text-gray-500 font-bold"><HiUsers className="w-4 h-4" /> 1,248 applicants</span>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mt-5">
                  {job.skill && <span className="text-[12px] px-4 py-1.5 bg-gray-50 text-gray-600 rounded-full font-bold border border-gray-100">{job.skill}</span>}
                  {job.requirements?.slice(0, 4).map((r, i) => (
                    <span key={i} className="text-[12px] px-4 py-1.5 bg-gray-50 text-gray-600 rounded-full font-bold border border-gray-100">{r}</span>
                  ))}
                  {job.requirements?.length > 4 && (
                    <span className="text-[12px] px-4 py-1.5 bg-gray-50 text-gray-600 rounded-full font-bold border border-gray-100">+{job.requirements.length - 4}</span>
                  )}
                </div>
                
                {/* Save button and info row */}
                <div className="flex items-center justify-between border-t border-gray-100 mt-6 pt-5">
                  <button
                    onClick={() => handleSave()}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition ${saved ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                  >
                    <HiBookmark className="w-[18px] h-[18px]" /> {saved ? "Saved" : "Save"}
                  </button>
                  <div className="flex flex-col items-end gap-1">
                    <span className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500"><HiClock className="w-3.5 h-3.5 text-emerald-500" /> Apply takes less than 2 minutes</span>
                    <span className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500"><HiCheckCircle className="w-3.5 h-3.5 text-emerald-500" /> No cover letter required</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-gray-100 flex items-center gap-8 px-6 pt-1">
              {['Overview', 'About Company', 'Reviews (1.2K)', 'Team', 'FAQs'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-[13px] font-bold border-b-2 transition-colors ${activeTab === tab ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab Content ── */}
          {activeTab === 'Overview' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-7">
              {/* Overview */}
              <section>
                <h2 className="font-extrabold text-[15px] text-gray-900 flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <HiOfficeBuilding className="w-4 h-4 text-emerald-600" />
                  </div>
                  Overview
                </h2>
                {job.description ? (
                  <div
                    className="text-[14px] text-gray-600 leading-relaxed prose prose-sm max-w-none px-1"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />
                ) : (
                  <p className="text-[14px] text-gray-600 leading-relaxed px-1">
                    We are looking for a passionate professional who can deliver exceptional results. You will work with cross-functional teams to design, build, and ship impactful solutions.
                  </p>
                )}
                <button className="text-emerald-600 font-bold text-[13px] flex items-center gap-1 mt-2 px-1 hover:underline">Show more <HiChevronDown className="w-4 h-4" /></button>
              </section>

              {/* Key Responsibilities */}
              <section className="border-t border-gray-100 pt-5">
                <button className="w-full flex items-center justify-between font-extrabold text-[15px] text-gray-900">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <HiCheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    Key Responsibilities
                  </div>
                  <HiChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <p className="text-[13px] text-gray-600 mt-2 px-10">Design interfaces, conduct research, create prototypes, collaborate with teams and iterate.</p>
              </section>

              {/* Requirements */}
              <section className="border-t border-gray-100 pt-5">
                <button className="w-full flex items-center justify-between font-extrabold text-[15px] text-gray-900">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                      <HiBriefcase className="w-4 h-4 text-purple-600" />
                    </div>
                    Requirements
                  </div>
                  <HiChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                {job.requirements?.length > 0 ? (
                  <p className="text-[13px] text-gray-600 mt-2 px-10">{job.requirements.join(", ")} & more.</p>
                ) : (
                  <p className="text-[13px] text-gray-600 mt-2 px-10">2-5 years experience in related field, strong portfolio & more.</p>
                )}
              </section>

              {/* Benefits & Perks */}
              <section className="border-t border-gray-100 pt-5">
                <button className="w-full flex items-center justify-between font-extrabold text-[15px] text-gray-900">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <HiSparkles className="w-4 h-4 text-emerald-600" />
                    </div>
                    Benefits & Perks
                  </div>
                  <HiChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <p className="text-[13px] text-gray-600 mt-2 px-10">Health insurance, flexible work, learning budget, wellness programs & more.</p>
              </section>

              {/* About the Team */}
              <section className="border-t border-gray-100 pt-5">
                <button className="w-full flex items-center justify-between font-extrabold text-[15px] text-gray-900">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <HiUsers className="w-4 h-4 text-indigo-600" />
                    </div>
                    About the Team
                  </div>
                  <HiChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <p className="text-[13px] text-gray-600 mt-2 px-10">Work with world-class designers and engineers building products that impact billions.</p>
              </section>
            </div>
          )}

          {activeTab !== 'Overview' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <HiOutlineBookmark className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-extrabold text-lg text-gray-900">{activeTab}</h3>
              <p className="text-gray-500 text-[13px] mt-2 max-w-sm">Detailed information for {activeTab.toLowerCase()} is not available for this job at the moment.</p>
            </div>
          )}


          {/* ── Similar Jobs for You ── */}
          <div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <h2 className="font-extrabold text-[15px] text-gray-900">Similar Jobs for You</h2>
              <button className="text-[12px] font-bold text-emerald-600 hover:underline flex items-center gap-1">View all <HiArrowRight className="w-3 h-3" /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {similarJobs.length > 0 ? (
                similarJobs.map((sJob, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => navigate(`/provider/job/${sJob._id}`)}>
                     <div className="flex items-start gap-3 mb-3">
                       <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                         {sJob.companyLogo ? <img src={sJob.companyLogo} className="w-full h-full object-cover" /> : <span className="font-bold text-gray-600">{sJob.companyName?.substring(0,1) || "C"}</span>}
                       </div>
                       <div>
                         <p className="font-extrabold text-[13px] text-gray-900 line-clamp-1">{sJob.title}</p>
                         <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1">{sJob.companyName || "Company"} <HiCheckCircle className="w-3 h-3 text-blue-500" /></p>
                       </div>
                     </div>
                     <div className="space-y-1.5 mb-4">
                        <p className="text-[11px] text-gray-500 flex items-center gap-1.5"><HiLocationMarker className="w-3.5 h-3.5 text-gray-400" /> {sJob.city || "Remote"}</p>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1.5"><HiCurrencyRupee className="w-3.5 h-3.5 text-gray-400" /> {sJob.budgetMax ? `₹${sJob.budgetMin/100000} - ${sJob.budgetMax/100000} LPA` : "Negotiable"}</p>
                     </div>
                     <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <span className="text-[11px] font-bold text-emerald-600">{sJob.matchScore || 80}% Match</span>
                        <HiOutlineBookmark className="w-4 h-4 text-gray-400" />
                     </div>
                  </div>
                ))
              ) : (
                [1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between h-[160px]">
                     <div className="animate-pulse flex gap-3">
                       <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
                       <div className="flex-1 space-y-2 py-1">
                         <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                         <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                       </div>
                     </div>
                     <div className="animate-pulse space-y-2 mt-4">
                       <div className="h-2 bg-gray-100 rounded w-2/3"></div>
                       <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ── Right Column ── */}
        <div className="space-y-4">

          {/* ── AI Summary ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-[15px] text-gray-900">AI Summary</h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full flex items-center gap-1"><HiSparkles className="w-3 h-3" /> AI</span>
            </div>
            <p className={`text-[13px] font-medium text-gray-600 leading-relaxed mb-4 ${!hasActivePlan ? "blur-md opacity-50 select-none" : ""}`}>
              You're a strong match for this role. Here's why:
            </p>
            <ul className="space-y-2 mb-5">
              {(hasActivePlan ? (aiInsights?.whyMatch || ["Strong skill alignment"]) : ["Figma skills match 90%", "UX Research experience", "Strong portfolio alignment"]).slice(0, 3).map((pt, i) => (
                <li key={i} className={`flex items-start gap-2.5 text-[13px] font-medium text-gray-700 ${!hasActivePlan ? "blur-md opacity-50 select-none" : ""}`}>
                  <HiCheckCircle className="w-[18px] h-[18px] text-emerald-500 shrink-0" />
                  {pt}
                </li>
              ))}
              <li className={`flex items-start gap-2.5 text-[13px] font-medium text-amber-700 ${!hasActivePlan ? "blur-md opacity-50 select-none" : ""}`}>
                <HiArrowRight className="w-[18px] h-[18px] text-amber-500 -rotate-45 shrink-0" />
                {hasActivePlan ? (aiInsights?.improve || "Improve your missing skills to increase match score") : "Improve Design Systems to increase match to 97%"}
              </li>
            </ul>
            <button className="w-full text-[13px] font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5">
              View Full AI Analysis {!hasActivePlan && <HiLockClosed className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* About the Company */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-extrabold text-[15px] text-gray-900 mb-4">About the Company</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-[52px] h-[52px] rounded-xl bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center overflow-hidden shrink-0">
                {job.companyLogo ? (
                   <img src={job.companyLogo} className="w-full h-full object-cover" />
                ) : (
                   <span className="font-extrabold text-[18px] text-gray-900 capitalize">{job.companyName?.substring(0,1) || "C"}</span>
                )}
              </div>
              <div>
                <p className="font-extrabold text-[15px] text-gray-900 mb-0.5">{job.companyName || job.recruiter?.name || "Company"}</p>
                <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1"><span className="text-yellow-400">★</span> 4.6 (12.4K reviews)</p>
              </div>
            </div>
            <p className="text-[13px] font-medium text-gray-600 leading-relaxed mb-4">
              {job.companyInfo || "A leading company providing exceptional services and opportunities across multiple sectors. Join us to build impactful solutions at scale."}
            </p>
            <div className="space-y-2.5 text-[12px] font-medium text-gray-600 mb-4">
              <div className="flex items-center gap-2.5"><HiOfficeBuilding className="w-[18px] h-[18px] text-gray-400" /> <div><p className="text-[10px] text-gray-400 leading-none">Industry</p><p className="font-bold text-gray-700">IT Services & Consulting</p></div></div>
              <div className="flex items-center gap-2.5"><HiUsers className="w-[18px] h-[18px] text-gray-400" /> <div><p className="text-[10px] text-gray-400 leading-none">Company Size</p><p className="font-bold text-gray-700">10,001+ employees</p></div></div>
              <div className="flex items-center gap-2.5"><HiLocationMarker className="w-[18px] h-[18px] text-gray-400" /> <div><p className="text-[10px] text-gray-400 leading-none">Headquarters</p><p className="font-bold text-gray-700">{job.city || "India"}</p></div></div>
            </div>
            <button className="text-[12px] font-bold text-emerald-600 hover:underline flex items-center gap-1">View company profile <HiArrowRight className="w-3 h-3" /></button>
          </div>

          {/* ── AI Insights for You (Sidebar) ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex flex-col mb-4 gap-2">
              <h2 className="font-extrabold text-[15px] text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center">
                  <span className="text-orange-500 text-[10px]">🎯</span>
                </div>
                AI Insights for You
              </h2>
              <div className="flex gap-2">
                {hasActivePlan ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full flex items-center gap-1 w-fit"><HiSparkles className="w-3 h-3" /> Premium</span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full flex items-center gap-1 w-fit"><HiLockClosed className="w-3 h-3" /> Premium</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Why Great Match */}
              <div className="col-span-2 bg-[#f8fafc] rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center">
                    <HiSparkles className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <p className="text-[11px] font-bold text-gray-900">Why this job is a great match</p>
                </div>
                <p className={`text-[11px] text-gray-600 leading-relaxed font-medium ${!hasActivePlan ? "blur-md opacity-50 select-none" : ""}`}>
                  {hasActivePlan ? (aiInsights?.whyMatch?.[0] || "Your skills align with this role") : "Your UI/UX skills, Figma experience and portfolio strongly match this role."}
                </p>
              </div>

              {/* Skills You Have */}
              <div className="bg-[#f8fafc] rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-900 mb-2 line-clamp-1">Skills you have</p>
                <ul className={`space-y-1 ${!hasActivePlan ? "blur-md opacity-50 select-none" : ""}`}>
                  {(hasActivePlan ? (aiInsights?.matchedSkills || [job.skill, ...(job.requirements?.slice(0,2) || [])]) : ["UI/UX Design", "Figma", "User Research"]).filter(Boolean).slice(0,2).map((s, i) => (
                    <li key={i} className="text-[10px] font-medium text-gray-600 flex items-center gap-1">
                      <HiCheckCircle className="w-3 h-3 text-emerald-500 shrink-0" /><span className="truncate">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Skills to Improve */}
              <div className="bg-[#f8fafc] rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-900 mb-2 line-clamp-1">Skills to improve</p>
                <ul className={`space-y-1 ${!hasActivePlan ? "blur-md opacity-50 select-none" : ""}`}>
                  {(hasActivePlan ? (aiInsights?.missingSkills || []) : ["Design Systems", "Prototyping"]).slice(0,2).map((s, i) => (
                    <li key={i} className="text-[10px] font-medium text-gray-600 flex items-center gap-1">
                      <HiCheckCircle className="w-3 h-3 text-orange-400 shrink-0" /><span className="truncate">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Interview Chance */}
              <div className="col-span-2 bg-[#f8fafc] rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-gray-900 mb-1">Interview chance</p>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">Good Chance <HiLockClosed className="w-3 h-3 text-gray-400" /></span>
                </div>
                <div className="relative w-[46px] h-[46px]">
                  <svg className="w-[46px] h-[46px] -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke="#10b981"
                      strokeWidth="4"
                      strokeDasharray={`${hasActivePlan ? (aiInsights?.interviewProbability || 65) : 78} ${100 - (hasActivePlan ? (aiInsights?.interviewProbability || 65) : 78)}`}
                      strokeLinecap="round"
                      className={!hasActivePlan ? "blur-md opacity-50" : ""}
                    />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-gray-900 tracking-tighter ${!hasActivePlan ? "blur-md opacity-50" : ""}`}>
                    {hasActivePlan ? `${aiInsights?.interviewProbability || 65}%` : "78%"}
                  </span>
                </div>
              </div>

              {/* Salary Insight */}
              <div className="col-span-2 bg-[#f8fafc] rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 mb-0.5">Salary insight</p>
                  <p className={`text-[13px] font-extrabold text-gray-900 ${!hasActivePlan ? "blur-md opacity-50 select-none" : ""}`}>
                    {hasActivePlan ? (aiInsights?.salaryInsight || budgetText) : "₹14 – 18 LPA"}
                  </p>
                </div>
                {!hasActivePlan ? (
                  <Link to="/provider/my-plan" className="text-[10px] font-bold text-blue-600 hover:underline">
                    Unlock <HiLockClosed className="inline w-3 h-3" />
                  </Link>
                ) : (
                  <p className="text-[9px] text-gray-500 font-medium">Avg. for your profile</p>
                )}
              </div>
            </div>
            
            <button className="w-full mt-4 text-[12px] font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 py-2 rounded-xl transition flex items-center justify-center gap-1.5">
              View Full Report {!hasActivePlan && <HiLockClosed className="w-3.5 h-3.5" />}
            </button>
          </div>


          {/* Share this job */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h3 className="font-bold text-sm text-gray-900 mb-3">Share this job</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => handleShare("whatsapp")} className="w-9 h-9 flex items-center justify-center bg-green-50 hover:bg-green-100 border border-green-100 rounded-xl transition text-green-600">
                <FaWhatsapp className="w-4 h-4" />
              </button>
              <button onClick={() => handleShare("linkedin")} className="w-9 h-9 flex items-center justify-center bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl transition text-blue-600">
                <FaLinkedin className="w-4 h-4" />
              </button>
              <button onClick={() => handleShare("twitter")} className="w-9 h-9 flex items-center justify-center bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-xl transition text-sky-500">
                <FaTwitter className="w-4 h-4" />
              </button>
              <button onClick={() => handleShare("copy")} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-xl transition flex-1 justify-center">
                Copy Link
              </button>
            </div>
          </div>

          {/* Job Safety Tips */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h3 className="font-bold text-sm text-gray-900 mb-3">Job Safety Tips</h3>
            <ul className="space-y-1.5">
              {["Verified company", "No registration fee", "No interview fee", "No payment required"].map((tip, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <HiShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {tip}
                </li>
              ))}
            </ul>
            <button className="mt-3 text-xs font-bold text-red-500 hover:underline flex items-center gap-1">
              <HiExclamationCircle className="w-3.5 h-3.5" /> Report this job
            </button>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#0a2e1a] rounded-[20px] p-4 flex flex-col md:flex-row items-center justify-between shadow-2xl gap-4">
            <div className="flex items-center gap-4 flex-1">
               <div className="w-12 h-12 bg-emerald-800 rounded-xl flex items-center justify-center shrink-0 border border-emerald-700">
                 <HiSparkles className="w-6 h-6 text-emerald-400" />
               </div>
               <div>
                 <p className="font-extrabold text-[15px] text-white">Your AI says this is one of your strongest matches!</p>
                 <p className="text-[12px] font-medium text-emerald-200 flex items-center gap-1">Apply now before applications close <span className="text-xl leading-none">🚀</span></p>
               </div>
            </div>
            
            <div className="flex items-center gap-6 md:gap-8 shrink-0">
               <div className="hidden sm:flex flex-col items-center">
                 <p className="text-white font-extrabold text-[15px] flex items-center gap-1"><HiUsers className="w-4 h-4 text-emerald-400" /> 1,248</p>
                 <p className="text-[10px] text-emerald-200">Applicants</p>
               </div>
               <div className="hidden sm:flex flex-col items-center border-l border-emerald-800 pl-6">
                 <p className="text-white font-extrabold text-[15px] flex items-center gap-1"><HiClock className="w-4 h-4 text-emerald-400" /> 2 days ago</p>
                 <p className="text-[10px] text-emerald-200">Posted</p>
               </div>
               
               <div className="flex flex-col items-center gap-1">
                 {hasApplied ? (
                   <button className="bg-emerald-800 text-emerald-300 font-extrabold text-[14px] px-8 py-3 rounded-xl cursor-default flex items-center gap-2 border border-emerald-700">
                     <HiCheckCircle className="w-5 h-5" /> Applied
                   </button>
                 ) : job.isExternal && job.externalUrl ? (
                   <a href={job.externalUrl} target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-gray-50 text-[#0a2e1a] font-extrabold text-[14px] px-8 py-3 rounded-xl transition shadow-sm flex items-center gap-2">
                     Apply Externally <HiExternalLink className="w-4 h-4 text-emerald-600" />
                   </a>
                 ) : (
                   <button onClick={() => setShowApply(true)} className="bg-white hover:bg-gray-50 text-[#0a2e1a] font-extrabold text-[14px] px-8 py-3 rounded-xl transition shadow-sm flex items-center gap-2">
                     <HiSparkles className="w-4 h-4 text-emerald-600" /> Easy Apply Now
                   </button>
                 )}
                 <p className="text-[10px] font-medium text-emerald-300 flex items-center gap-1"><HiClock className="w-3 h-3" /> Takes less than 2 minutes</p>
               </div>
            </div>
          </div>
        </div>
      </div>      {showApply && (
        <ApplyModal
          job={job}
          onClose={() => setShowApply(false)}
          onSuccess={() => { setShowApply(false); setHasApplied(true); }}
        />
      )}
    </div>
  );
}
