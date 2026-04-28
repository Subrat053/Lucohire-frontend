import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import ScrollToTop from "./components/common/ScrollToTop";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/common/ProtectedRoute";
import WhatsAppNumberModal from "./components/common/WhatsAppNumberModal";
import AIChatWidget from "./components/common/AIChatWidget";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";

import LandingPage from "./pages/LandingPage";
import SearchPage from "./pages/SearchPage";
import ProviderPublicProfile from "./pages/ProviderPublicProfile";
import FaqPage from "./pages/Faq";
import TermsPage from "./pages/Terms";
import PrivacyPage from "./pages/Privacy";
import ProfilePage from "./pages/ProfilePage";

import ProviderDashboard from "./pages/provider/Dashboard";
import ProviderProfile from "./pages/provider/Profile";
import ProviderPlans from "./pages/provider/Plans";
import ProviderLeads from "./pages/provider/Leads";
import ProviderHistory from "./pages/provider/History";
import ProviderJobs from "./pages/provider/Jobs";
import ProviderContacted from "./pages/provider/Contacted";

import RecruiterDashboard from "./pages/recruiter/Dashboard";
import RecruiterPostJob from "./pages/recruiter/PostJob";
import RecruiterPlans from "./pages/recruiter/Plans";
import RecruiterProfile from "./pages/recruiter/Profile";
import RecruiterHistory from "./pages/recruiter/History";
import RecruiterFindProviders from "./pages/recruiter/FindProviders";
import RecruiterApplications from "./pages/recruiter/Applications";
import PendingApproval from "./pages/PendingApproval";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminProviders from "./pages/admin/Providers";
import AdminRecruiters from "./pages/admin/Recruiters";
import AdminPlans from "./pages/admin/Plans";
import AdminSettings from "./pages/admin/Settings";
import AdminTerms from "./pages/admin/Terms";
import AdminPrivacy from "./pages/admin/Privacy";
import AdminPayments from "./pages/admin/Payments";
import AdminSkills from "./pages/admin/Skills";
import AdminWhatsApp from "./pages/admin/WhatsApp";
import AdminCurrency from "./pages/admin/Currency";
import AdminManagers from "./pages/admin/Managers";
import AdminAIOps from "./pages/admin/AIControlCenter";

import AdminLayout from "./components/admin/AdminLayout";
import ProviderLayout from "./components/provider/ProviderLayout";
import RecruiterLayout from "./components/recruiter/RecruiterLayout";
import useTranslation from "./hooks/useTranslation";

function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function App() {
  const { user, showWhatsAppPrompt, setShowWhatsAppPrompt } = useAuth();
  const { t } = useTranslation();
  const wrap = (children) => <MainLayout>{children}</MainLayout>;

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
      <WhatsAppNumberModal isOpen={showWhatsAppPrompt} onClose={() => setShowWhatsAppPrompt(false)} />
      {user?.activeRole && ['recruiter', 'admin'].includes(user.activeRole) && (
        <AIChatWidget role={user.activeRole} />
      )}
      <Routes>
        {/* Auth pages - full screen, no Navbar/Footer */}
        <Route path="/login"  element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />

        {/* Public Routes */}
        <Route path="/" element={wrap(<LandingPage />)} />
        <Route path="/search" element={wrap(<SearchPage />)} />
        <Route path="/provider/:id" element={wrap(<ProviderPublicProfile />)} />
        <Route path="/faq" element={wrap(<FaqPage />)} />
        <Route path="/terms" element={wrap(<TermsPage />)} />
        <Route path="/privacy" element={wrap(<PrivacyPage />)} />
        <Route path="/profile/:id" element={wrap(
          <ProtectedRoute allowedRoles={["provider", "recruiter", "admin"]}>
            <ProfilePage />
          </ProtectedRoute>
        )} />
        <Route path="/pending-approval" element={wrap(
          <ProtectedRoute allowedRoles={["provider", "recruiter"]}>
            <PendingApproval />
          </ProtectedRoute>
        )} />

        {/* Provider Routes */}
        <Route path="/provider/dashboard" element={wrap(
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderLayout><ProviderDashboard /></ProviderLayout>
          </ProtectedRoute>
        )} />
        <Route path="/provider/profile" element={wrap(
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderLayout><ProviderProfile /></ProviderLayout>
          </ProtectedRoute>
        )} />
        <Route path="/provider/plans" element={wrap(
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderLayout><ProviderPlans /></ProviderLayout>
          </ProtectedRoute>
        )} />
        <Route path="/provider/leads" element={wrap(
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderLayout><ProviderLeads /></ProviderLayout>
          </ProtectedRoute>
        )} />
        <Route path="/provider/history" element={wrap(
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderLayout><ProviderHistory /></ProviderLayout>
          </ProtectedRoute>
        )} />
        <Route path="/provider/find-recruiters" element={wrap(
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderLayout><ProviderJobs /></ProviderLayout>
          </ProtectedRoute>
        )} />
        <Route path="/provider/contacted" element={wrap(
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderLayout><ProviderContacted /></ProviderLayout>
          </ProtectedRoute>
        )} />

        {/* Recruiter Routes */}
        <Route path="/recruiter/dashboard" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterDashboard /></RecruiterLayout>
          </ProtectedRoute>
        )} />
        <Route path="/recruiter/post-job" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterPostJob /></RecruiterLayout>
          </ProtectedRoute>
        )} />
        <Route path="/recruiter/plans" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterPlans /></RecruiterLayout>
          </ProtectedRoute>
        )} />
        <Route path="/recruiter/profile" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterProfile /></RecruiterLayout>
          </ProtectedRoute>
        )} />
        <Route path="/recruiter/history" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterHistory /></RecruiterLayout>
          </ProtectedRoute>
        )} />
        <Route path="/recruiter/find-providers" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterFindProviders /></RecruiterLayout>
          </ProtectedRoute>
        )} />
        <Route path="/recruiter/applications" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterApplications /></RecruiterLayout>
          </ProtectedRoute>
        )} />
        <Route path="/recruiter/provider/:id" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><ProviderPublicProfile /></RecruiterLayout>
          </ProtectedRoute>
        )} />
        <Route path="/recruiter/pending-approval" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <PendingApproval />
          </ProtectedRoute>
        )} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={wrap(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminDashboard /></AdminLayout>
          </ProtectedRoute>
        )} />
        <Route path="/admin/users" element={wrap(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminUsers /></AdminLayout>
          </ProtectedRoute>
        )} />
        <Route path="/admin/providers" element={wrap(
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <AdminLayout><AdminProviders /></AdminLayout>
          </ProtectedRoute>
        )} />
        <Route path="/admin/recruiters" element={wrap(
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <AdminLayout><AdminRecruiters /></AdminLayout>
          </ProtectedRoute>
        )} />
        <Route path="/admin/recruiter" element={wrap(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminRecruiters /></AdminLayout>
          </ProtectedRoute>
        )} />
        <Route path="/admin/recriters" element={wrap(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminRecruiters /></AdminLayout>
          </ProtectedRoute>
        )} />
        <Route path="/admin/plans" element={wrap(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminPlans /></AdminLayout>
          </ProtectedRoute>
        )} />
        <Route path="/admin/settings" element={wrap(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminSettings /></AdminLayout>
          </ProtectedRoute>
        )} />
        <Route path="/admin/managers" element={wrap(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminManagers /></AdminLayout>
          </ProtectedRoute>
        )} />
        <Route path="/admin/payments" element={wrap(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminPayments /></AdminLayout>
          </ProtectedRoute>
        )} />
        <Route path="/admin/terms" element={wrap(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminTerms /></AdminLayout>
          </ProtectedRoute>
        )} />
        <Route path="/admin/privacy" element={wrap(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminPrivacy /></AdminLayout>
          </ProtectedRoute>
        )} />
        <Route path="/admin/skills" element={wrap(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminSkills /></AdminLayout>
          </ProtectedRoute>
        )} />
        <Route path="/admin/whatsapp" element={wrap(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminWhatsApp /></AdminLayout>
          </ProtectedRoute>
        )} />
        <Route path="/admin/currency" element={wrap(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminCurrency /></AdminLayout>
          </ProtectedRoute>
        )} />
        <Route path="/admin/ai" element={wrap(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminAIOps /></AdminLayout>
          </ProtectedRoute>
        )} />

        {/* 404 */}
        <Route path="*" element={wrap(
          <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <h1 className="text-6xl font-bold text-gray-200">404</h1>
            <p className="text-gray-500 mt-2">{t('common.pageNotFound')}</p>
            <a href="/" className="mt-4 text-blue-600 hover:text-blue-700 font-medium">{t('common.goHome')}</a>
          </div>
        )} />
      </Routes>
    </Router>
  );
}

export default App;
