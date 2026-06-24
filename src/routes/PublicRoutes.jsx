import { lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

const LandingPage = lazy(() => import("../pages/LandingPage"));
const SearchPage = lazy(() => import("../pages/SearchPage"));
const ProviderPublicProfile = lazy(() => import("../pages/ProviderPublicProfile"));
const FaqPage = lazy(() => import("../pages/Faq"));
const TermsPage = lazy(() => import("../pages/Terms"));
const PrivacyPage = lazy(() => import("../pages/Privacy"));
const RefundPolicyPage = lazy(() => import("../pages/RefundPolicy"));
const RenewalPolicyPage = lazy(() => import("../pages/RenewalPolicy"));
const PricingPage = lazy(() => import("../pages/Pricing"));
const AboutPage = lazy(() => import("../pages/AboutPage"))
const ContactUs = lazy(() => import("../pages/ContactUs"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const PendingApproval = lazy(() => import("../pages/PendingApproval"));
const ExternalMatch = lazy(() => import("../pages/recruiter/ExternalMatch"));
const ProviderSharedProfile = lazy(() => import("../pages/ProviderSharedProfile"));

function MainLayout({ children }) {
  const location = useLocation();
  const publicPaths = ["/", "/search", "/faq", "/terms", "/privacy", "/refund-policy", "/renewal-policy", "/pricing", "/contact", "/about"];
  const privateProviderPaths = [
    "/provider/dashboard",
    "/provider/profile",
    "/provider/plans",
    "/provider/my-plan",
    "/provider/customise-plan",
    "/provider/leads",
    "/provider/history",
    "/provider/job-for-me",
    "/provider/jobs",
    "/provider/contacted",
    "/provider/change-password",
    "/provider/referrals",
    "/provider/wallet",
    "/provider/payout-settings",
  ];
  
  const isPublicProviderProfile =
    location.pathname.startsWith("/p/") &&
    location.pathname.split("/").filter(Boolean).length === 2;
    
  const isSharedProfile =
    location.pathname.startsWith("/profile/share/") &&
    location.pathname.split("/").filter(Boolean).length === 3;
    
  const showFooter =
    publicPaths.includes(location.pathname) ||
    isPublicProviderProfile ||
    isSharedProfile;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}

export default function PublicRoutes() {
  const wrap = (children) => <MainLayout>{children}</MainLayout>;
  
  return (
    <Routes>
      {/* Public Pages with Navbar/Footer */}
      <Route path="" element={wrap(<LandingPage />)} />
      <Route path="search" element={wrap(<SearchPage />)} />
      <Route path="external-match" element={wrap(<ExternalMatch />)} />
      <Route path="p/:id" element={wrap(<ProviderPublicProfile />)} />
      <Route path="faq" element={wrap(<FaqPage />)} />
      <Route path="terms" element={wrap(<TermsPage />)} />
      <Route path="privacy" element={wrap(<PrivacyPage />)} />
      <Route path="refund-policy" element={wrap(<RefundPolicyPage />)} />
      <Route path="renewal-policy" element={wrap(<RenewalPolicyPage />)} />
      <Route path="pricing" element={wrap(<PricingPage />)} />
      <Route path="about" element={wrap(<AboutPage />)} />
      <Route path="contact" element={wrap(<ContactUs />)} />

      {/* Protected Shared Pages */}
      <Route path="profile/:id" element={wrap(
        <ProtectedRoute allowedRoles={["provider", "recruiter"]}>
          <ProfilePage />
        </ProtectedRoute>
      )} />

      {/* Public secure shareable preview profile */}
      <Route path="profile/share/:token" element={wrap(<ProviderSharedProfile />)} />
      {/* Approval holding page — auth required but NO role/approval gate (avoids circular redirect) */}
      <Route path="pending-approval" element={wrap(
        <ProtectedRoute>
          <PendingApproval />
        </ProtectedRoute>
      )} />
    </Routes>
  );
}
