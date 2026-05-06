import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { adminAPI, authAPI } from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const getDashboardByRole = (role) => {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "partner":
    case "manager":
      return "/partner/dashboard";
    case "provider":
      return "/provider/dashboard";
    case "recruiter":
      return "/recruiter/dashboard";
    default:
      return "/";
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const clearAuthStorage = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("userToken");
    localStorage.removeItem("providerToken");
    localStorage.removeItem("recruiterToken");
    localStorage.removeItem("managerToken");
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
  }, []);

  const migrateLegacyToken = useCallback(() => {
    const legacyToken =
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken") ||
      localStorage.getItem("userToken") ||
      localStorage.getItem("providerToken") ||
      localStorage.getItem("recruiterToken") ||
      localStorage.getItem("managerToken");

    if (legacyToken && !localStorage.getItem("authToken")) {
      localStorage.setItem("authToken", legacyToken);
    }

    return localStorage.getItem("authToken");
  }, []);

  const loadCachedUser = useCallback(() => {
    const raw =
      localStorage.getItem("authUser") ||
      localStorage.getItem("user") ||
      localStorage.getItem("admin");
    if (!raw) return null;
    try {
      return normalizeUser(JSON.parse(raw));
    } catch (_) {
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
    setProfile(null);
    setShowWhatsAppPrompt(false);
    window.location.href = "/";
  }, [clearAuthStorage]);

  const refreshUser = useCallback(async () => {
    let resolvedUser = null;
    const token = migrateLegacyToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return null;
    }

    try {
      const { data } = await authAPI.getMe();
      const currentUser = normalizeUser(data?.data?.user || data.user);
      if (currentUser) {
        resolvedUser = currentUser;
        setUser(currentUser);
        setProfile(data?.data?.profile || data.profile || null);
        localStorage.setItem("authUser", JSON.stringify(currentUser));
        setLoading(false);
        return currentUser;
      }
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        try {
          const { data } = await adminAPI.getMe();
          const adminUser = normalizeUser(data?.data?.admin || data.admin);
          if (adminUser) {
            resolvedUser = adminUser;
            setUser(adminUser);
            setProfile(null);
            localStorage.setItem("authUser", JSON.stringify(adminUser));
            setLoading(false);
            return adminUser;
          }
        } catch (adminError) {
          const adminStatus = adminError?.response?.status;
          if (adminStatus === 401 || adminStatus === 403) {
            clearAuthStorage();
            setUser(null);
            setProfile(null);
            setLoading(false);
            return null;
          }
        }
      }

      const cachedUser = loadCachedUser();
      if (cachedUser) {
        resolvedUser = cachedUser;
        setUser(cachedUser);
        setProfile(cachedUser?.profile || null);
      }
    } finally {
      setLoading(false);
    }

    return resolvedUser;
  }, [clearAuthStorage, loadCachedUser, migrateLegacyToken]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handler = () => {
      if (localStorage.getItem("authToken")) {
        logout();
      }
    };
    window.addEventListener("auth:invalid-token", handler);
    return () => window.removeEventListener("auth:invalid-token", handler);
  }, [logout]);

  const saveUserSession = useCallback(
    ({ token: nextToken, user: nextUser }) => {
      if (!nextToken || !nextUser) return null;

      const normalizedUser = normalizeUser(nextUser);
      localStorage.setItem("authToken", nextToken);
      localStorage.setItem("authUser", JSON.stringify(normalizedUser));

      setUser(normalizedUser);
      return normalizedUser;
    },
    [],
  );

  const login = async (credentials, options = {}) => {
    const mode = options.mode || options.role || "user";
    const response =
      mode === "admin"
        ? await adminAPI.login(credentials)
        : await authAPI.loginEmail(credentials);

    const data = response?.data || {};
    const token =
      data?.data?.token ||
      data?.token ||
      data?.accessToken ||
      data?.data?.accessToken;
    const loggedUser =
      data?.data?.user ||
      data?.data?.admin ||
      data?.user ||
      data?.admin;

    if (!token || !loggedUser) {
      throw new Error("Login response missing token or user");
    }

    const normalizedUser = normalizeUser(loggedUser);
    localStorage.setItem("authToken", token);
    localStorage.setItem("authUser", JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    setProfile(data?.data?.profile || data?.profile || null);

    if (
      normalizedUser &&
      !["admin", "manager", "partner"].includes(normalizedUser.activeRole) &&
      !normalizedUser.phone &&
      !normalizedUser.whatsappNumber
    ) {
      setTimeout(() => setShowWhatsAppPrompt(true), 1500);
    }

    return {
      user: normalizedUser,
      role: normalizedUser?.activeRole || normalizedUser?.role,
      redirectTo: getDashboardByRole(normalizedUser?.activeRole || normalizedUser?.role),
    };
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
    const nextToken =
      data?.data?.token ||
      data?.token ||
      localStorage.getItem("authToken");

    if (nextToken) {
      localStorage.setItem("authToken", nextToken);
    }

    const freshUser = await refreshUser();

    return { user: freshUser, profile };
  };

  const switchPanel = async (nextPanel) => {
    const { data } = await authAPI.switchPanel({ panel: nextPanel });
    const nextToken =
      data?.data?.token ||
      data?.token ||
      localStorage.getItem("authToken");

    if (nextToken) {
      localStorage.setItem("authToken", nextToken);
    }

    const freshUser = await refreshUser();

    return { user: freshUser, profile };
  };

  const role = user?.activeRole || user?.role || null;
  const isAuthenticated = Boolean(user && localStorage.getItem("authToken"));

  const value = {
    user,
    profile,
    role,
    loading,
    isAuthenticated,
    login,
    loginUser,
    loginWithFirebase,
    logout,
    refreshUser,
    switchRole,
    switchPanel,
    saveUserSession,
    setProfile,
    showWhatsAppPrompt,
    setShowWhatsAppPrompt,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;