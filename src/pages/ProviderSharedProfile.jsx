import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { profileShareAPI } from "../services/api";
import { 
  HiLocationMarker, 
  HiStar, 
  HiBriefcase, 
  HiGlobe, 
  HiCalendar, 
  HiCurrencyRupee, 
  HiLockClosed,
  HiExternalLink
} from "react-icons/hi";
import LoadingSpinner from "../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import Seo from "../components/common/Seo";

export default function ProviderSharedProfile() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSharedProfile();
  }, [token]);

  const fetchSharedProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await profileShareAPI.getSharedProfile(token);
      if (data?.success && data?.profile) {
        setProfile(data.profile);
      } else {
        setError("Invalid or expired share link.");
      }
    } catch (err) {
      console.error("[Fetch Shared Profile Failed]:", err);
      const msg = err.response?.data?.message || "Failed to load shared profile.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 text-4xl">
            ⚠️
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Link Unavailable</h2>
          <p className="text-sm text-slate-500 mb-6">{error || "This shareable profile link is invalid, expired, or has been revoked."}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition w-full shadow-md text-xs uppercase tracking-wider"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const name = profile.name || "Candidate Profile";
  const location = [profile.city, profile.state].filter(Boolean).join(", ") || "India";
  const skills = profile.skills || [];
  const experience = profile.experience || "No professional experience listed.";
  const description = profile.description || "Dedicated professional.";
  const languages = profile.languages || [];
  const portfolioLinks = profile.portfolioLinks || [];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* Search Crawler Directives: noindex, nofollow */}
      <Seo
        title={`${name} - Professional Profile`}
        description="Public candidate preview profile"
        metaRobots="noindex, nofollow"
      />

      {/* Background Hero Banner */}
      <div className="relative w-full h-[240px] bg-gradient-to-r from-violet-800 via-indigo-800 to-violet-900 overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-15 mix-blend-overlay"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-violet-500/30 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10">
        {/* Profile Card Header */}
        <div className="bg-white rounded-[2rem] shadow-xl p-6 md:p-8 border border-white/50 backdrop-blur-xl mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Masked Profile Picture Placeholder */}
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl border-4 border-white shrink-0">
            <span className="text-4xl md:text-5xl font-black text-white">{name.charAt(0).toUpperCase()}</span>
          </div>

          <div className="flex-1 text-center md:text-left mt-2 md:mt-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center md:justify-start gap-2">
                  {name}
                  <span className="text-[10px] uppercase font-black tracking-widest bg-violet-100 border border-violet-200 text-violet-700 px-3 py-1 rounded-full shadow-inner">
                    Shared Profile Preview
                  </span>
                </h1>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3 text-xs text-slate-500 font-bold">
                  <span className="flex items-center gap-1 bg-slate-100/70 px-3 py-1.5 rounded-full">
                    <HiLocationMarker className="w-4 h-4 text-rose-500 shrink-0" />
                    {location}
                  </span>
                  {profile.rating > 0 && (
                    <span className="flex items-center gap-1 bg-slate-100/70 px-3 py-1.5 rounded-full">
                      <HiStar className="w-4 h-4 text-amber-400 shrink-0" />
                      {profile.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Candidate Skills Chips */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-5 justify-center md:justify-start">
                {skills.slice(0, 5).map((skill, i) => (
                  <span
                    key={i}
                    className="px-3.5 py-1 bg-slate-900 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Bio Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 text-left">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 border-b pb-3 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                  <HiBriefcase />
                </span>
                Professional Bio
              </h3>
              <p className="text-slate-650 text-sm leading-relaxed whitespace-pre-line m-0">
                {description}
              </p>
            </div>

            {/* Experience Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 text-left">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 border-b pb-3 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                  <HiCalendar />
                </span>
                Work Experience
              </h3>
              <p className="text-slate-650 text-sm leading-relaxed whitespace-pre-line m-0">
                {experience}
              </p>
            </div>

            {/* Portfolio Links */}
            {portfolioLinks.length > 0 && (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 text-left">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 border-b pb-3 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                    <HiGlobe />
                  </span>
                  Websites & Portfolio Links
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {portfolioLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex flex-col p-4 rounded-xl border border-slate-100 hover:border-violet-300 hover:shadow-md transition bg-slate-50/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs text-slate-800 capitalize">
                          {link.platform || "Website"}
                        </span>
                        <HiExternalLink className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition" />
                      </div>
                      <span className="text-[10px] text-slate-400 truncate">{link.url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rates & Languages */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-left">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Summary</h3>
              
              <div className="space-y-4 text-xs font-bold text-slate-600">
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span>Experience</span>
                  <span className="text-slate-800 font-extrabold">{profile.experience || "N/A"}</span>
                </div>
                
                {languages.length > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span>Languages</span>
                    <span className="text-slate-800 font-extrabold">{languages.join(", ")}</span>
                  </div>
                )}

                {profile.pricing && (
                  <div className="flex items-center justify-between py-2">
                    <span>Pricing Rate</span>
                    <span className="text-emerald-600 font-black flex items-center">
                      <HiCurrencyRupee className="w-4 h-4" />
                      {profile.pricing}{profile.pricingType ? `/${profile.pricingType}` : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Lock Details Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 shadow-xl text-center text-white border border-slate-800 relative overflow-hidden">
              <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-violet-300">
                <HiLockClosed className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm mb-1 tracking-tight">Protected Profile</h4>
              <p className="text-[10px] text-slate-350 leading-relaxed mb-4">
                This is a secure share link. The candidate's contact information (Email, Mobile, WhatsApp, and Resume PDF) is masked to prevent unauthorized downloads and harvesting.
              </p>

              <div className="space-y-2 mb-4">
                {profile?.user?.phone || profile?.phone ? (
                  <div className="flex items-center justify-center gap-2 bg-white/10 text-white/90 py-2 rounded-xl text-xs font-bold font-mono">
                    <span className="blur-[1px]">{profile?.user?.phone || profile?.phone}</span>
                  </div>
                ) : null}
                
                {profile?.user?.email || profile?.email ? (
                  <div className="flex items-center justify-center gap-2 bg-white/10 text-white/90 py-2 rounded-xl text-xs font-bold font-mono">
                    <span className="blur-[1px]">{profile?.user?.email || profile?.email}</span>
                  </div>
                ) : null}
              </div>
              
              <button 
                onClick={() => navigate("/")}
                className="w-full py-3 bg-white text-indigo-900 font-black rounded-xl hover:bg-slate-50 transition text-xs shadow-md tracking-wide uppercase"
              >
                Find Professional Partners
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
