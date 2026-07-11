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
  { label: 'Dashboard', fallback: 'Dashboard', path: '/recruiter/dashboard', icon: HiHome },
  { label: 'Jobs', fallback: 'Jobs', path: '/recruiter/jobs', icon: HiBriefcase },
  { label: 'Candidates', fallback: 'Candidates', path: '/recruiter/candidates', icon: HiUsers },
  { label: 'Talent Pool', fallback: 'Talent Pool', path: '/recruiter/talent-pool', icon: HiCollection },
  { label: 'Outreach', fallback: 'Outreach', path: '/recruiter/outreach', icon: HiChatAlt },
  { label: 'Tasks', fallback: 'Tasks', path: '/recruiter/tasks', icon: HiClipboardCheck },
  { label: 'Reports', fallback: 'Reports', path: '/recruiter/reports', icon: HiChartBar },
  { label: 'AI Copilot', fallback: 'AI Copilot', path: '/recruiter/ai', icon: HiSparkles },
  { label: 'Plans & Billing', fallback: 'Plans & Billing', path: '/recruiter/plans', icon: HiCurrencyRupee },
  { label: 'Settings', fallback: 'Settings', path: '/recruiter/settings', icon: HiCog },
];

const RecruiterLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const { data } = await recruiterAPI.getDashboard();
        if (data?.stats?.currentPlan) {
          setCurrentPlan(data.stats.currentPlan);
        }
      } catch (err) {
        console.error('Failed to fetch plan:', err);
      }
    };
    fetchPlan();
  }, []);

  const handleLogout = () => { logout(); };

  const SidebarContent = ({ onNavClick }) => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center px-4 py-4 border-b border-gray-100 ${collapsed ? 'justify-center' : 'space-x-3'}`}>
        <div className="w-8 h-8 bg-[#0066FF] rounded-lg flex items-center justify-center shrink-0">
          <HiBriefcase className="text-white w-4 h-4" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-[#081B3A] text-sm leading-tight">Recruiter Panel</span>
            <span className="text-[10px] font-black text-[#0066FF] uppercase tracking-wider mt-0.5">{currentPlan.replace('-yearly', '')} PLAN</span>
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
        </div>

        {/* Subscription Usage Widget */}
        {!collapsed && (
          <div className="mt-8 mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm mx-1 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-900">Subscription Usage</p>
              <HiChevronRight className="w-3 h-3 text-gray-400" />
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <HiSparkles className="w-3 h-3 text-yellow-500" />
                  <span className="text-[10px] font-semibold text-gray-600">Featured Job Credits</span>
                </div>
                <div className="text-sm font-bold text-gray-900 mb-1">12 <span className="text-gray-400 font-medium">/ 20</span></div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <HiLightningBolt className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] font-semibold text-gray-600">Urgent Hiring Slots</span>
                </div>
                <div className="text-sm font-bold text-gray-900 mb-1">5 <span className="text-gray-400 font-medium">/ 10</span></div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
            </div>

            <button className="mt-4 w-full rounded-xl border border-indigo-100 bg-white text-indigo-600 hover:bg-indigo-50 text-xs font-bold py-2 transition">
              Manage Subscription
            </button>
          </div>
        )}
      </nav>

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
