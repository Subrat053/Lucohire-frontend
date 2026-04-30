import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false);

  const normalizeUser = (rawUser) => {
    if (!rawUser) return null;
    const roles = Array.isArray(rawUser.roles) ? rawUser.roles : (rawUser.role ? [rawUser.role] : []);
    let activeRole = rawUser.activeRole || rawUser.role || roles[0] || null;
    if (roles.includes('admin')) activeRole = 'admin';
    else if (roles.includes('manager')) activeRole = 'manager';
    return {
      ...rawUser,
      roles,
      activeRole,
      role: activeRole,
      approvalStatus: rawUser.approvalStatus || 'pending',
      roleIntent: rawUser.roleIntent || (roles.includes('provider') && roles.includes('recruiter') ? 'both' : roles[0] || 'provider'),
      panelAccess: rawUser.panelAccess || { provider: { enabled: false, source: 'none' }, recruiter: { enabled: false, source: 'none' } },
      activePanel: rawUser.activePanel || activeRole || null,
    };
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(normalizeUser(JSON.parse(savedUser)));
          setIsAuthenticated(true);
          await fetchUser();
        } catch {
          logout();
        }
      }

      if (mounted) setLoading(false);
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await authAPI.getMe();
      const normalizedUser = normalizeUser(data.user);
      setUser(normalizedUser);
      setProfile(data.profile);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
    } catch {
      logout();
    }
  };

  const login = (userData, token) => {
    const normalizedUser = normalizeUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    setIsAuthenticated(true);
    fetchUser();
    // Prompt for WhatsApp number if user signed up via email/google and doesn't have one (not for admins)
    if (normalizedUser && !['admin', 'manager'].includes(normalizedUser.activeRole) && !normalizedUser.phone && !normalizedUser.whatsappNumber) {
      setTimeout(() => setShowWhatsAppPrompt(true), 1500);
    }
  };

  const switchRole = async (nextRole) => {
    const { data } = await authAPI.switchRole({ role: nextRole });
    const token = data.token || localStorage.getItem('token');

    if (token) localStorage.setItem('token', token);
    const { data: meData } = await authAPI.getMe();
    const normalizedUser = normalizeUser(meData.user);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    setProfile(meData.profile || null);
    setIsAuthenticated(true);

    return { user: normalizedUser, profile: meData.profile || null };
  };

  const switchPanel = async (nextPanel) => {
    const { data } = await authAPI.switchPanel({ panel: nextPanel });
    const token = data.token || localStorage.getItem('token');

    if (token) localStorage.setItem('token', token);
    const { data: meData } = await authAPI.getMe();
    const normalizedUser = normalizeUser(meData.user);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    setProfile(meData.profile || null);
    setIsAuthenticated(true);

    return { user: normalizedUser, profile: meData.profile || null };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    profile,
    loading,
    isAuthenticated,
    login,
    logout,
    switchRole,
    switchPanel,
    fetchUser,
    setProfile,
    showWhatsAppPrompt,
    setShowWhatsAppPrompt,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
