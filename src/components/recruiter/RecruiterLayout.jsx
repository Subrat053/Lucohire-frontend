import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HiTrendingUp,
  HiUsers,
  HiBriefcase,
  HiCog,
  HiChevronLeft,
  HiChevronRight,
  HiLogout,
  HiMenu,
  HiClock,
  HiDocumentText,
  HiCurrencyRupee,
  HiSparkles,
  HiBookmark,
  HiSearch,
  HiBell,
  HiLockClosed,
  HiPlusCircle,
  HiHome,
  HiCollection,
  HiChatAlt,
  HiCalendar,
  HiClipboardCheck,
  HiChartBar,
  HiLightningBolt,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell';
import LanguageDropdown from '../LanguageDropdown';
import useTranslation from '../../hooks/useTranslation';
import { recruiterAPI } from '../../services/api';

// NEW TABS (from image)
const navItems = [
  { label: 'Hiring Workspace', fallback: 'Hiring Workspace', path: '/recruiter/dashboard', icon: HiHome },
  { label: 'Post Jobs', fallback: 'Post Jobs', path: '/recruiter/jobs', icon: HiBriefcase },
  { label: 'AI Talent Search', fallback: 'AI Talent Search', path: '/recruiter/candidates', icon: HiUsers },
  { label: 'Shortlisted Candidates', fallback: 'Shortlisted Candidates', path: '/recruiter/shortlisted-candidates', icon: HiBookmark },
  { label: 'Talent Pool', fallback: 'Talent Pool', path: '/recruiter/talent-pool', icon: HiCollection },
  { label: 'Outreach', fallback: 'Outreach', path: '/recruiter/outreach', icon: HiChatAlt },
  { label: 'Set Reminder', fallback: 'Set Reminder', path: '/recruiter/tasks', icon: HiClipboardCheck },
  { label: 'Reports & Analytics', fallback: 'Reports & Analytics', path: '/recruiter/reports', icon: HiChartBar },
  { label: 'AI Recruiter Workspace', fallback: 'AI Recruiter Workspace', path: '/recruiter/ai', icon: HiSparkles },
  { label: 'Plans', fallback: 'Plans', path: '/recruiter/plans', icon: HiCurrencyRupee },
  { label: 'Company Profile Settings & Billing', fallback: 'Company Profile Settings & Billing', path: '/recruiter/settings', icon: HiCog },
];

const RecruiterLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const checkViewport = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  useEffect(() => {
    const handleOpenSidebar = () => setMobileOpen(true);
    window.addEventListener('open-recruiter-sidebar', handleOpenSidebar);
    return () => window.removeEventListener('open-recruiter-sidebar', handleOpenSidebar);
  }, []);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const { data } = await recruiterAPI.getDashboard();
        if (data?.stats) {
          if (data.stats.currentPlan) setCurrentPlan(data.stats.currentPlan);
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch plan:', err);
      }
    };
    fetchPlan();
  }, []);

  const handleLogout = () => { logout(); };

  const renderSidebarContent = (onNavClick) => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center px-4 py-4 border-b border-gray-100 ${collapsed ? 'justify-center' : 'space-x-3'}`}>
        <div className="w-8 h-8 bg-[#4a24ba] rounded-lg flex items-center justify-center shrink-0">
          <HiBriefcase className="text-white w-4 h-4" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-[#081B3A] text-sm leading-tight">{t("Recruiter Panel")}</span>
            <span className="text-[10px] font-black text-[#4a24ba] uppercase tracking-wider mt-0.5">{currentPlan.replace('-yearly', '')}{t("PLAN")}</span>
          </div>
        )}
      </div>

      {/* <div className="px-2 py-3 border-b border-gray-100">
        <LanguageDropdown mobile={collapsed} />
      </div> */}

      <nav className="flex-1 py-4 px-2 overflow-y-auto flex flex-col">
        <div className="space-y-1 flex-1">
        {navItems.map(({ label, fallback, path, icon: Icon, badge }) => {
          // const active = location.pathname === path;
          const active = location.pathname === path || location.pathname.startsWith(`${path}/`);
          return (
            <Link
              key={`${path}-${label}`}
              to={path}
              onClick={onNavClick}
              title={collapsed ? label : undefined}
              className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all group
                ${active
                  ? 'bg-[#4a24ba] text-white shadow-sm'
                  : 'text-black hover:bg-gray-200'
                }
                ${collapsed ? 'justify-center' : 'space-x-3'}
              `}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-gray-700 group-hover:text-black'}`} />
              {!collapsed && (
                <div className="flex items-center justify-between w-full">
                  <span>{t(label, fallback)}</span>
                  {badge && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{t('common.new', badge)}</span>}
                </div>
              )}
            </Link>
          );
        })}
        </div>

        {/* Subscription Usage Widget */}
        {(!collapsed && stats) && (
          <div className="mt-8 mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm mx-1 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-900">{t("Subscription Usage")}</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <HiBriefcase className="w-3 h-3 text-blue-500" />
                  <span className="text-[10px] font-semibold text-gray-700">{t("Job Postings")}</span>
                </div>
                <div className="text-sm font-bold text-gray-900 mb-1">
                  {stats.remainingPostLimit === 'unlimited' ? '∞' : stats.remainingPostLimit}
                  {stats.remainingPostLimit !== 'unlimited' && <span className="text-gray-400 font-medium ml-1">{t("left")}</span>}
                </div>
                {stats.remainingPostLimit !== 'unlimited' && (
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, (stats.remainingPostLimit / Math.max(1, (stats.remainingPostLimit + (stats.totalJobsPosted || 0)))) * 100))}%` }}></div>
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <HiUsers className="w-3 h-3 text-green-500" />
                  <span className="text-[10px] font-semibold text-gray-700">{t("Candidate Unlocks")}</span>
                </div>
                <div className="text-sm font-bold text-gray-900 mb-1">
                  {stats.unlocksRemaining} <span className="text-gray-400 font-medium">{t("left")}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-green-700 h-1.5 rounded-full" style={{ width: `${stats.unlocksRemaining > 0 ? 100 : 0}%` }}></div>
                </div>
              </div>

              {(stats.boostJobsRemaining > 0 || stats.currentPlan === 'custom') && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <HiLightningBolt className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-semibold text-gray-700">{t("Job Boosts")}</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 mb-1">
                    {stats.boostJobsRemaining || 0} <span className="text-gray-400 font-medium">{t("left")}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${stats.boostJobsRemaining > 0 ? 100 : 0}%` }}></div>
                  </div>
                </div>
              )}

              {(stats.boostDaysRemaining > 0 || stats.currentPlan === 'custom') && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <HiCalendar className="w-3 h-3 text-purple-500" />
                    <span className="text-[10px] font-semibold text-gray-700">{t("Boost Days")}</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 mb-1">
                    {stats.boostDaysRemaining || 0} <span className="text-gray-400 font-medium">{t("left")}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${stats.boostDaysRemaining > 0 ? 100 : 0}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="shrink-0 px-2 pb-4 border-t border-gray-100 pt-3">
        <button
          onClick={handleLogout}
          title={collapsed ? t('navbar.logout', 'Logout') : undefined}
          className={`flex items-center w-full rounded-xl px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 transition-all
            ${collapsed ? 'justify-center' : 'space-x-3'}
          `}
        >
          <HiLogout className="w-5 h-5 shrink-0" />
          {!collapsed && <span>{t('navbar.logout', 'Logout')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFF] md:flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 shrink-0 sticky top-0 self-start h-screen
        ${collapsed ? 'w-16' : 'w-60'}
      `}>
        {renderSidebarContent()}
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-15 w-6 h-6 bg-cyan-200 border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition z-10"
        >
          {collapsed ? <HiChevronRight className="w-4 h-4 text-gray-900" /> : <HiChevronLeft className="w-4 h-4 text-gray-900" />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-0 left-0 bottom-0 w-64 bg-white shadow-xl flex flex-col transform transition-transform duration-300 animate-slide-in-left">
            {renderSidebarContent(() => setMobileOpen(false))}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 ">
        
        <main className="flex-1 overflow-auto p-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default RecruiterLayout;
