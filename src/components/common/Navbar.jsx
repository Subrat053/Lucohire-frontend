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
  HiTrendingUp,
  HiCreditCard,
  HiBriefcase,
  HiMail,
  HiUsers,
  HiClock,
  HiPlusCircle,
  HiPhone,
  HiLockClosed,
} from "react-icons/hi";
import { toOptimizedMediaUrl } from "../../utils/media";
import NotificationBell from "./NotificationBell";
import LanguageDropdown from "../LanguageDropdown";
import useTranslation from "../../hooks/useTranslation";
import toast from "react-hot-toast";

import RoleCompletionModal from "./RoleCompletionModal";

const Navbar = () => {
  const { user, isAuthenticated, logout, switchPanel, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [completionModal, setCompletionModal] = useState({
    open: false,
    role: null,
  });
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const dropdownRef = useRef(null);

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
  const roleList = Array.isArray(user?.roles) ? user.roles : [];
  const isAdminLike =
    activeRole === "admin" ||
    activeRole === "manager" ||
    roleList.includes("admin") ||
    roleList.includes("manager");
  const canSwitchRoles = isAuthenticated && user && !isAdminLike;
  const nextRole = activeRole === "provider" ? "recruiter" : "provider";
  const nextRoleLabel = nextRole === "recruiter" ? "Recruiter" : "Provider";

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    switch (activeRole) {
      case "provider":
        return "/provider/dashboard";
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

  const openRolePanel = async (targetRole) => {
    if (!canSwitchRoles || switchingRole) return;
    if (targetRole !== "provider" && targetRole !== "recruiter") return;

    const targetPath =
      targetRole === "provider"
        ? "/provider/dashboard"
        : "/recruiter/job-postings";

    if (activeRole === targetRole) {
      navigate(targetPath, { replace: true });
      setDropdownOpen(false);
      setMobileOpen(false);
      return;
    }

    setSwitchingRole(true);

    try {
      const response = await switchPanel(targetRole);

      if (response?.needsProfileCompletion) {
        setCompletionModal({ open: true, role: targetRole });
        setDropdownOpen(false);
        setMobileOpen(false);
        return;
      }

      navigate(targetPath, { replace: true });
      setDropdownOpen(false);
      setMobileOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Panel switch failed. Please try again.",
      );
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleCompletion = async (updatedUser) => {
    await refreshUser();
    const targetPath =
      completionModal.role === "provider"
        ? "/provider/dashboard"
        : "/recruiter/job-postings";
    navigate(targetPath, { replace: true });
  };

  const getRoleButtonLabel = (role) => {
    if (role === "provider") {
      return activeRole === "provider"
        ? t("navbar.currentProvider", "Current: Provider")
        : t("navbar.switchToProviderPanel", "Switch to Provider Panel");
    }
    return activeRole === "recruiter"
      ? t("navbar.currentRecruiter", "Current: Recruiter")
      : t("navbar.switchToRecruiterPanel", "Switch to Recruiter Panel");
  };

  const PanelSwitchButtons = ({ mobile = false }) => (
    <div
      className={
        mobile ? "flex flex-col gap-2 py-2" : "flex items-center gap-2"
      }
    >
      <button
        type="button"
        onClick={() => openRolePanel("recruiter")}
        disabled={switchingRole}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm disabled:opacity-60 ${activeRole === "recruiter" ? "border-amber-400 bg-amber-500 text-white" : "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"}`}
      >
        {switchingRole && activeRole !== "recruiter"
          ? t("navbar.openingPanel")
          : getRoleButtonLabel("recruiter")}
      </button>
      <button
        type="button"
        onClick={() => openRolePanel("provider")}
        disabled={switchingRole}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm disabled:opacity-60 ${activeRole === "provider" ? "border-emerald-400 bg-emerald-500 text-white" : "border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200"}`}
      >
        {switchingRole && activeRole !== "provider"
          ? t("navbar.openingPanel")
          : getRoleButtonLabel("provider")}
      </button>
    </div>
  );

  const handleQuickToggle = () => {
    if (!canSwitchRoles || switchingRole) return;
    openRolePanel(nextRole);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            {/* <div className="w-9 h-9 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div> */}
            {/* <span className="text-xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ServiceHub
            </span> */}
            <div className="w-9 h-9 rounded-md bg-[#081B3A] flex items-center justify-center">
              {/* <Plus className="w-5 h-5 text-white" /> */}
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

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3 lg:gap-5">
            <Link
              to="/"
              className="text-gray-600 hover:text-indigo-600 transition font-medium text-sm"
            >
              {t("navbar.home")}
            </Link>
            <Link
              to="/candidate-landing"
              className="text-gray-600 hover:text-indigo-600 transition font-medium text-sm"
            >
              {t("navbar.findJobs", "Find Jobs")}
            </Link>
            <Link
              to="/search"
              className="text-gray-600 hover:text-indigo-600 transition font-medium text-sm"
            >
              {t("navbar.findProviders")}
            </Link>
            <Link
              to="/signup?role=recruiter"
              className="text-gray-600 hover:text-indigo-600 transition font-medium text-sm"
            >
              {t("navbar.hireMe", "Hire Me")}
            </Link>
            {/* <Link to="/contact" className="text-gray-600 hover:text-indigo-600 transition font-medium text-sm">{t('navbar.contactUs', 'Contact Us')}</Link> */}

            {/* <LanguageDropdown /> */}

            {canSwitchRoles && <PanelSwitchButtons />}
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
                      to={getDashboardLink()}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <HiHome className="text-gray-400" aria-hidden="true" />
                      <span>{t("navbar.dashboard")}</span>
                    </Link>
                    {activeRole !== "manager" && (
                      <Link
                        to={`/${activeRole}/profile`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <HiCog className="text-gray-400" aria-hidden="true" />
                        <span>{t("navbar.settings")}</span>
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
            ) : (
              // <div className="flex items-center space-x-3">
              //   <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition">
              //     {t('navbar.login')}
              //   </button>
              //   <button onClick={() => navigate('/signup')} className="rounded-full bg-indigo-600 text-white px-4 py-2  text-sm font-medium hover:bg-indigo-700 transition shadow-sm">
              //     {/* {t('navbar.signup')} */}
              //     Start Earning
              //   </button>
              //   <button onClick={() => navigate('/signup')} className="rounded-full bg-indigo-600 text-white px-4 py-2  text-sm font-medium hover:bg-indigo-700 transition shadow-sm">
              //     {/* {t('navbar.signup')} */}
              //     Earn 40%
              //   </button>
              // </div>
              <div className="flex items-center gap-5">
                {/* <button
                  onClick={() => {
                    if (window.location.pathname === "/") {
                      document
                        .getElementById("referral-section")
                        ?.scrollIntoView({ behavior: "smooth" });
                    } else {
                      navigate("/#referral-section");
                    }
                  }}
                  className="flex items-center gap-1 text-[13px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-all"
                >
                  <span className="text-[15px]">💰</span>
                  <span>{t("navbar.earnFortyPercent", "Earn 40%")}</span>
                </button> */}

                {/* <button
                  onClick={() => {
                    if (window.location.pathname === "/") {
                      document
                        .getElementById("contest-section")
                        ?.scrollIntoView({ behavior: "smooth" });
                    } else {
                      navigate("/#contest-section");
                    }
                  }}
                  className="flex items-center gap-1 text-[13px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-all"
                >
                  <span className="text-[15px]">🏆</span>
                  <span>{t("navbar.winOneLakh", "Win ₹1 Lakh")}</span>
                </button> */}

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
                >
                  {t("navbar.login")}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/signup")}
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
            {canSwitchRoles && (
              <button
                type="button"
                onClick={handleQuickToggle}
                disabled={switchingRole}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm disabled:opacity-60 ${nextRole === "recruiter" ? "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200" : "border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200"}`}
              >
                {switchingRole
                  ? t("navbar.openingPanel")
                  : nextRole === "recruiter"
                    ? t(
                        "navbar.switchToRecruiterPanel",
                        "Switch to Recruiter Panel",
                      )
                    : t(
                        "navbar.switchToProviderPanel",
                        "Switch to Provider Panel",
                      )}
              </button>
            )}
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
                  to="/candidate-landing"
                  className="flex items-center space-x-3 rounded-lg px-3 py-2 text-base font-semibold text-gray-900 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  <HiUsers className="w-5 h-5 text-gray-400" />
                  <span>{t("navbar.findJobs", "Find Jobs")}</span>
                </Link>
                <Link
                  to="/search"
                  className="flex items-center space-x-3 rounded-lg px-3 py-2 text-base font-semibold text-gray-900 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  <HiUsers className="w-5 h-5 text-gray-400" />
                  <span>{t("navbar.findProviders")}</span>
                </Link>
                <Link
                  to="/signup?role=recruiter"
                  className="flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                  onClick={() => setMobileOpen(false)}
                >
                  <HiBriefcase className="w-5 h-5 text-gray-400" />
                  <span>{t("navbar.hireMe", "Hire Me")}</span>
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
                    {
                      label: "Dashboard",
                      path: "/provider/dashboard",
                      icon: HiTrendingUp,
                    },
                    {
                      label: "Wallet",
                      path: "/provider/wallet",
                      icon: HiCreditCard,
                    },
                    {
                      label: "Payment Settings",
                      path: "/provider/payout-settings",
                      icon: HiCog,
                    },
                    {
                      label: "Jobs for Me",
                      path: "/provider/job-for-me",
                      icon: HiBriefcase,
                    },
                    {
                      label: "Messages",
                      path: "/provider/contacted",
                      icon: HiMail,
                    },
                    { label: "Leads", path: "/provider/leads", icon: HiUsers },
                    {
                      label: "History",
                      path: "/provider/history",
                      icon: HiClock,
                    },
                    {
                      label: "Refer & Earn",
                      path: "/provider/referrals",
                      icon: HiPlusCircle,
                    },
                    {
                      label: "My Plan",
                      path: "/provider/my-plan",
                      icon: HiPhone,
                    },
                    {
                      label: "Profile",
                      path: "/provider/profile",
                      icon: HiCog,
                    },
                    {
                      label: "Change Password",
                      path: "/provider/change-password",
                      icon: HiLockClosed,
                    },
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

              {/* Language and Switch Actions */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <LanguageDropdown
                  mobile
                  onChangeComplete={() => setMobileOpen(false)}
                />
                {canSwitchRoles && <PanelSwitchButtons mobile />}
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
                          navigate("/signup");
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
      <RoleCompletionModal
        isOpen={completionModal.open}
        role={completionModal.role}
        onClose={() => setCompletionModal({ open: false, role: null })}
        onComplete={handleCompletion}
      />
    </nav>
  );
};

export default Navbar;
