import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import ScrollToTop from "./components/common/ScrollToTop";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminProtectedRoute from "./components/common/AdminProtectedRoute";
import WhatsAppNumberModal from "./components/common/WhatsAppNumberModal";
import CookieConsent from "./components/common/CookieConsent";
import RouteLoader from "./components/common/RouteLoader";
import NotFound from "./components/common/NotFound";
import { useAuth } from "./context/AuthContext";
import PartnerProtectedRoute from "./components/common/PartnerProtectedRoute";

import AdminLayout from "./components/admin/AdminLayout";
import ProviderLayout from "./components/provider/ProviderLayout";
import RecruiterLayout from "./components/recruiter/RecruiterLayout";
import useTranslation from "./hooks/useTranslation";

const AIChatWidget = lazy(() => import("./components/common/AIChatWidget"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const ChangePassword = lazy(() => import("./pages/user/ChangePassword"));
const ReferralManagement = lazy(() => import("./pages/user/ReferralManagement"));
const MagicLinkVerify = lazy(() => import("./pages/auth/MagicLinkVerify"));

const LandingPage = lazy(() => import("./pages/LandingPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ProviderPublicProfile = lazy(() => import("./pages/ProviderPublicProfile"));
const FaqPage = lazy(() => import("./pages/Faq"));
const TermsPage = lazy(() => import("./pages/Terms"));
const PrivacyPage = lazy(() => import("./pages/Privacy"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ContactUs = lazy(() => import("./pages/ContactUs"));

const ProviderDashboard = lazy(() => import("./pages/provider/Dashboard"));
const ProviderProfile = lazy(() => import("./pages/provider/Profile"));
const ProviderPlans = lazy(() => import("./pages/provider/Plans"));
const CustomPlan = lazy(() => import("./pages/provider/CustomPlan"));
const ProviderLeads = lazy(() => import("./pages/provider/Leads"));
const ProviderHistory = lazy(() => import("./pages/provider/History"));
const ProviderJobs = lazy(() => import("./pages/provider/Jobs"));
const ProviderContacted = lazy(() => import("./pages/provider/Contacted"));
const ProviderWallet = lazy(() => import("./pages/provider/Wallet"));
const ProviderPayoutSettings = lazy(() => import("./pages/provider/PayoutSettings"));

const RecruiterDashboard = lazy(() => import("./pages/recruiter/Dashboard"));
const RecruiterPostJob = lazy(() => import("./pages/recruiter/PostJob"));
const RecruiterPlans = lazy(() => import("./pages/recruiter/Plans"));
const RecruiterProfile = lazy(() => import("./pages/recruiter/Profile"));
const RecruiterHistory = lazy(() => import("./pages/recruiter/History"));
const RecruiterFindProviders = lazy(() => import("./pages/recruiter/FindProviders"));
const RecruiterApplications = lazy(() => import("./pages/recruiter/Applications"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));

const RecruiterJobPostings = lazy(() => import("./pages/recruiter/JobPostings"));
const RecruiterShortlistedCandidates = lazy(() => import("./pages/recruiter/ShortlistedCandidates"));
const RecruiterSavedCandidates = lazy(() => import("./pages/recruiter/SavedCandidates"));
const RecruiterSearchHistory = lazy(() => import("./pages/recruiter/SearchHistory"));
const RecruiterTransactions = lazy(() => import("./pages/recruiter/Transactions"));
const RecruiterSettings = lazy(() => import("./pages/recruiter/Settings"));
const TopMatches = lazy(() => import("./pages/recruiter/TopMatches"));
const ExternalMatch = lazy(() => import("./pages/recruiter/ExternalMatch"));

const PartnerLayout = lazy(() => import("./pages/partner/PartnerLayout"));
const PartnerDashboard = lazy(() => import("./pages/partner/PartnerDashboard"));
const PartnerPayouts = lazy(() => import("./pages/partner/PartnerPayouts"));
const CreatePartnerProvider = lazy(() => import("./pages/partner/CreatePartnerProvider"));
const CreatePartnerRecruiter = lazy(() => import("./pages/partner/CreatePartnerRecruiter"));
const PartnerBankDetails = lazy(() => import("./pages/partner/PartnerBankDetails"));

const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const Partners = lazy(() => import("./pages/admin/Partners"));
const PartnerReferrals = lazy(() => import("./pages/admin/PartnerReferrals"));
const AdminManagerBankAccounts = lazy(() => import("./pages/admin/ManagerBankAccounts"));
const AdminPartnerPayouts = lazy(() => import("./pages/admin/AdminPartnerPayouts"));
const AdminReferrals = lazy(() => import("./pages/admin/AdminReferrals"));
const AdminCommissions = lazy(() => import("./pages/admin/AdminCommissions"));
const AdminRewardPool = lazy(() => import("./pages/admin/AdminRewardPool"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminProviders = lazy(() => import("./pages/admin/Providers"));
const AdminRecruiters = lazy(() => import("./pages/admin/Recruiters"));
const ProfilePhotoApprovals = lazy(() => import("./pages/admin/ProfilePhotoApprovals"));
const AdminPlans = lazy(() => import("./pages/admin/Plans"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminTerms = lazy(() => import("./pages/admin/Terms"));
const AdminPrivacy = lazy(() => import("./pages/admin/Privacy"));
const AdminPayments = lazy(() => import("./pages/admin/Payments"));
const AdminProviderSubscriptions = lazy(() => import("./pages/admin/ProviderSubscriptions"));
const AdminSkills = lazy(() => import("./pages/admin/Skills"));
const AdminWhatsApp = lazy(() => import("./pages/admin/WhatsApp"));
const AdminCurrency = lazy(() => import("./pages/admin/Currency"));
const AdminManagers = lazy(() => import("./pages/admin/Managers"));
const AdminAIOps = lazy(() => import("./pages/admin/AIControlCenter"));
const AdminEnquiries = lazy(() => import("./pages/admin/Enquiries"));
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals"));
const AdminCommissionSettings = lazy(() => import("./pages/admin/AdminCommissionSettings"));

function MainLayout({ children }) {
  const location = useLocation();
  const publicPaths = ["/", "/search", "/faq", "/terms", "/privacy", "/contact"];
  const privateProviderPaths = [
    "/provider/dashboard",
    "/provider/profile",
    "/provider/plans",
    "/provider/my-plan",
    "/provider/customise-plan",
    "/provider/leads",
    "/provider/history",
    "/provider/job-for-me",
    "/provider/contacted",
    "/provider/change-password",
    "/provider/referrals",
    "/provider/wallet",
    "/provider/payout-settings",
  ];
  const isPublicProviderProfile =
    location.pathname.startsWith("/provider/") &&
    !privateProviderPaths.includes(location.pathname) &&
    location.pathname.split("/").filter(Boolean).length === 2;
  const showFooter = publicPaths.includes(location.pathname) || isPublicProviderProfile;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
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
      <CookieConsent />
      {user?.activeRole && ['recruiter', 'admin'].includes(user.activeRole) && (
        <Suspense fallback={null}>
          <AIChatWidget role={user.activeRole} />
        </Suspense>
      )}
      <Suspense fallback={<RouteLoader />}>
        <Routes>
        {/* Auth pages - full screen, no Navbar/Footer */}
        <Route path="/auth" element={<Navigate to="/signup" replace />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/auth/magic" element={<MagicLinkVerify />} />

        {/* Public Routes */}
        <Route path="/" element={wrap(<LandingPage />)} />
        <Route path="/search" element={wrap(<SearchPage />)} />
        <Route path="/auth/magic-verify" element={wrap(<MagicLinkVerify />)} />
        <Route path="/external-match" element={wrap(<ExternalMatch />)} />
        <Route path="/provider/:id" element={wrap(<ProviderPublicProfile />)} />
        <Route path="/faq" element={wrap(<FaqPage />)} />
        <Route path="/terms" element={wrap(<TermsPage />)} />
        <Route path="/privacy" element={wrap(<PrivacyPage />)} />
        <Route path="/contact" element={wrap(<ContactUs />)} />

        <Route path="/profile/:id" element={wrap(
          <ProtectedRoute allowedRoles={["provider", "recruiter"]}>
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
        <Route path="/provider/my-plan" element={wrap(
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderLayout><ProviderPlans /></ProviderLayout>
          </ProtectedRoute>
        )} />
        <Route path="/provider/customise-plan" element={wrap(
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderLayout><CustomPlan /></ProviderLayout>
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
        <Route path="/provider/job-for-me" element={wrap(
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderLayout><ProviderJobs /></ProviderLayout>
          </ProtectedRoute>
        )} />
        <Route path="/provider/contacted" element={wrap(
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderLayout><ProviderContacted /></ProviderLayout>
          </ProtectedRoute>
        )} />
        <Route path="/provider/change-password" element={wrap(
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderLayout><ChangePassword /></ProviderLayout>
          </ProtectedRoute>
        )} />
        <Route path="/provider/referrals" element={wrap(
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderLayout><ReferralManagement /></ProviderLayout>
          </ProtectedRoute>
        )} />
        <Route path="/provider/wallet" element={wrap(
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderLayout><ProviderWallet /></ProviderLayout>
          </ProtectedRoute>
        )} />
        <Route path="/provider/payout-settings" element={wrap(
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderLayout><ProviderPayoutSettings /></ProviderLayout>
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
        {/* =============================================================================== */}

        <Route path="/recruiter/job-postings" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterJobPostings /></RecruiterLayout>
          </ProtectedRoute>
        )} />

        <Route path="/recruiter/top-matches" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><TopMatches /></RecruiterLayout>
          </ProtectedRoute>
        )} />

        <Route path="/recruiter/interested-candidates" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterApplications /></RecruiterLayout>
          </ProtectedRoute>
        )} />

        <Route path="/recruiter/ai-smart-search" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterFindProviders /></RecruiterLayout>
          </ProtectedRoute>
        )} />

        <Route path="/recruiter/shortlisted-candidates" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterShortlistedCandidates /></RecruiterLayout>
          </ProtectedRoute>
        )} />

        <Route path="/recruiter/saved-candidates" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterSavedCandidates /></RecruiterLayout>
          </ProtectedRoute>
        )} />

        <Route path="/recruiter/search-history" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterSearchHistory /></RecruiterLayout>
          </ProtectedRoute>
        )} />

        <Route path="/recruiter/plans-billing" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterPlans /></RecruiterLayout>
          </ProtectedRoute>
        )} />

        <Route path="/recruiter/transactions" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterTransactions /></RecruiterLayout>
          </ProtectedRoute>
        )} />

        <Route path="/recruiter/company-profile" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterProfile /></RecruiterLayout>
          </ProtectedRoute>
        )} />

        <Route path="/recruiter/settings" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><RecruiterSettings /></RecruiterLayout>
          </ProtectedRoute>
        )} />
        <Route path="/recruiter/change-password" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><ChangePassword /></RecruiterLayout>
          </ProtectedRoute>
        )} />
        <Route path="/recruiter/referrals" element={wrap(
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout><ReferralManagement /></RecruiterLayout>
          </ProtectedRoute>
        )} />
        {/* =============================================================================== */}
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminDashboard /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/withdrawals" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminWithdrawals /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/commission-settings" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminCommissionSettings /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/partners" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><Partners /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/partners/:partnerId/referrals" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><PartnerReferrals /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/manager-bank-accounts" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminManagerBankAccounts /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/partner-payouts" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminPartnerPayouts /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/referrals" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminReferrals /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/commissions" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminCommissions /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/reward-pool" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminRewardPool /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/users" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminUsers /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/providers" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminProviders /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/recruiters" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminRecruiters /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/recruiter" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminRecruiters /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/recriters" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminRecruiters /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/plans" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminPlans /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/settings" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminSettings /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/managers" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminManagers /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/payments" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminPayments /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/provider-subscriptions" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminProviderSubscriptions /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/terms" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminTerms /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/privacy" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminPrivacy /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/skills" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminSkills /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/whatsapp" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminWhatsApp /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/currency" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminCurrency /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/ai" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminAIOps /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/profile-photo-approvals" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><ProfilePhotoApprovals /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/enquiries" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><AdminEnquiries /></AdminLayout>
          </AdminProtectedRoute>
        )} />
        <Route path="/admin/change-password" element={wrap(
          <AdminProtectedRoute>
            <AdminLayout><ChangePassword /></AdminLayout>
          </AdminProtectedRoute>
        )} />


        <Route path="/partner/dashboard" element={
          <PartnerProtectedRoute>
            <PartnerLayout><PartnerDashboard /></PartnerLayout>
          </PartnerProtectedRoute>
        } />

        <Route path="/partner/payouts" element={
          <PartnerProtectedRoute>
            <PartnerLayout><PartnerPayouts /></PartnerLayout>
          </PartnerProtectedRoute>
        } />

        <Route path="/partner/create-provider" element={
          <PartnerProtectedRoute>
            <PartnerLayout><CreatePartnerProvider /></PartnerLayout>
          </PartnerProtectedRoute>
        } />

        <Route path="/partner/create-recruiter" element={
          <PartnerProtectedRoute>
            <PartnerLayout><CreatePartnerRecruiter /></PartnerLayout>
          </PartnerProtectedRoute>
        } />
        <Route path="/partner/bank-details" element={
          <PartnerProtectedRoute>
            <PartnerLayout><PartnerBankDetails /></PartnerLayout>
          </PartnerProtectedRoute>
        } />

        <Route path="/partner/change-password" element={
          <PartnerProtectedRoute>
            <PartnerLayout><ChangePassword /></PartnerLayout>
          </PartnerProtectedRoute>
        } />

        {/* 404 — role-aware: authenticated users go to dashboard, guests see a proper 404 */}
        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
