import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import RecruiterLayout from "../components/recruiter/RecruiterLayout";
import Navbar from "../components/common/Navbar";

// Lazy-loaded pages
const RecruiterDashboard = lazy(() => import("../pages/recruiter/Dashboard"));
const RecruiterPostJob = lazy(() => import("../pages/recruiter/PostJob"));
const RecruiterPlans = lazy(() => import("../pages/recruiter/Plans"));
const RecruiterProfile = lazy(() => import("../pages/recruiter/Profile"));
const RecruiterHistory = lazy(() => import("../pages/recruiter/History"));
const RecruiterFindProviders = lazy(() => import("../pages/recruiter/FindProviders"));
const RecruiterApplications = lazy(() => import("../pages/recruiter/Applications"));
const ProviderPublicProfile = lazy(() => import("../pages/ProviderPublicProfile"));
const PendingApproval = lazy(() => import("../pages/PendingApproval"));
const RecruiterJobPostings = lazy(() => import("../pages/recruiter/JobPostings"));
const TopMatches = lazy(() => import("../pages/recruiter/TopMatches"));
const RecruiterShortlistedCandidates = lazy(() => import("../pages/recruiter/ShortlistedCandidates"));
const RecruiterSavedCandidates = lazy(() => import("../pages/recruiter/SavedCandidates"));
const RecruiterSearchHistory = lazy(() => import("../pages/recruiter/SearchHistory"));
const RecruiterTransactions = lazy(() => import("../pages/recruiter/Transactions"));
const RecruiterSettings = lazy(() => import("../pages/recruiter/Settings"));
const ChangePassword = lazy(() => import("../pages/user/ChangePassword"));
const ReferralManagement = lazy(() => import("../pages/user/ReferralManagement"));

function RecruiterLayoutWrapper({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <ProtectedRoute allowedRoles={["recruiter"]}>
          <RecruiterLayout>{children}</RecruiterLayout>
        </ProtectedRoute>
      </main>
    </div>
  );
}

export default function RecruiterRoutes() {
  const wrap = (children) => <RecruiterLayoutWrapper>{children}</RecruiterLayoutWrapper>;
  
  return (
    <Routes>
      <Route path="dashboard" element={wrap(<RecruiterDashboard />)} />
      <Route path="post-job" element={wrap(<RecruiterPostJob />)} />
      <Route path="plans" element={wrap(<RecruiterPlans />)} />
      <Route path="profile" element={wrap(<RecruiterProfile />)} />
      <Route path="history" element={wrap(<RecruiterHistory />)} />
      <Route path="find-providers" element={wrap(<RecruiterFindProviders />)} />
      <Route path="applications" element={wrap(<RecruiterApplications />)} />
      <Route path="provider/:id" element={wrap(<ProviderPublicProfile />)} />
      <Route path="pending-approval" element={wrap(<PendingApproval />)} />
      <Route path="job-postings" element={wrap(<RecruiterJobPostings />)} />
      <Route path="top-matches" element={wrap(<TopMatches />)} />
      <Route path="interested-candidates" element={wrap(<RecruiterApplications />)} />
      <Route path="ai-smart-search" element={wrap(<RecruiterFindProviders />)} />
      <Route path="shortlisted-candidates" element={wrap(<RecruiterShortlistedCandidates />)} />
      <Route path="saved-candidates" element={wrap(<RecruiterSavedCandidates />)} />
      <Route path="search-history" element={wrap(<RecruiterSearchHistory />)} />
      <Route path="plans-billing" element={wrap(<RecruiterPlans />)} />
      <Route path="transactions" element={wrap(<RecruiterTransactions />)} />
      <Route path="company-profile" element={wrap(<RecruiterProfile />)} />
      <Route path="settings" element={wrap(<RecruiterSettings />)} />
      <Route path="change-password" element={wrap(<ChangePassword />)} />
      <Route path="referrals" element={wrap(<ReferralManagement />)} />
    </Routes>
  );
}
