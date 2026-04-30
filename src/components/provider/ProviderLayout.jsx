import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HiTrendingUp, HiUsers, HiPhone, HiCog, HiChevronLeft, HiChevronRight, HiLogout, HiMenu, HiX, HiClock, HiBriefcase, HiMail,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell';

const navItems = [
  { label: 'Dashboard',      path: '/provider/dashboard',      icon: HiTrendingUp },
  { label: 'Find Recruiters',path: '/provider/find-recruiters',icon: HiBriefcase },
  { label: 'Messages',       path: '/provider/contacted',      icon: HiMail },
  { label: 'Leads',          path: '/provider/leads',          icon: HiUsers },
  { label: 'History',        path: '/provider/history',        icon: HiClock },
  { label: 'My Plan',        path: '/provider/plans',          icon: HiPhone },
  { label: 'Profile',        path: '/provider/profile',        icon: HiCog },
];

const ProviderLayout = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const SidebarContent = ({ onNavClick }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={`flex items-center px-4 py-5 border-b border-gray-100 ${collapsed ? 'justify-center' : 'space-x-3'}`}>
        <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
          <HiTrendingUp className="text-white w-4 h-4" />
        </div>
        {!collapsed && <span className="font-bold text-gray-800 text-sm">Provider Panel</span>}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map(({ label, path, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={onNavClick}
              title={collapsed ? label : undefined}
              className={`flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all group
                ${active
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
                ${collapsed ? 'justify-center' : 'space-x-3'}
              `}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="shrink-0 px-2 pb-4 border-t border-gray-100 pt-3">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`flex items-center w-full rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-all
            ${collapsed ? 'justify-center' : 'space-x-3'}
          `}
        >
          <HiLogout className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex">
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 md:hidden">
            <HiMenu className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-800 text-sm md:hidden">Provider Panel</span>
          <span className="hidden md:block" />
          <NotificationBell />
        </div>

        <main className="flex-1 overflow-auto p-0 ">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ProviderLayout;
