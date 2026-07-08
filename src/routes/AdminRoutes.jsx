import { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminProtectedRoute from "../components/common/AdminProtectedRoute";
import AdminLayout from "../components/admin/AdminLayout";
import Navbar from "../components/common/Navbar";
import Seo from "../components/common/Seo";

// Lazy-loaded pages
const AdminDashboard = lazy(() => import("../pages/admin/Dashboard"));
const AdminWithdrawals = lazy(() => import("../pages/admin/AdminWithdrawals"));
const AdminCommissionSettings = lazy(() => import("../pages/admin/AdminCommissionSettings"));
const Partners = lazy(() => import("../pages/admin/Partners"));
const PartnerReferrals = lazy(() => import("../pages/admin/PartnerReferrals"));
const AdminManagerBankAccounts = lazy(() => import("../pages/admin/ManagerBankAccounts"));
const AdminPartnerPayouts = lazy(() => import("../pages/admin/AdminPartnerPayouts"));
const AdminReferrals = lazy(() => import("../pages/admin/AdminReferrals"));
const AdminCommissions = lazy(() => import("../pages/admin/AdminCommissions"));
const AdminRewardPool = lazy(() => import("../pages/admin/AdminRewardPool"));
const AdminUsers = lazy(() => import("../pages/admin/Users"));
const AdminProviders = lazy(() => import("../pages/admin/Providers"));
const AdminRecruiters = lazy(() => import("../pages/admin/Recruiters"));
const AdminPlans = lazy(() => import("../pages/admin/Plans"));
const AdminSettings = lazy(() => import("../pages/admin/Settings"));
const AdminManagers = lazy(() => import("../pages/admin/Managers"));
const AdminSupportIssues = lazy(() => import("../pages/admin/AdminSupportIssues"));
const ProfileUnlocker = lazy(() => import("../pages/admin/ProfileUnlocker"));
const AdminPayments = lazy(() => import("../pages/admin/Payments"));
const AdminStagingCandidates = lazy(() => import("../pages/admin/StagingCandidates"));
const AdminProviderSubscriptions = lazy(() => import("../pages/admin/ProviderSubscriptions"));
const AdminTerms = lazy(() => import("../pages/admin/Terms"));
const AdminPrivacy = lazy(() => import("../pages/admin/Privacy"));
const AdminRefundPolicy = lazy(() => import("../pages/admin/RefundPolicy"));
const AdminRenewalPolicy = lazy(() => import("../pages/admin/RenewalPolicy"));
const AdminFaq = lazy(() => import("../pages/admin/Faq"));
const AdminAbout = lazy(() => import("../pages/admin/About"));
const AdminSkills = lazy(() => import("../pages/admin/Skills"));
const AdminWhatsApp = lazy(() => import("../pages/admin/WhatsApp"));
const AdminCurrency = lazy(() => import("../pages/admin/Currency"));
const AdminCountries = lazy(() => import("../pages/admin/Countries"));
const AdminAIOps = lazy(() => import("../pages/admin/AIControlCenter"));
const ProfileApprovals = lazy(() => import("../pages/admin/ProfileApprovals"));
const ProfileReviewDetail = lazy(() => import("../pages/admin/ProfileReviewDetail"));
const ResumeApprovals = lazy(() => import("../pages/admin/ResumeApprovals"));
const AdminPortfolioApprovals = lazy(() => import("../pages/admin/PortfolioApprovals"));
const AdminEnquiries = lazy(() => import("../pages/admin/Enquiries"));

const ChangePassword = lazy(() => import("../pages/user/ChangePassword"));
const AdminOtpLogs = lazy(() => import("../pages/admin/OtpLogs"));
const AdminAiResumeLogs = lazy(() => import("../pages/admin/AiResumeLogs"));
const AdminCandidateUnlockLogs = lazy(() => import("../pages/admin/CandidateUnlockLogs"));
const AdminResumeAccessLogs = lazy(() => import("../pages/admin/ResumeAccessLogs"));
const HealthDashboard = lazy(() => import("../pages/admin/HealthDashboard"));
const BulkOutreach = lazy(() => import("../components/admin/BulkOutreach"));
const DataPipeline = lazy(() => import("../pages/admin/DataPipeline"));

// Synced Jobs & ATS Sync Module
const JobSources = lazy(() => import("../pages/admin/JobSources"));
const CompanySources = lazy(() => import("../pages/admin/CompanySources"));
const ExternalJobs = lazy(() => import("../pages/admin/ExternalJobs"));
const SyncReports = lazy(() => import("../pages/admin/SyncReports"));
const SyncErrors = lazy(() => import("../pages/admin/SyncErrors"));
const RecruiterLeads = lazy(() => import("../pages/admin/RecruiterLeads"));
const ScrapedDataVault = lazy(() => import("../pages/admin/ScrapedDataVault"));
const ScraperControlCenter = lazy(() => import("../pages/admin/ScraperControlCenter"));

function AdminLayoutWrapper({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Seo title="Admin Dashboard" robots="noindex, nofollow" />
      <Navbar />
      <main className="flex-1">
        <AdminProtectedRoute>
          <AdminLayout>{children}</AdminLayout>
        </AdminProtectedRoute>
      </main>
    </div>
  );
}

export default function AdminRoutes() {
  const wrap = (children) => <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
  
  return (
    <Routes>
      <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="dashboard" element={wrap(<AdminDashboard />)} />
      <Route path="withdrawals" element={wrap(<AdminWithdrawals />)} />
      <Route path="commission-settings" element={wrap(<AdminCommissionSettings />)} />
      <Route path="partners" element={wrap(<Partners />)} />
      <Route path="partners/:partnerId/referrals" element={wrap(<PartnerReferrals />)} />
      <Route path="manager-bank-accounts" element={wrap(<AdminManagerBankAccounts />)} />
      <Route path="partner-payouts" element={wrap(<AdminPartnerPayouts />)} />
      <Route path="referrals" element={wrap(<AdminReferrals />)} />
      <Route path="commissions" element={wrap(<AdminCommissions />)} />
      <Route path="reward-pool" element={wrap(<AdminRewardPool />)} />
      <Route path="users" element={wrap(<AdminUsers />)} />
      <Route path="providers" element={wrap(<AdminProviders />)} />
      <Route path="recruiters" element={wrap(<AdminRecruiters />)} />
      <Route path="recruiter" element={wrap(<AdminRecruiters />)} />
      <Route path="recriters" element={wrap(<AdminRecruiters />)} />
      <Route path="plans" element={wrap(<AdminPlans />)} />
      <Route path="settings" element={wrap(<AdminSettings />)} />
      <Route path="managers" element={wrap(<AdminManagers />)} />
      <Route path="payment-issues" element={wrap(<AdminSupportIssues />)} />
      <Route path="profile-unlocker" element={wrap(<ProfileUnlocker />)} />
      <Route path="payments" element={wrap(<AdminPayments />)} />
      <Route path="staging-candidates" element={wrap(<AdminStagingCandidates />)} />
      <Route path="provider-subscriptions" element={wrap(<AdminProviderSubscriptions />)} />
      <Route path="terms" element={wrap(<AdminTerms />)} />
      <Route path="privacy" element={wrap(<AdminPrivacy />)} />
      <Route path="refund" element={wrap(<AdminRefundPolicy />)} />
      <Route path="renewal" element={wrap(<AdminRenewalPolicy />)} />
      <Route path="faq" element={wrap(<AdminFaq />)} />
      <Route path="about" element={wrap(<AdminAbout />)} />
      <Route path="skills" element={wrap(<AdminSkills />)} />
      <Route path="whatsapp" element={wrap(<AdminWhatsApp />)} />
      <Route path="currency" element={wrap(<AdminCurrency />)} />
      <Route path="countries" element={wrap(<AdminCountries />)} />
      <Route path="ai" element={wrap(<AdminAIOps />)} />
      <Route path="profile-photo-approvals" element={wrap(<ProfileApprovals />)} />
      <Route path="profile-approvals" element={wrap(<ProfileApprovals />)} />
      <Route path="profile-approval/:userId" element={wrap(<ProfileReviewDetail />)} />
      <Route path="resume-approvals" element={wrap(<ResumeApprovals />)} />
      <Route path="portfolio-approvals" element={wrap(<AdminPortfolioApprovals />)} />
      <Route path="enquiries" element={wrap(<AdminEnquiries />)} />
      <Route path="change-password" element={wrap(<ChangePassword />)} />
      
      {/* Logs & Audit */}
      <Route path="otp-logs" element={wrap(<AdminOtpLogs />)} />
      <Route path="ai-resume-logs" element={wrap(<AdminAiResumeLogs />)} />
      <Route path="candidate-unlock-logs" element={wrap(<AdminCandidateUnlockLogs />)} />
      <Route path="resume-access-logs" element={wrap(<AdminResumeAccessLogs />)} />
      
      {/* Ingestion & ATS Sync Engine Control */}
      <Route path="job-sources" element={wrap(<JobSources />)} />
      <Route path="company-sources" element={wrap(<CompanySources />)} />
      <Route path="external-jobs" element={wrap(<ExternalJobs />)} />
      <Route path="sync-reports" element={wrap(<SyncReports />)} />
      <Route path="sync-errors" element={wrap(<SyncErrors />)} />
      <Route path="recruiter-leads" element={wrap(<RecruiterLeads />)} />

      {/* Engine Control */}
      <Route path="health" element={wrap(<HealthDashboard />)} />
      <Route path="outreach" element={wrap(<BulkOutreach />)} />
      <Route path="data-pipeline" element={wrap(<DataPipeline />)} />
      <Route path="scraped-vault" element={wrap(<ScrapedDataVault />)} />
      <Route path="crawlers" element={wrap(<ScraperControlCenter />)} />

      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}
