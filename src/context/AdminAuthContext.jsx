import { createContext, useContext, useEffect, useState } from "react";
import { adminAPI } from "../services/api";

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initAdminAuth = async () => {
      const storedToken = localStorage.getItem("adminToken");
      const storedAdmin = localStorage.getItem("admin");

      if (storedToken && storedAdmin) {
        try {
          setToken(storedToken);
          setAdmin(JSON.parse(storedAdmin));
          setIsAuthenticated(true);
          await fetchAdmin();
        } catch {
          logout();
        }
      }

      if (mounted) setLoading(false);
    };

    initAdminAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const saveAdminSession = ({ token: nextToken, admin: nextAdmin }) => {
    if (!nextToken || !nextAdmin) return;
    console.log("[SAVE ADMIN SESSION]", nextAdmin);
    localStorage.setItem("adminToken", nextToken);
    localStorage.setItem("admin", JSON.stringify(nextAdmin));
    setToken(nextToken);
    setAdmin(nextAdmin);
    setIsAuthenticated(true);
  };

  const loginAdmin = async (credentials) => {
    const { data } = await adminAPI.login(credentials);
    console.log("[ADMIN LOGIN RESPONSE]", data);
    const authData = data?.data || {};
    saveAdminSession(authData);
    return authData;
  };

  const fetchAdmin = async () => {
    try {
      const { data } = await adminAPI.getMe();
      const adminData = data?.data?.admin || data?.admin || null;
      if (adminData) {
        setAdmin(adminData);
        localStorage.setItem("admin", JSON.stringify(adminData));
        setIsAuthenticated(true);
      }
    } catch {
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    setToken(null);
    setAdmin(null);
    setIsAuthenticated(false);
  };

  const value = {
    admin,
    token,
    loading,
    isAuthenticated,
    saveAdminSession,
    loginAdmin,
    fetchAdmin,
    logout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext;
