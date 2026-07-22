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
  HiOutlineClock,
  HiTrendingUp,
} from "react-icons/hi";
import { FaWhatsapp, FaLinkedin, FaTwitter } from "react-icons/fa";
import { providerAPI, jobsAPI } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import toast from "react-hot-toast";

const BUDGET_LABELS = { fixed: "Fixed", hourly: "/hr", monthly: "/mo", negotiable: "Negotiable" };



/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function JobDetail() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  
  
  
  

  
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await jobsAPI.getPublicJobById(jobId);
        const jobData = res.data?.data || res.data;
        if (!jobData) { toast.error("Job not found"); navigate(-1); return; }
        setJob(jobData);

      } catch {
        toast.error("Failed to load job details");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [jobId, navigate]);

  const handleSave = useCallback(() => {
    toast.error("Please sign in to save jobs.");
    navigate("/login");
  }, [navigate]);

  const handleApply = () => {
    toast.error("Please sign in to apply for jobs.");
    navigate("/login");
  };

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

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Back bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition">
            <HiArrowLeft className="w-4 h-4" /> Back to Jobs
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        {/* ── Left Column ── */}
        <div className="space-y-5">

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
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleShare("copy")} className="flex items-center gap-1.5 text-[13px] font-bold text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-xl transition">
                    <HiShare className="w-4 h-4" /> Share
                  </button>
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
                  <span className="flex items-center gap-1.5"><HiOutlineClock className="w-4 h-4" /> Posted {postedAgo}</span>
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
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition ${false ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                  >
                    {false ? <HiBookmark className="w-[18px] h-[18px]" /> : <HiOutlineBookmark className="w-[18px] h-[18px]" />}
                    {false ? "Saved" : "Save"}
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
              {['Overview', 'About Company'].map(tab => (
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
                {job.description && (
                  <div
                    className="text-[14px] text-gray-600 leading-relaxed prose prose-sm max-w-none px-1"
                    dangerouslySetInnerHTML={{ __html: job.description.replace(/<img[^>]*>/g, '') }}
                  />
                )}
              </section>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <section className="border-t border-gray-100 pt-5">
                  <div className="w-full flex items-center justify-between font-extrabold text-[15px] text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                        <HiBriefcase className="w-4 h-4 text-purple-600" />
                      </div>
                      Requirements
                    </div>
                  </div>
                  <p className="text-[13px] text-gray-600 mt-2 px-10">{job.requirements.join(", ")}</p>
                </section>
              )}

              {/* Benefits & Perks */}
              {job.benefits && job.benefits.length > 0 && (
                <section className="border-t border-gray-100 pt-5">
                  <div className="w-full flex items-center justify-between font-extrabold text-[15px] text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <HiSparkles className="w-4 h-4 text-emerald-600" />
                      </div>
                      Benefits & Perks
                    </div>
                  </div>
                  <ul className="text-[13px] text-gray-600 mt-2 px-10 list-disc list-inside">
                    {job.benefits.map((benefit, i) => (
                      <li key={i}>{benefit}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
          {activeTab === 'About Company' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col items-start">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden bg-gray-50 shadow-sm">
                  {job.companyLogo ? (
                    <img src={job.companyLogo} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-extrabold text-2xl text-gray-900">{job.companyName?.substring(0,1) || "C"}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-gray-900">{job.companyName || job.recruiter?.name || "Company"}</h3>
                  <p className="text-[13px] font-medium text-gray-500 mt-0.5">{job.city || "Headquarters"}</p>
                </div>
              </div>
              {job.companyDescription ? (
                <div 
                  className="text-[13px] text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: job.companyDescription.replace(/<img[^>]*>/g, '') }}
                />
              ) : (
                <p className="text-gray-500 text-[14px]">No detailed information is available for this company at the moment.</p>
              )}
            </div>
          )}

        </div>

        {/* ── Right Column ── */}
        <div className="space-y-4">

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
          </div>
        </div>
      </div>
    </div>
  );
}
