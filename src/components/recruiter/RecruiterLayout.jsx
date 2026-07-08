import { useState } from 'react';
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
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell';
import LanguageDropdown from '../LanguageDropdown';
import useTranslation from '../../hooks/useTranslation';

// const navItems = [
//   { label: 'Dashboard', path: '/recruiter/dashboard', icon: HiTrendingUp },
//   { label: 'Job Postings', path: '/recruiter/job-postings', icon: HiBriefcase },
//   { label: 'Interested Candidates', path: '/recruiter/applications', icon: HiUsers },
//   { label: 'AI Smart Search', path: '/recruiter/find-providers', icon: HiSparkles, badge: 'New' },
//   // { label: 'Shortlisted Candidates', path: '/recruiter/history', icon: HiBookmark, badge: '28' },
//   // { label: 'Saved Candidates', path: '/recruiter/history', icon: HiBookmark, badge: '42' },
//   { label: 'Search History', path: '/recruiter/history', icon: HiSearch },
//   { label: 'Plans & Billing', path: '/recruiter/plans', icon: HiCurrencyRupee },
//   // { label: 'Transactions', path: '/recruiter/plans', icon: HiCurrencyRupee },
//   // { label: 'Company Profile', path: '/recruiter/profile', icon: HiDocumentText },
//   { label: 'Settings', path: '/recruiter/profile', icon: HiCog },
// ];

const navItems = [
  { label: 'Dashboard', fallback: 'Dashboard', path: '/recruiter/dashboard', icon: HiTrendingUp },
  // { label: 'Job Postings', path: '/recruiter/post-job', icon: HiBriefcase },
  { label: 'Job Postings', fallback: 'Job Postings', path: '/recruiter/job-postings', icon: HiBriefcase },
  { label: 'Interested Candidates', fallback: 'Interested Candidates', path: '/recruiter/interested-candidates', icon: HiUsers },
  { label: 'Recruiter Copilot', fallback: 'Recruiter Copilot', path: '/recruiter/copilot', icon: HiSparkles, badge: 'AI' },
  { label: 'AI Smart Search', fallback: 'AI Smart Search', path: '/recruiter/ai-smart-search', icon: HiSparkles, badge: 'New' },
  // { label: 'Shortlisted Candidates', fallback: 'Shortlisted Candidates', path: '/recruiter/shortlisted-candidates', icon: HiBookmark },
  { label: 'Saved Candidates', fallback: 'Saved Candidates', path: '/recruiter/saved-candidates', icon: HiBookmark },
  { label: 'Search History', fallback: 'Search History', path: '/recruiter/search-history', icon: HiSearch },
  { label: 'Plans & Billing', fallback: 'Plans & Billing', path: '/recruiter/plans-billing', icon: HiCurrencyRupee },
  { label: 'Transactions', fallback: 'Transactions', path: '/recruiter/transactions', icon: HiCurrencyRupee },
  { label: 'Refer & Earn', fallback: 'Refer & Earn', path: '/recruiter/referrals', icon: HiPlusCircle },
  { label: 'Company Profile', fallback: 'Company Profile', path: '/recruiter/company-profile', icon: HiDocumentText },
  { label: 'Change Password', fallback: 'Change Password', path: '/recruiter/change-password', icon: HiLockClosed },
];
const RecruiterLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); };

  const SidebarContent = ({ onNavClick }) => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center px-4 py-4 border-b border-gray-100 ${collapsed ? 'justify-center' : 'space-x-3'}`}>
        <div className="w-8 h-8 bg-[#0066FF] rounded-lg flex items-center justify-center shrink-0">
          <HiBriefcase className="text-white w-4 h-4" />
        </div>
        {!collapsed && <span className="font-bold text-[#081B3A] text-sm">Recruiter Panel</span>}
      </div>

      {/* <div className="px-2 py-3 border-b border-gray-100">
        <LanguageDropdown mobile={collapsed} />
      </div> */}

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
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
                  ? 'bg-[#0066FF] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
                ${collapsed ? 'justify-center' : 'space-x-3'}
              `}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
              {!collapsed && (
                <div className="flex items-center justify-between w-full">
                  <span>{t(label, fallback)}</span>
                  {badge && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{t('common.new', badge)}</span>}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* {!collapsed && (
        <div className="mx-3 mb-4 rounded-2xl border border-[#E5EAF3] bg-[#F8FAFF] p-4">
          <p className="text-xs font-semibold text-[#081B3A]">{t('recruiter.upgradeTitle', 'Upgrade Your Plan')}</p>
          <p className="text-[11px] text-gray-500 mt-1">{t('recruiter.upgradeSubtitle', 'Unlock more candidate contacts and downloads.')}</p>
          <button
            onClick={() => navigate('/recruiter/plans')}
            className="mt-3 w-full rounded-xl bg-[#0066FF] text-white text-xs font-semibold py-2"
          >
            {t('recruiter.viewPlans', 'View Plans')}
          </button>
        </div>
      )} */}

      <div className="shrink-0 px-2 pb-4 border-t border-gray-100 pt-3">
        <button
          onClick={handleLogout}
          title={collapsed ? t('navbar.logout', 'Logout') : undefined}
          className={`flex items-center w-full rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-all
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
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-15 w-6 h-6 bg-cyan-200 border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition z-10"
        >
          {collapsed ? <HiChevronRight className="w-4 h-4 text-gray-500" /> : <HiChevronLeft className="w-4 h-4 text-gray-500" />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-56 h-full bg-white shadow-xl flex flex-col">
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 ">
        {/* Top Bar */}
        <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-100 px-3 py-3">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 md:hidden">
            <HiMenu className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm text-gray-500">{t('recruiter.welcome', 'Welcome')}, {user?.name || t('recruiter.role', 'Recruiter')}!</span>
          
          <div className="flex items-center gap-2">
            {/* <LanguageDropdown /> */}
            {/* <NotificationBell/> */}
          </div>
        </div>



        <main className="flex-1 overflow-auto p-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default RecruiterLayout;
