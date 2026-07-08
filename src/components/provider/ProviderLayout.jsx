import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HiTrendingUp, HiUsers, HiPhone, HiCog, HiChevronLeft, HiChevronRight, HiLogout, HiMenu, HiX, HiClock, HiBriefcase, HiMail, HiLockClosed, HiPlusCircle, HiCreditCard, HiUserAdd, HiSparkles, HiChatAlt2
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell';
import LanguageDropdown from '../LanguageDropdown';
import useTranslation from '../../hooks/useTranslation';

const navItems = [
  { label: 'Dashboard', fallback: 'Dashboard', path: '/provider/dashboard',      icon: HiTrendingUp },
  { label: 'Profile', fallback: 'Profile', path: '/provider/profile',        icon: HiCog },
  { 
    label: 'AI Report', 
    fallback: 'AI Report', 
    path: '/provider/career-health',
    icon: HiTrendingUp,
  },
  { 
    label: 'Grow with AI', 
    fallback: 'Grow with AI', 
    path: '/provider/grow-with-ai',
    icon: HiSparkles,
  },
  { 
    label: 'AI Tips', 
    fallback: 'AI Tips', 
    path: '/provider/ai-tips',
    icon: HiSparkles,
  },
  { label: 'Jobs for Me', fallback: 'Jobs for Me', path: '/provider/job-for-me',icon: HiBriefcase },
  { label: 'My Plan', fallback: 'My Plan', path: '/provider/my-plan',          icon: HiPhone },
  { label: 'Refer & Earn', fallback: 'Refer & Earn', path: '/provider/referrals', icon: HiPlusCircle },
  { label: 'Add Member', fallback: 'Add Member', path: '/provider/add-member', icon: HiUserAdd },
  { label: 'Messages', fallback: 'Messages', path: '/provider/contacted',      icon: HiMail },
  { label: 'Leads', fallback: 'Leads', path: '/provider/leads',          icon: HiUsers },
  
  { label: 'History', fallback: 'History', path: '/provider/history',        icon: HiClock },
  { label: 'Wallet', fallback: 'Wallet', path: '/provider/wallet',              icon: HiCreditCard },
  { label: 'Payment Settings', fallback: 'Payment Settings', path: '/provider/payout-settings', icon: HiCog },
  { 
    label: 'Support', 
    fallback: 'Support', 
    path: '/provider/support',
    icon: HiChatAlt2
  },
  { label: 'Change Password', fallback: 'Change Password', path: '/provider/change-password', icon: HiLockClosed },
];

const ProviderLayout = ({ children }) => {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const impersonatorRestriction = localStorage.getItem('impersonatorRestriction');
  const displayedNavItems = impersonatorRestriction === 'payment' 
    ? navItems.filter(item => item.path === '/provider/payout-settings')
    : impersonatorRestriction === 'manager_support'
      ? navItems.filter(item => item.path === '/provider/profile' || item.path === '/provider/job-for-me')
      : navItems;

  const handleLogout = () => { logout(); };

  const SidebarContent = ({ onNavClick }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={`flex items-center px-4 py-5 border-b border-gray-100 ${collapsed ? 'justify-center' : 'space-x-3'}`}>
        <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
          <HiTrendingUp className="text-white w-4 h-4" />
        </div>
        {!collapsed && <span className="font-bold text-gray-800 text-sm">{t('provider.panel', 'Provider Panel')}</span>}
      </div>

      {/* <div className="px-2 py-3 border-b border-gray-100">
        <LanguageDropdown mobile={collapsed} />
      </div> */}

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {displayedNavItems.map((item) => {
          const { label, fallback, path, icon: Icon, subItems } = item;
          const active = location.pathname === path || (path && location.pathname.startsWith(path + '/')) || (subItems && subItems.some(sub => location.pathname === sub.path));

          return (
            <div key={path || label} className="flex flex-col">
              {path ? (
                <Link
                  to={path}
                  onClick={onNavClick}
                  title={collapsed ? label : undefined}
                  className={`flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all group
                    ${active && !subItems
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                    ${collapsed ? 'justify-center' : 'space-x-3'}
                  `}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${active && !subItems ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  {!collapsed && <span>{t(label, fallback)}</span>}
                </Link>
              ) : (
                <div
                  title={collapsed ? label : undefined}
                  className={`flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all group text-gray-800 bg-gray-50
                    ${collapsed ? 'justify-center' : 'space-x-3'}
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0 text-gray-500" />
                  {!collapsed && <span className="font-bold">{t(label, fallback)}</span>}
                </div>
              )}

              {subItems && !collapsed && (
                <div className="ml-8 mt-1 space-y-1 flex flex-col">
                  {subItems.map((sub) => {
                    const subActive = location.pathname === sub.path;
                    return (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        onClick={onNavClick}
                        className={`text-xs px-3 py-2 rounded-md font-medium transition-colors ${
                          subActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {t(sub.label, sub.fallback)}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
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
    <div className="flex flex-col md:flex-row min-h-screen">
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className={`hidden md:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)]
          ${collapsed ? 'w-16' : 'w-56'}
        `}>
          <SidebarContent />
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition z-10"
          >
            {collapsed ? <HiChevronRight className="w-3 h-3 text-gray-500" /> : <HiChevronLeft className="w-3 h-3 text-gray-500" />}
          </button>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Active Panel Identifier Header */}
          <div className="bg-[#081B3A] text-white px-6 py-4 flex items-center justify-between shadow-xs select-none">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Provider Panel</span>
              <span className="text-slate-500 text-xs">/</span>
              <span className="text-sm font-extrabold text-blue-400 tracking-wide">
                {(() => {
                  const currentNav = navItems.find(item => location.pathname === item.path) || 
                                     navItems.find(item => location.pathname.startsWith(item.path));
                  return currentNav ? t(currentNav.label, currentNav.fallback) : 'Panel';
                })()}
              </span>
            </div>
            <div className="hidden sm:block text-xs font-bold text-slate-400">
              Active Session
            </div>
          </div>
          <main className="flex-1 overflow-auto p-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProviderLayout;
