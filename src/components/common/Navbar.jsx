import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  HiMenu,
  HiX,
  HiUser,
  HiLogout,
  HiCog,
  HiHome,
  HiSearch,
  HiTrendingUp,
  HiCreditCard,
  HiBriefcase,
  HiMail,
  HiUsers,
  HiClock,
  HiPlusCircle,
  HiPhone,
  HiLockClosed,
  HiBookmark,
  HiClipboardList,
  HiSparkles,
  HiUserAdd,
} from "react-icons/hi";
import { FiChevronDown } from "react-icons/fi";
import { toOptimizedMediaUrl } from "../../utils/media";
import NotificationBell from "./NotificationBell";
import LanguageDropdown from "../LanguageDropdown";
import useTranslation from "../../hooks/useTranslation";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const dropdownRef = useRef(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupModalRole, setSignupModalRole] = useState("recruiter");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    if (isLeftSwipe) {
      setMobileOpen(false);
    }
  };
  const navigate = useNavigate();
  const activeRole = user?.activeRole || user?.role;

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    switch (activeRole) {
      case "provider":
        return "/provider/job-for-me";
      case "recruiter":
        return "/recruiter/job-postings";
      case "admin":
        return "/admin/dashboard";
      case "manager":
        return "/admin/providers";
      default:
        return "/";
    }
  };


  const isRecruiterPage = window.location.pathname.includes('/recruiter-discovery') || window.location.pathname.includes('/recruiter-locked');

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-md bg-[#081B3A] flex items-center justify-center">
              <span className="text-white font-bold text-lg scale-125">L</span>
            </div>
            <div className="leading-none">
              <p className="font-extrabold text-[#081B3A] tracking-tight">
                Lucohire
              </p>
              <p className="text-[9px] font-semibold tracking-[0.2em] text-[#6B7280] mt-0.5">
                AI HIRING
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-3 lg:gap-5 ml-auto">
            <Link to="/" className="text-gray-600 hover:text-indigo-600 transition font-medium text-sm">
              {t("navbar.home")}
            </Link>
            <Link to={isAuthenticated ? "/provider/job-for-me" : "/candidate-landing"} className="text-gray-600 hover:text-indigo-600 transition font-medium text-sm">
              {t("navbar.findJobs", "Find Jobs")}
            </Link>
            {(!isAuthenticated || activeRole !== "provider") && (
              <Link to="/search" className="text-gray-600 hover:text-indigo-600 transition font-medium text-sm">
                {t("navbar.findProviders")}
              </Link>
            )}


            {/* <LanguageDropdown /> */}

            {/* <LanguageDropdown /> */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1.5 hover:bg-gray-100 transition"
                  aria-label="Open profile menu"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-controls="profile-dropdown-menu"
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
                    {user?.profilePhotoApproval?.status === "pending" &&
                    user?.profilePhotoApproval?.pendingUrl ? (
                      <img
                        src={toOptimizedMediaUrl(
                          user.profilePhotoApproval.pendingUrl,
                          { width: 64, height: 64, crop: "fill", dpr: "auto" },
                        )}
                        alt="Profile"
                        width={32}
                        height={32}
                        decoding="async"
                        fetchpriority="high"
                        loading="lazy"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : user?.profilePhoto || user?.avatar ? (
                      <img
                        src={toOptimizedMediaUrl(
                          user.profilePhoto || user.avatar,
                          { width: 64, height: 64, crop: "fill", dpr: "auto" },
                        )}
                        alt="Profile"
                        width={32}
                        height={32}
                        decoding="async"
                        fetchpriority="high"
                        loading="lazy"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <HiUser className="text-indigo-600" aria-hidden="true" />
                    )}
                  </div>
                  <span className="max-w-24 truncate text-sm font-medium text-gray-700">
                    {user?.name?.split(" ")[0]}
                  </span>
                </button>
                {dropdownOpen && (
                  <div id="profile-dropdown-menu" className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium text-sm">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full font-medium capitalize">
                        {activeRole}
                      </span>
                    </div>
                    <Link
                      to={
                        activeRole === 'provider' ? '/provider/job-for-me' :
                        activeRole === 'recruiter' ? '/recruiter/candidates' :
                        getDashboardLink()
                      }
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {activeRole === 'provider' ? (
                        <HiBriefcase className="text-gray-400" aria-hidden="true" />
                      ) : activeRole === 'recruiter' ? (
                        <HiSearch className="text-gray-400" aria-hidden="true" />
                      ) : (
                        <HiHome className="text-gray-400" aria-hidden="true" />
                      )}
                      <span>
                        {activeRole === 'provider' ? "Matching Jobs" :
                         activeRole === 'recruiter' ? "Find Candidates" :
                         t("navbar.dashboard")}
                      </span>
                    </Link>
                    {activeRole !== "manager" && (
                      <Link
                        to={activeRole === "recruiter" ? "/recruiter/settings" : `/${activeRole}/profile`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <HiCog className="text-gray-400" aria-hidden="true" />
                        <span>{activeRole === "recruiter" ? "Profile & Settings" : t("navbar.settings")}</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <HiLogout className="text-red-400" aria-hidden="true" />
                      <span>{t("navbar.logout")}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : location.state?.recruiterData ? (
              <div className="relative flex items-center" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-gray-50 focus:outline-none transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                    <span className="text-indigo-700 font-bold text-sm">
                      {location.state.recruiterData.name?.charAt(0)?.toUpperCase() || 'R'}
                    </span>
                  </div>
                  <span className="max-w-24 truncate text-sm font-medium text-gray-700">
                    {location.state.recruiterData.name?.split(" ")[0]}
                  </span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fade-in z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium text-sm">{location.state.recruiterData.name}</p>
                      <p className="text-xs text-gray-500">{location.state.recruiterData.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-full font-medium">
                        Verification Pending
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 font-medium"
                    >
                      <HiLockClosed className="text-indigo-400" aria-hidden="true" />
                      <span>Unlock Profile</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (

              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
                >
                  {t("navbar.login")}
                </button>

                <button
                  type="button"
                  onClick={() => setShowSignupModal(true)}
                  className="rounded-full bg-indigo-600 text-white px-5 py-2 text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
                >
                  {t("navbar.startEarning", "Start Earning")}
                </button>
              </div>
            )}
            <LanguageDropdown />
            {/* <NotificationBell /> */}
          </div>
          <div className="lg:absolute hidden md:block right-4 top-4 border-gray-300">
            <NotificationBell />
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-2">
            <NotificationBell />
            {/* Quick toggle removed */}
            <button
              type="button"
              name="hamburger"
              className="p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              {mobileOpen ? (
                <HiX className="w-6 h-6" aria-hidden="true" />
              ) : (
                <HiMenu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu - Left Slide Drawer */}
        <div
          className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        >
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <aside
            id="mobile-navigation"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className={`relative w-[70%] max-w-sm h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded bg-[#081B3A] flex items-center justify-center">
                  <span className="text-white font-extrabold text-sm">L</span>
                </div>
                <div className="leading-none">
                  <p className="font-bold text-[#081B3A] text-sm tracking-tight">
                    Lucohire
                  </p>
                  <p className="text-[7px] font-semibold tracking-[0.2em] text-[#6B7280] mt-0.5">
                    AI HIRING
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition"
                aria-label="Close navigation menu"
                aria-controls="mobile-navigation"
              >
                <HiX className="w-5 h-5 text-gray-500 hover:text-gray-700" aria-hidden="true" />
              </button>
            </div>

            {/* Menu Options Scroll Container */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 font-sans">
              {/* Main Navigation */}
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  {t("navbar.navigation", "Navigation")}
                </p>
                <Link
                  to="/"
                  className="flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                  onClick={() => setMobileOpen(false)}
                >
                  <HiHome className="w-5 h-5 text-gray-400" />
                  <span>{t("navbar.home")}</span>
                </Link>
                <Link
                  to="/contact"
                  className="flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                  onClick={() => setMobileOpen(false)}
                >
                  <HiMail className="w-5 h-5 text-gray-400" />
                  <span>{t("navbar.contactUs", "Contact Us")}</span>
                </Link>
              </div>

              {/* Provider Options (Visible only when logged in as provider) */}
              {isAuthenticated && activeRole === "provider" && (
                <div className="space-y-1 pt-2 border-t border-gray-100">
                  <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {t("provider.panel", "Provider Panel")}
                  </p>
                  {[
                    { label: "Dashboard",        path: "/provider/dashboard",        icon: HiTrendingUp },
                    { label: "Profile",           path: "/provider/profile",           icon: HiCog },
                    { label: "Career Analysis",   path: "/provider/career-health",    icon: HiTrendingUp },
                    { label: "Interview Preparation",      path: "/provider/grow-with-ai",     icon: HiSparkles },
                    { label: "AI Career Coach",   path: "/provider/ai-career-coach",  icon: HiSparkles },
                    { label: "AI Dashboard",      path: "/provider/ai-tips",          icon: HiSparkles },
                    { label: "Resume Toolkit",    path: "/provider/resume-toolkit",   icon: HiClipboardList },
                    { label: "Jobs for Me",       path: "/provider/job-for-me",       icon: HiBriefcase },
                    { label: "Applied Jobs",      path: "/provider/applied-jobs",     icon: HiClipboardList },
                    { label: "My Plan",           path: "/provider/my-plan",          icon: HiPhone },
                    { label: "Refer & Earn",      path: "/provider/referrals",        icon: HiPlusCircle },
                    { label: "Add Member",        path: "/provider/add-member",       icon: HiUserAdd },
                    { label: "Messages",          path: "/provider/contacted",        icon: HiMail },
                    { label: "Leads",             path: "/provider/leads",            icon: HiUsers },
                    { label: "History",           path: "/provider/history",          icon: HiClock },
                    { label: "Wallet",            path: "/provider/wallet",           icon: HiCreditCard },
                    { label: "Payment Settings",  path: "/provider/payout-settings",  icon: HiCog },
                    { label: "Support",           path: "/provider/support",          icon: HiCog },
                    { label: "Change Password",   path: "/provider/change-password",  icon: HiLockClosed },
                  ].map(({ label, path, icon: Icon }) => {
                    const active = window.location.pathname === path;
                    return (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center space-x-3 rounded-xl px-3 py-2 text-xs font-medium transition ${active ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50"}`}
                      >
                        <Icon
                          className={`w-4 h-4 ${active ? "text-emerald-600" : "text-gray-400"}`}
                        />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Recruiter Options (Visible only when logged in as recruiter) */}
              {isAuthenticated && activeRole === "recruiter" && (
                <div className="space-y-1 pt-2 border-t border-gray-100">
                  <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Recruiter Panel
                  </p>
                  {[
                    { label: "Dashboard", path: "/recruiter/dashboard", icon: HiTrendingUp },
                    { label: "Post a Job", path: "/recruiter/post-job", icon: HiPlusCircle },
                    { label: "Job Postings", path: "/recruiter/job-postings", icon: HiBriefcase },
                    { label: "Find Providers", path: "/recruiter/find-providers", icon: HiUsers },
                    { label: "Shortlisted", path: "/recruiter/shortlisted-candidates", icon: HiBookmark },
                    { label: "Profile", path: "/recruiter/profile", icon: HiCog },
                  ].map(({ label, path, icon: Icon }) => {
                    const active = window.location.pathname === path;
                    return (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center space-x-3 rounded-xl px-3 py-2 text-xs font-medium transition ${active ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"}`}
                      >
                        <Icon className={`w-4 h-4 ${active ? "text-amber-600" : "text-gray-400"}`} />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Language and Switch Actions */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <LanguageDropdown
                  mobile
                  onChangeComplete={() => setMobileOpen(false)}
                />
                {/* Role Switch logic removed */}
              </div>

              {/* Auth and CTA section */}
              <div className="pt-4 border-t border-gray-100">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                    >
                      <HiLogout className="w-5 h-5 text-red-400" aria-hidden="true" />
                      <span>{t("navbar.logout")}</span>
                    </button>
                  </div>
                ) : location.state?.recruiterData ? (
                  <div className="space-y-3 px-3">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                        <span className="text-indigo-700 font-bold text-lg">
                          {location.state.recruiterData.name?.charAt(0)?.toUpperCase() || 'R'}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-tight text-sm">{location.state.recruiterData.name}</p>
                        <p className="text-xs text-gray-500 leading-tight">{location.state.recruiterData.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                      }}
                      className="w-full rounded-xl bg-indigo-600 text-white px-4 py-3 text-sm font-bold shadow-md hover:bg-indigo-700 transition flex justify-center items-center gap-2"
                    >
                      <HiLockClosed className="w-4 h-4" /> Unlock Profile
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/login");
                          setMobileOpen(false);
                        }}
                        className="w-full border border-gray-300 py-2.5 rounded-xl text-sm font-bold text-gray-700"
                      >
                        {t("navbar.login")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSignupModal(true);
                          setMobileOpen(false);
                        }}
                        className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100"
                      >
                        {t("navbar.signup")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowSignupModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <HiX className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">Join Luco</h3>
            <p className="text-gray-600 mb-6">How would you like to use Luco?</p>

            <div className="space-y-4 mb-6">
              {/* Recruiter Option */}
              <label className={`w-full flex items-center p-4 border rounded-xl cursor-pointer transition-all ${signupModalRole === 'recruiter' ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-300 hover:bg-gray-50'}`}>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">I want to hire</div>
                  <div className="text-sm text-gray-500">Find top talent for your company</div>
                </div>
                <input 
                  type="radio" 
                  name="signupRole" 
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  checked={signupModalRole === 'recruiter'}
                  onChange={() => setSignupModalRole('recruiter')}
                />
              </label>

              {/* Candidate Option */}
              <label className={`w-full flex items-center p-4 border rounded-xl cursor-pointer transition-all ${signupModalRole === 'candidate' ? 'border-green-500 bg-green-50' : 'hover:border-green-300 hover:bg-gray-50'}`}>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">I want to work</div>
                  <div className="text-sm text-gray-500">Find freelance or full-time jobs</div>
                </div>
                <input 
                  type="radio" 
                  name="signupRole" 
                  className="w-5 h-5 text-green-600 focus:ring-green-500"
                  checked={signupModalRole === 'candidate'}
                  onChange={() => setSignupModalRole('candidate')}
                />
              </label>
            </div>

            <button 
              onClick={() => {
                setShowSignupModal(false);
                if (signupModalRole === 'recruiter') {
                  navigate('/recruiter-discovery');
                } else {
                  navigate('/candidate-landing');
                }
              }}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
