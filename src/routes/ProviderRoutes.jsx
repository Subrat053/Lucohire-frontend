import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import ProviderLayout from "../components/provider/ProviderLayout";
import Navbar from "../components/common/Navbar";

// Lazy-loaded pages
const ProviderDashboard = lazy(() => import("../pages/provider/Dashboard"));
const ProviderProfile = lazy(() => import("../pages/provider/Profile"));
const ProviderPlans = lazy(() => import("../pages/provider/Plans"));
const CustomPlan = lazy(() => import("../pages/provider/CustomPlan"));
const ProviderLeads = lazy(() => import("../pages/provider/Leads"));
const ProviderHistory = lazy(() => import("../pages/provider/History"));
const ProviderJobs = lazy(() => import("../pages/provider/Jobs"));
const ProviderContacted = lazy(() => import("../pages/provider/Contacted"));
const ChangePassword = lazy(() => import("../pages/user/ChangePassword"));
const ReferralManagement = lazy(() => import("../pages/user/ReferralManagement"));
const ProviderWallet = lazy(() => import("../pages/provider/Wallet"));
const ProviderPayoutSettings = lazy(() => import("../pages/provider/PayoutSettings"));

function ProviderLayoutWrapper({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <ProtectedRoute allowedRoles={["provider"]}>
          <ProviderLayout>{children}</ProviderLayout>
        </ProtectedRoute>
      </main>
    </div>
  );
}

export default function ProviderRoutes() {
  const wrap = (children) => <ProviderLayoutWrapper>{children}</ProviderLayoutWrapper>;
  
  return (
    <Routes>
      <Route path="dashboard" element={wrap(<ProviderDashboard />)} />
      <Route path="profile" element={wrap(<ProviderProfile />)} />
      <Route path="plans" element={wrap(<ProviderPlans />)} />
      <Route path="my-plan" element={wrap(<ProviderPlans />)} />
      <Route path="customise-plan" element={wrap(<CustomPlan />)} />
      <Route path="leads" element={wrap(<ProviderLeads />)} />
      <Route path="history" element={wrap(<ProviderHistory />)} />
      <Route path="job-for-me" element={wrap(<ProviderJobs />)} />
      <Route path="contacted" element={wrap(<ProviderContacted />)} />
      <Route path="change-password" element={wrap(<ChangePassword />)} />
      <Route path="referrals" element={wrap(<ReferralManagement />)} />
      <Route path="wallet" element={wrap(<ProviderWallet />)} />
      <Route path="payout-settings" element={wrap(<ProviderPayoutSettings />)} />
    </Routes>
  );
}
