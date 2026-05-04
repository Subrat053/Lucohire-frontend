import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false);

  const normalizeUser = (rawUser) => {
    if (!rawUser) return null;

    const roles = Array.isArray(rawUser.roles)
      ? rawUser.roles
      : rawUser.role
        ? [rawUser.role]
        : [];

    let activeRole = rawUser.activeRole || rawUser.role || roles[0] || null;

    if (roles.includes("partner")) activeRole = "partner";
    else if (roles.includes("manager")) activeRole = "manager";
    else if (roles.includes("admin")) activeRole = "admin";

    return {
      ...rawUser,
      roles,
      activeRole,
      role: activeRole,
      approvalStatus: rawUser.approvalStatus || "approved",
      roleIntent:
        rawUser.roleIntent ||
        (roles.includes("provider") && roles.includes("recruiter")
          ? "both"
          : roles[0] || "provider"),
      panelAccess: rawUser.panelAccess || {
        provider: { enabled: false, source: "none" },
        recruiter: { enabled: false, source: "none" },
      },
      activePanel: rawUser.activePanel || activeRole || null,
    };
  };

  const logout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
  };

  const fetchUser = async ({ soft = false } = {}) => {
    try {
      const { data } = await authAPI.getMe();
      const normalizedUser = normalizeUser(data?.data?.user || data.user);

      if (!normalizedUser) {
        if (!soft) logout();
        return null;
      }

      const storedToken = localStorage.getItem("userToken");

      setUser(normalizedUser);
      setProfile(data?.data?.profile || data.profile || null);
      setIsAuthenticated(!!storedToken);

      if (storedToken) setToken(storedToken);
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      return normalizedUser;
    } catch (error) {
      if (!soft) logout();
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem("userToken");
        const savedUser = localStorage.getItem("user");

        if (storedToken && savedUser) {
          const normalized = normalizeUser(JSON.parse(savedUser));

          setToken(storedToken);
          setUser(normalized);
          setIsAuthenticated(true);

          await fetchUser({ soft: true });
        } else {
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        logout();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const saveUserSession = ({ token: nextToken, user: nextUser }) => {
    if (!nextToken || !nextUser) return null;

    const normalizedUser = normalizeUser(nextUser);

    localStorage.setItem("userToken", nextToken);
    localStorage.setItem("user", JSON.stringify(normalizedUser));

    setToken(nextToken);
    setUser(normalizedUser);
    setIsAuthenticated(true);

    return normalizedUser;
  };

  const login = (userData, tokenValue) => {
    const normalizedUser = normalizeUser(userData);
    const resolvedToken = tokenValue || localStorage.getItem("userToken");

    if (resolvedToken) {
      localStorage.setItem("userToken", resolvedToken);
    }

    localStorage.setItem("user", JSON.stringify(normalizedUser));

    setToken(resolvedToken || null);
    setUser(normalizedUser);
    setIsAuthenticated(!!resolvedToken);

    fetchUser({ soft: true });

    if (
      normalizedUser &&
      !["admin", "manager", "partner"].includes(normalizedUser.activeRole) &&
      !normalizedUser.phone &&
      !normalizedUser.whatsappNumber
    ) {
      setTimeout(() => setShowWhatsAppPrompt(true), 1500);
    }

    return normalizedUser;
  };

  const loginUser = async (credentials) => {
    const { data } = await authAPI.loginEmail(credentials);
    const authData = data?.data || {};
    const normalizedUser = saveUserSession(authData);
    return { ...authData, user: normalizedUser || authData.user };
  };

  const loginWithFirebase = async (payload) => {
    const { data } = await authAPI.phoneLogin(payload);
    const authData = data?.data || {};
    const normalizedUser = saveUserSession(authData);
    return { ...authData, user: normalizedUser || authData.user };
  };

  const switchRole = async (nextRole) => {
    const { data } = await authAPI.switchRole({ role: nextRole });
    const nextToken = data?.data?.token || data.token || localStorage.getItem("userToken");

    if (nextToken) {
      localStorage.setItem("userToken", nextToken);
      setToken(nextToken);
    }

    const freshUser = await fetchUser({ soft: true });

    return { user: freshUser, profile };
  };

  const switchPanel = async (nextPanel) => {
    const { data } = await authAPI.switchPanel({ panel: nextPanel });
    const nextToken = data?.data?.token || data.token || localStorage.getItem("userToken");

    if (nextToken) {
      localStorage.setItem("userToken", nextToken);
      setToken(nextToken);
    }

    const freshUser = await fetchUser({ soft: true });

    return { user: freshUser, profile };
  };

  const value = {
    user,
    token,
    role: user?.activeRole || user?.role || null,
    profile,
    loading,
    isAuthenticated,
    login,
    saveUserSession,
    loginUser,
    loginWithFirebase,
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