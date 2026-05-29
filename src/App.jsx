import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import ScrollToTop from "./components/common/ScrollToTop";
import RouteLoader from "./components/common/RouteLoader";
import NotFound from "./components/common/NotFound";
import { useAuth } from "./context/AuthContext";

// Lazy-loaded global modals/widgets
const WhatsAppNumberModal = lazy(() => import("./components/common/WhatsAppNumberModal"));
const CookieConsent = lazy(() => import("./components/common/CookieConsent"));
const AIChatWidget = lazy(() => import("./components/common/AIChatWidget"));

// Route Groups
const PublicRoutes = lazy(() => import("./routes/PublicRoutes"));
const ProviderRoutes = lazy(() => import("./routes/ProviderRoutes"));
const RecruiterRoutes = lazy(() => import("./routes/RecruiterRoutes"));
const AdminRoutes = lazy(() => import("./routes/AdminRoutes"));
const PartnerRoutes = lazy(() => import("./routes/PartnerRoutes"));

function App() {
  const { user, showWhatsAppPrompt, setShowWhatsAppPrompt } = useAuth();

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: "12px", background: "#333", color: "#fff", fontSize: "14px" },
        }}
      />
      <ScrollToTop />
      
      <Suspense fallback={null}>
        <WhatsAppNumberModal isOpen={showWhatsAppPrompt} onClose={() => setShowWhatsAppPrompt(false)} />
      </Suspense>
      <Suspense fallback={null}>
        <CookieConsent />
      </Suspense>
      {user?.activeRole && ['recruiter', 'admin'].includes(user.activeRole) && (
        <Suspense fallback={null}>
          <AIChatWidget role={user.activeRole} />
        </Suspense>
      )}

      <Suspense fallback={<RouteLoader />}>
        <Routes>
          {/* Provider Panel Routes */}
          <Route path="/provider/*" element={<ProviderRoutes />} />

          {/* Recruiter Panel Routes */}
          <Route path="/recruiter/*" element={<RecruiterRoutes />} />

          {/* Admin Panel Routes */}
          <Route path="/admin/*" element={<AdminRoutes />} />

          {/* Partner Panel Routes */}
          <Route path="/partner/*" element={<PartnerRoutes />} />

          {/* Public & Common Shared Routes */}
          <Route path="/*" element={<PublicRoutes />} />

          {/* 404 — role-aware */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
