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
  const [saved, setSaved] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

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

        const planObj = sub?.planId || sub?.plan;
        const hasActivePlan = !!planObj && planObj.price > 0;

        if (hasActivePlan) {
          // Fetch real AI insights for this job
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
        } else {
          // Mock for display (will be blurred)
          setAiInsights({
            _isMock: true,
            matchScore: 72,
            whyMatch: ["Your skills align 90% of job requirements", "Strong match on UX Research & User Testing", "Your portfolio aligns with company needs"],
            improve: "Improve Design Systems skills to increase match to 97%",
            missingSkills: ["Figma Advanced", "Design Systems", "Interaction Design"],
            hireBlocker: "Your portfolio lacks strong mobile UI/UX examples.",
            interviewProbability: 65,
            salaryInsight: "₹14 – 18 LPA for your profile",
          });
        }
      } catch {
        toast.error("Failed to load job details");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [jobId, navigate]);

  const planObj = subscription?.planId || subscription?.plan;
  const hasActivePlan = !!planObj && planObj.price > 0;

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
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Score */}
              <div className="flex flex-col items-center justify-center gap-1 min-w-[110px]">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={matchScore >= 80 ? "#10b981" : "#f59e0b"}
                      strokeWidth="3"
                      strokeDasharray={`${matchScore} ${100 - matchScore}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-extrabold text-xl text-gray-900">{matchScore}%</span>
                    <span className="text-[9px] font-semibold text-gray-500">AI Match</span>
                  </div>
                </div>
                <span className={`text-xs font-bold ${matchScore >= 80 ? "text-emerald-600" : "text-yellow-600"}`}>
                  {matchScore >= 80 ? "Excellent Match" : matchScore >= 60 ? "Good Match" : "Fair Match"}
                </span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => <span key={s} className={`text-xs ${s <= Math.round(matchScore/20) ? "text-yellow-400" : "text-gray-200"}`}>★</span>)}
                </div>
              </div>

              {/* Why this job is great for you — AI Report */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm mb-3">Why this job is a great match for you</h3>

                {/* Checklist bullets */}
                <ul className="space-y-2 mb-3">
                  {(hasActivePlan
                    ? (aiInsights?.whyMatch || [])
                    : [
                        "Your Figma skills match 90% of job requirements",
                        "Strong match on UX Research & User Testing",
                        "Your portfolio aligns with company needs",
                      ]
                  ).map((point, i) => (
                    <li key={i} className={`flex items-start gap-2 text-xs text-gray-700 ${!hasActivePlan && i > 0 ? "blur-sm select-none" : ""}`}>
                      <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <HiCheckCircle className="w-3 h-3 text-emerald-600" />
                      </span>
                      {point}
                    </li>
                  ))}

                  {/* Improvement tip */}
                  <li className={`flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 ${!hasActivePlan ? "blur-sm select-none" : ""}`}>
                    <HiExclamationCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      {hasActivePlan
                        ? (aiInsights?.improve || "Improve Design Systems skills to increase match to 97%")
                        : "Improve Design Systems skills to increase match to 97%"}
                    </span>
                  </li>
                </ul>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex flex-col items-center">
                    <span className="font-extrabold text-base text-gray-900">23</span>
                    <span className="text-[10px] text-gray-500 text-center leading-tight mt-0.5">Similar jobs found</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex flex-col items-center">
                    <span className="font-extrabold text-base text-gray-900">18</span>
                    <span className="text-[10px] text-gray-500 text-center leading-tight mt-0.5">Recruiters viewed candidates like you</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex flex-col items-center">
                    <span className="text-[10px] font-semibold text-gray-700">Updated</span>
                    <span className="text-[10px] text-gray-500 text-center mt-0.5">{postedAgo}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Company Header ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl border border-gray-100 flex items-center justify-center bg-gray-50 shrink-0">
                  <span className="font-extrabold text-xl text-gray-700 capitalize">{job.companyName?.substring(0,2) || "CO"}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-base">{job.companyName || job.recruiter?.name || "Company"}</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                      <HiCheckCircle className="w-3 h-3" /> Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="text-yellow-500">★</span>
                    <span className="font-semibold text-gray-700">4.6</span>
                    <span>(12.4K reviews)</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleShare("copy")} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition">
                  <HiShare className="w-4 h-4" /> Share
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition">•••</button>
              </div>
            </div>

            {/* Title */}
            <div className="mt-4">
              <h1 className="font-extrabold text-2xl text-gray-900">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1"><HiLocationMarker className="w-4 h-4 text-gray-400" /> {job.city || "Location not specified"} {job.workMode && `(${job.workMode})`}</span>
                <span className="flex items-center gap-1"><HiBriefcase className="w-4 h-4 text-gray-400" /> {job.experienceRequired || "Experience not specified"}</span>
                <span className="flex items-center gap-1"><HiCurrencyRupee className="w-4 h-4 text-gray-400" /> {budgetText}</span>
                <span className="flex items-center gap-1"><HiClock className="w-4 h-4 text-gray-400" /> Posted {postedAgo}</span>
                <span className="flex items-center gap-1"><HiUsers className="w-4 h-4 text-gray-400" /> 1,248 applicants</span>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-2 mt-3">
                {job.skill && <span className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-semibold border border-emerald-100">{job.skill}</span>}
                {job.requirements?.slice(0, 4).map((r, i) => (
                  <span key={i} className="text-xs px-3 py-1 bg-gray-50 text-gray-600 rounded-full font-medium border border-gray-100">{r}</span>
                ))}
                {job.requirements?.length > 4 && (
                  <span className="text-xs px-3 py-1 bg-gray-50 text-gray-600 rounded-full font-medium border border-gray-100">+{job.requirements.length - 4}</span>
                )}
              </div>

              {/* Apply / Save row */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <button
                  onClick={() => handleSave()}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition ${saved ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  <HiBookmark className="w-4 h-4" /> {saved ? "Saved" : "Save"}
                </button>
                {hasApplied ? (
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl text-sm">
                    <HiCheckCircle className="w-4 h-4 animate-bounce" /> Applied Successfully
                  </div>
                ) : job.isExternal && job.externalUrl ? (
                  <a href={job.externalUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition">
                    Apply Externally <HiExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <button onClick={() => setShowApply(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-sm">
                    Easy Apply
                  </button>
                )}
                <span className="text-xs text-gray-500">✓ Apply takes less than 2 minutes</span>
                <span className="text-xs text-gray-500">✓ No cover letter required</span>
              </div>
            </div>


          </div>

          {/* ── Job Content ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-6">
            {/* Overview */}
            <section>
              <h2 className="font-bold text-base text-gray-900 flex items-center gap-2 mb-2">
                <HiOfficeBuilding className="w-4 h-4 text-gray-400" /> Overview
              </h2>
              {job.description ? (
                <div
                  className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed">
                  We are looking for a passionate professional who can deliver exceptional results. You will work with cross-functional teams to design, build, and ship impactful solutions.
                </p>
              )}
            </section>

            {/* Key Responsibilities */}
            <section>
              <button className="w-full flex items-center justify-between font-bold text-sm text-gray-900 py-3 border-t border-gray-50">
                <span className="flex items-center gap-2"><HiCheckCircle className="w-4 h-4 text-emerald-500" /> Key Responsibilities</span>
                <HiArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            </section>

            {/* Requirements */}
            <section>
              <button className="w-full flex items-center justify-between font-bold text-sm text-gray-900 py-3 border-t border-gray-50">
                <span className="flex items-center gap-2"><HiBriefcase className="w-4 h-4 text-blue-500" /> Requirements</span>
                <HiArrowRight className="w-4 h-4 text-gray-400" />
              </button>
              {job.requirements?.length > 0 && (
                <p className="text-sm text-gray-600 pb-2">{job.requirements.join(", ")} & more.</p>
              )}
            </section>

            {/* Benefits & Perks */}
            <section>
              <button className="w-full flex items-center justify-between font-bold text-sm text-gray-900 py-3 border-t border-gray-50">
                <span className="flex items-center gap-2"><HiSparkles className="w-4 h-4 text-yellow-500" /> Benefits & Perks</span>
                <HiArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            </section>

            {/* About the Team */}
            <section>
              <button className="w-full flex items-center justify-between font-bold text-sm text-gray-900 py-3 border-t border-gray-50">
                <span className="flex items-center gap-2"><HiUsers className="w-4 h-4 text-purple-500" /> About the Team</span>
                <HiArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            </section>
          </div>

          {/* ── AI Insights for You ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <HiSparkles className="w-4 h-4 text-purple-500" />
                AI Insights for You
                {hasActivePlan && <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full">Premium</span>}
              </h2>
              {!hasActivePlan && <HiLockClosed className="w-4 h-4 text-gray-400" />}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Why Great Match */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 mb-1">Why this is a great match</p>
                <p className={`text-xs text-gray-600 leading-snug ${!hasActivePlan ? "blur-sm select-none" : ""}`}>
                  {hasActivePlan ? (aiInsights?.whyMatch?.[0] || "Your skills align with this role") : "Your UI/UX skills, Figma experience and portfolio strongly match this role."}
                </p>

              </div>

              {/* Skills You Have */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 mb-1">Skills you have</p>
                <ul className={`space-y-0.5 ${!hasActivePlan ? "blur-sm select-none" : ""}`}>
                  {(hasActivePlan ? [job.skill, ...(job.requirements?.slice(0,2) || [])] : ["UI/UX Design", "Figma", "Interaction Design"]).filter(Boolean).slice(0,3).map((s, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-center gap-1"><HiCheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />{s}</li>
                  ))}
                </ul>
              </div>

              {/* Skills to Improve */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 mb-1">Skills to improve</p>
                <ul className={`space-y-0.5 ${!hasActivePlan ? "blur-sm select-none" : ""}`}>
                  {(hasActivePlan ? (aiInsights?.missingSkills || []) : ["Design Systems", "Interaction Design", "Prototyping"]).slice(0,3).map((s, i) => (
                    <li key={i} className="text-xs text-red-600 flex items-center gap-1"><HiExclamationCircle className="w-3 h-3 text-red-400 shrink-0" />{s}</li>
                  ))}
                </ul>
                {!hasActivePlan && (
                  <Link to="/provider/my-plan" className="mt-2 text-[10px] font-bold text-blue-600 hover:underline block">Improve with AI Coach 🔒</Link>
                )}
              </div>

              {/* Interview Chance */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 mb-1">Interview chance</p>
                <div className="flex flex-col items-center gap-1 mt-1">
                  <div className="relative w-14 h-14">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeDasharray={`${hasActivePlan ? (aiInsights?.interviewProbability || 65) : 78} ${100 - (hasActivePlan ? (aiInsights?.interviewProbability || 65) : 78)}`}
                        strokeLinecap="round"
                        className={!hasActivePlan ? "blur-sm" : ""}
                      />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900 ${!hasActivePlan ? "blur-sm" : ""}`}>
                      {hasActivePlan ? `${aiInsights?.interviewProbability || 65}%` : "78%"}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Good Chance</span>
                  {!hasActivePlan && (
                    <Link to="/provider/my-plan" className="text-[10px] font-bold text-blue-600 hover:underline">Unlock with Premium 🔒</Link>
                  )}
                </div>
              </div>
            </div>

            {/* Salary Insight */}
            <div className={`mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between ${!hasActivePlan ? "" : ""}`}>
              <div>
                <p className="text-[10px] font-bold text-gray-500">Salary Insight</p>
                <p className={`text-sm font-bold text-gray-900 ${!hasActivePlan ? "blur-sm select-none" : ""}`}>
                  {hasActivePlan ? (aiInsights?.salaryInsight || budgetText) : "₹14 – 18 LPA"}
                </p>
                <p className={`text-[10px] text-gray-500 ${!hasActivePlan ? "blur-sm select-none" : ""}`}>
                  Avg. for your profile
                </p>
              </div>
              {!hasActivePlan && (
                <Link to="/provider/my-plan" className="text-[10px] font-bold text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
                  Unlock with Premium 🔒
                </Link>
              )}
            </div>
          </div>

        </div>

        {/* ── Right Column ── */}
        <div className="space-y-4">

          {/* AI Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-gray-900">AI Summary</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full flex items-center gap-1"><HiSparkles className="w-3 h-3" /> AI</span>
            </div>
            <p className={`text-xs text-gray-600 leading-relaxed mb-2 ${!hasActivePlan ? "blur-sm select-none" : ""}`}>
              You're a strong match for this role. Here's why:
            </p>
            <ul className="space-y-1">
              {["Figma skills match 90%", "UX Research experience", "Strong portfolio alignment"].map((pt, i) => (
                <li key={i} className={`flex items-start gap-2 text-xs text-gray-600 ${!hasActivePlan ? "blur-sm select-none" : ""}`}>
                  <HiCheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  {hasActivePlan ? pt : pt}
                </li>
              ))}
              <li className={`flex items-start gap-2 text-xs text-amber-700 ${!hasActivePlan ? "blur-sm select-none" : ""}`}>
                <HiExclamationCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                {hasActivePlan ? (aiInsights?.improve || "Improve Design Systems to increase match") : "Improve Design Systems to increase match to 97%"}
              </li>
            </ul>

          </div>

          {/* About the Company */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h3 className="font-bold text-sm text-gray-900 mb-3">About the Company</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                <span className="font-bold text-sm text-gray-700 capitalize">{job.companyName?.substring(0,2) || "CO"}</span>
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">{job.companyName || job.recruiter?.name || "Company"}</p>
                <p className="text-[10px] text-gray-500">4.6 ★ (12.4K reviews)</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              {job.companyInfo || "A leading company providing exceptional services and opportunities across multiple sectors. Join us to build impactful solutions at scale."}
            </p>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2"><HiBriefcase className="w-3.5 h-3.5 text-gray-400" /> <span className="font-semibold text-gray-700">Industry</span> IT Services & Consulting</div>
              <div className="flex items-center gap-2"><HiUsers className="w-3.5 h-3.5 text-gray-400" /> <span className="font-semibold text-gray-700">Company Size</span> 10,001+ employees</div>
              <div className="flex items-center gap-2"><HiLocationMarker className="w-3.5 h-3.5 text-gray-400" /> <span className="font-semibold text-gray-700">Headquarters</span> {job.city || "India"}</div>
            </div>

          </div>

          {/* Earn Extra Income */}
          <div className="bg-[#0a2e1a] rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">New</span>
              <h3 className="font-bold text-sm">Earn Extra Income</h3>
            </div>
            <p className="text-xs text-emerald-200 mb-2">Get nearby freelance projects on WhatsApp.</p>
            <ul className="space-y-1 mb-3">
              {["Weekend Projects", "Part-time Work", "Verified Clients Only", "Instant Alerts"].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-emerald-100"><HiCheckCircle className="w-3.5 h-3.5 text-emerald-400" />{f}</li>
              ))}
            </ul>
            <div className="flex items-center justify-between text-xs text-emerald-200 mb-3">
              <span>Just ₹1/day</span>
              <span className="text-emerald-300 font-semibold">Only ₹30/month</span>
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm py-2.5 rounded-xl transition">
              <FaWhatsapp className="w-4 h-4" /> Enable Freelance Alerts
            </button>
            <button className="w-full text-center text-[10px] text-emerald-400 hover:text-emerald-300 mt-2 transition">Cancel anytime</button>
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



      {showApply && (
        <ApplyModal
          job={job}
          onClose={() => setShowApply(false)}
          onSuccess={() => { setShowApply(false); setHasApplied(true); }}
        />
      )}
    </div>
  );
}
