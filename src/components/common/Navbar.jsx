import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HiMenu, HiX, HiUser, HiLogout, HiCog, HiHome } from 'react-icons/hi';
import { toAbsoluteMediaUrl } from '../../utils/media';
import LanguageDropdown from '../LanguageDropdown';
import useTranslation from '../../hooks/useTranslation';
import toast from 'react-hot-toast';

const Navbar = () => {
  // const { user, isAuthenticated, logout, switchRole } = useAuth();
  const { user, isAuthenticated, logout, switchPanel } = useAuth();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const navigate = useNavigate();
  const activeRole = user?.activeRole || user?.role;
  const roleList = Array.isArray(user?.roles) ? user.roles : [];
  const isAdminLike = activeRole === 'admin' || activeRole === 'manager' || roleList.includes('admin') || roleList.includes('manager');
  const canSwitchRoles = isAuthenticated && user && !isAdminLike;
  const nextRole = activeRole === 'provider' ? 'recruiter' : 'provider';
  const nextRoleLabel = nextRole === 'recruiter' ? 'Recruiter' : 'Provider';

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  // const getDashboardLink = () => {
  //   if (!user) return '/';
  //   switch (activeRole) {
  //     case 'provider': return '/provider/dashboard';
  //     case 'recruiter': return '/recruiter/dashboard';
  //     case 'admin': return '/admin/dashboard';
  //     case 'manager': return '/admin/providers';
  //     default: return '/';
  //   }
  // };
  const getDashboardLink = () => {
    if (!user) return '/';
    switch (activeRole) {
      case 'provider': return '/provider/dashboard';
      case 'recruiter': return '/recruiter/job-postings';
      case 'admin': return '/admin/dashboard';
      case 'manager': return '/admin/providers';
      default: return '/';
    }
  };

  // const openRolePanel = async (targetRole) => {
  //   if (!canSwitchRoles || switchingRole) return;
  //   if (targetRole !== 'provider' && targetRole !== 'recruiter') return;

  //   if (activeRole === targetRole) {
  //     navigate(`/${targetRole}/dashboard?showSubscriptionPopup=1`);
  //     setDropdownOpen(false);
  //     setMobileOpen(false);
  //     return;
  //   }

  //   setSwitchingRole(true);
  //   try {
  //     const result = await switchRole(targetRole);
  //     const switchedRole = result?.user?.activeRole || targetRole;
  //     const shouldOpenPopup = switchedRole === 'provider' || switchedRole === 'recruiter';
  //     navigate(`/${switchedRole}/dashboard${shouldOpenPopup ? '?showSubscriptionPopup=1' : ''}`);
  //     setDropdownOpen(false);
  //     setMobileOpen(false);
  //   } catch (error) {
  //     console.error(error);
  //     toast.error(error?.response?.data?.message || 'Role switch failed. Please try again.');
  //   } finally {
  //     setSwitchingRole(false);
  //   }
  // };
  const openRolePanel = async (targetRole) => {
    if (!canSwitchRoles || switchingRole) return;
    if (targetRole !== 'provider' && targetRole !== 'recruiter') return;

    const targetPath =
      targetRole === 'provider'
        ? '/provider/dashboard'
        : '/recruiter/job-postings';

    if (activeRole === targetRole) {
      navigate(targetPath, { replace: true });
      setDropdownOpen(false);
      setMobileOpen(false);
      return;
    }

    setSwitchingRole(true);

    try {
      await switchPanel(targetRole);

      navigate(targetPath, { replace: true });

      setDropdownOpen(false);
      setMobileOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
        'Panel switch failed. Please try again.'
      );
    } finally {
      setSwitchingRole(false);
    }
  };

  const getRoleButtonLabel = (role) => {
    if (role === 'provider') {
      return activeRole === 'provider' ? `Current: Provider` : `Switch to : Provider`;
    }
    return activeRole === 'recruiter' ? `Current: Recruiter` : `Switch to : Recruiter`;
  };

  const PanelSwitchButtons = ({ mobile = false }) => (
    <div className={mobile ? 'flex flex-col gap-2 py-2' : 'flex items-center gap-2'}>
      <button
        onClick={() => openRolePanel('recruiter')}
        disabled={switchingRole}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm disabled:opacity-60 ${activeRole === 'recruiter' ? 'border-amber-400 bg-amber-500 text-white' : 'border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200'}`}
      >
        {switchingRole && activeRole !== 'recruiter' ? t('navbar.openingPanel') : getRoleButtonLabel('recruiter')}
      </button>
      <button
        onClick={() => openRolePanel('provider')}
        disabled={switchingRole}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm disabled:opacity-60 ${activeRole === 'provider' ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200'}`}
      >
        {switchingRole && activeRole !== 'provider' ? t('navbar.openingPanel') : getRoleButtonLabel('provider')}
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
              <p className="font-extrabold text-[#081B3A] tracking-tight">Lucohire</p>
              <p className="text-[9px] font-semibold tracking-[0.2em] text-[#6B7280] mt-0.5">AI HIRING</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3 lg:gap-5">
            <Link to="/" className="text-gray-600 hover:text-indigo-600 transition font-medium text-sm">{t('navbar.home')}</Link>
            <Link to="/search" className="text-gray-600 hover:text-indigo-600 transition font-medium text-sm">{t('navbar.findProviders')}</Link>
            <LanguageDropdown />
            {canSwitchRoles && <PanelSwitchButtons />}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1.5 hover:bg-gray-100 transition"
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
                    {user?.profilePhoto ? (
                      <img
                        src={
                          toAbsoluteMediaUrl(user.profilePhoto)
                        }
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <HiUser className="text-indigo-600" />
                    )}
                  </div>
                  <span className="max-w-24 truncate text-sm font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium text-sm">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full font-medium capitalize">{activeRole}</span>
                    </div>
                    <Link to={getDashboardLink()} onClick={() => setDropdownOpen(false)} className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <HiHome className="text-gray-400" /><span>{t('navbar.dashboard')}</span>
                    </Link>
                    {activeRole !== 'manager' && (
                      <Link to={`/${activeRole}/profile`} onClick={() => setDropdownOpen(false)} className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <HiCog className="text-gray-400" /><span>{t('navbar.settings')}</span>
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <HiLogout className="text-red-400" /><span>{t('navbar.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition">
                  {t('navbar.login')}
                </button>
                <button onClick={() => navigate('/signup')} className="rounded-full bg-indigo-600 text-white px-4 py-2  text-sm font-medium hover:bg-indigo-700 transition shadow-sm">
                  {/* {t('navbar.signup')} */}
                  Start Earning
                </button>
              </div>
            )}
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-2">
            {canSwitchRoles && (
              <button
                onClick={handleQuickToggle}
                disabled={switchingRole}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm disabled:opacity-60 ${nextRole === 'recruiter' ? 'border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200' : 'border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200'}`}
              >
                {switchingRole ? t('navbar.openingPanel') : `Switch to : ${nextRoleLabel}`}
              </button>
            )}
            <button className="p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-fade-in">
            <Link to="/" className="block py-2 text-gray-600 hover:text-indigo-600" onClick={() => setMobileOpen(false)}>{t('navbar.home')}</Link>
            <Link to="/search" className="block py-2 text-gray-600 hover:text-indigo-600" onClick={() => setMobileOpen(false)}>{t('navbar.findProviders')}</Link>
            <LanguageDropdown mobile onChangeComplete={() => setMobileOpen(false)} />
            {canSwitchRoles && <PanelSwitchButtons mobile />}
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()} className="block py-2 text-gray-600 hover:text-indigo-600" onClick={() => setMobileOpen(false)}>{t('navbar.dashboard')}</Link>
                <button onClick={handleLogout} className="block py-2 text-red-600">{t('navbar.logout')}</button>
              </>
            ) : (
              <div className="flex space-x-3 mt-3">
                <button onClick={() => { navigate('/login'); setMobileOpen(false); }} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium">{t('navbar.login')}</button>
                <button onClick={() => { navigate('/signup'); setMobileOpen(false); }} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium">{t('navbar.signup')}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
