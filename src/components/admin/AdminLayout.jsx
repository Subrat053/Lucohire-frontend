import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HiShieldCheck, HiUsers, HiBriefcase, HiCurrencyRupee, HiCog,
  HiChevronLeft, HiChevronRight, HiLogout, HiMenu, HiX, HiDocumentText, HiShieldExclamation, HiCreditCard, HiCollection, HiGlobe,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import useTranslation from '../../hooks/useTranslation';

const navItems = [
  { labelKey: 'admin.navDashboard',  path: '/admin/dashboard',  icon: HiShieldCheck },
  { labelKey: 'admin.navUsers',      path: '/admin/users',       icon: HiUsers },
  { labelKey: 'admin.navProviders',  path: '/admin/providers',   icon: HiBriefcase },
  { labelKey: 'admin.navRecruiters', path: '/admin/recruiters',  icon: HiUsers },
  { labelKey: 'admin.navSkills',     path: '/admin/skills',      icon: HiCollection },
  { labelKey: 'admin.navPlans',      path: '/admin/plans',       icon: HiCurrencyRupee },
  { labelKey: 'admin.navPayments',   path: '/admin/payments',    icon: HiCreditCard },
  { labelKey: 'admin.navWhatsapp',   path: '/admin/whatsapp',    icon: FaWhatsapp },
  { labelKey: 'admin.navCurrency',   path: '/admin/currency',    icon: HiGlobe },
  { labelKey: 'AI Ops',              path: '/admin/ai',          icon: HiCog, adminOnly: true },
  { labelKey: 'Managers',            path: '/admin/managers',    icon: HiUsers, adminOnly: true },
  { labelKey: 'admin.navSettings',   path: '/admin/settings',    icon: HiCog },
  { labelKey: 'admin.navTerms',      path: '/admin/terms',       icon: HiDocumentText },
  { labelKey: 'admin.navPrivacy',    path: '/admin/privacy',     icon: HiShieldExclamation },
];

const AdminLayout = ({ children }) => {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const SidebarContent = ({ onNavClick }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={`flex items-center px-4 py-5 border-b border-gray-100 ${collapsed ? 'justify-center' : 'space-x-3'}`}>
        <div className="w-8 h-8 bg-linear-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <HiShieldCheck className="text-white w-4 h-4" />
        </div>
        {!collapsed && <span className="font-bold text-gray-800 text-sm">{t('admin.panel')}</span>}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map(({ labelKey, path, icon: Icon, adminOnly }) => {
          const currentRole = user?.activeRole || user?.role;
          if (currentRole === 'manager' && !['/admin/providers', '/admin/recruiters'].includes(path)) return null;
          if (adminOnly && currentRole !== 'admin') return null;
          const label = t(labelKey);
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={onNavClick}
              title={collapsed ? label : undefined}
              className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all group
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
          title={collapsed ? t('navbar.logout') : undefined}
          className={`flex items-center w-full rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-all
            ${collapsed ? 'justify-center' : 'space-x-3'}
          `}
        >
          <HiLogout className="w-5 h-5 shrink-0" />
          {!collapsed && <span>{t('navbar.logout')}</span>}
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
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <HiMenu className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-800 text-sm">{t('admin.panel')}</span>
          <div className="w-8" />
        </div>

        <main className="flex-1 overflow-auto p-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
