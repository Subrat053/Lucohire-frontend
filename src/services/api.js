import axios from "axios";

// Base API for existing app routes (/api)
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
});

// Auth-only API for v1 endpoints (/api/v1)
const AUTH_API = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || "/api/v1",
  timeout: 15000,
});

// Admin API uses admin token and v1 routes
const ADMIN_API = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_API_URL || "/api/v1",
  timeout: 15000,
});

export { API, AUTH_API, ADMIN_API };

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

AUTH_API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

ADMIN_API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("userToken");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  },
);

AUTH_API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("userToken");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  },
);

ADMIN_API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin");
    }
    return Promise.reject(error);
  },
);

// Auth APIs
export const authAPI = {
  registerEmail: (data) => AUTH_API.post("/auth/register-email", data),
  sendRegistrationEmailOtp: (data) => API.post("/auth/register/send-otp", data),
  verifyEmailOtp: (data) => AUTH_API.post("/auth/verify-email-otp", data),
  loginEmail: (data) => AUTH_API.post("/auth/login-email", data),
  googleLogin: (data) => AUTH_API.post("/auth/google-login", data),
  phoneLogin: (data) => AUTH_API.post("/auth/phone-login", data),
  getMe: () => AUTH_API.get("/auth/me"),
  switchRole: (data) => API.post("/auth/switch-role", data),
  switchPanel: (data) => API.patch("/auth/switch-panel", data),
  sendEmailVerification: () => API.post("/auth/verify-email/send"),
  confirmEmailVerification: (data) =>
    API.post("/auth/verify-email/confirm", data),
  updateWhatsappNumber: (data) => API.put("/auth/whatsapp-number", data),
  updateLocale: (data) => API.put("/auth/locale", data),
  toggleWhatsappAlerts: (data) => API.put("/auth/whatsapp-alerts", data),
};

export const userAPI = {
  updateLanguage: (data) => API.put("/user/language", data),
};

// Provider APIs
export const providerAPI = {
  getProfile: () => API.get("/provider/profile"),
  updateProfile: (data) => API.put("/provider/profile", data),
  aiSuggestProfile: (data) => API.post("/provider/profile/ai-suggest", data),
  buildAIProfile: (data) => API.post("/provider/ai/build-profile", data),
  getPricingSuggestion: (params) =>
    API.get("/provider/ai/pricing-suggestion", { params }),
  getDashboard: () => API.get("/provider/dashboard"),
  getPlans: () => API.get("/provider/plans"),
  purchasePlan: (data) => API.post("/provider/plans/purchase", data),
  getLeads: () => API.get("/provider/leads"),
  updateLead: (id, data) => API.put(`/provider/leads/${id}`, data),
  getPublicProfile: (id) => API.get(`/provider/public/${id}`),
  uploadProfilePhoto: (formData) =>
    API.post("/provider/profile/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteProfilePhoto: () => API.delete("/provider/profile/photo"),
  uploadDocument: (formData) =>
    API.post("/provider/profile/document", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getHistory: () => API.get("/provider/history"),
};

// Recruiter APIs
export const recruiterAPI = {
  getDashboard: () => API.get("/recruiter/dashboard"),
  updateProfile: (data) => API.put("/recruiter/profile", data),
  generateJobDescription: (data) =>
    API.post("/recruiter/ai/job-description", data),
  generateJD: (data) => API.post("/recruiter/ai/generate-jd", data),
  publicSearch: (params) => API.get("/recruiter/public-search", { params }),
  search: (params) => API.get("/recruiter/search", { params }),
  viewProvider: (id) => API.get(`/recruiter/view-provider/${id}`),
  unlockContact: (providerId) => API.post(`/recruiter/unlock/${providerId}`),
  checkUnlockStatus: (providerId) =>
    API.get(`/recruiter/unlock-status/${providerId}`),
  postJob: (data) => API.post("/recruiter/jobs", data),
  getJobs: () => API.get("/recruiter/jobs"),
  getJobApplications: (jobId) => API.get(`/jobs/${jobId}/applications`),
  updateApplicationStatus: (applicationId, data) =>
    API.put(`/jobs/applications/${applicationId}`, data),
  getPlans: () => API.get("/recruiter/plans"),
  purchasePlan: (data) => API.post("/recruiter/plans/purchase", data),
  addReview: (providerId, data) =>
    API.post(`/recruiter/review/${providerId}`, data),
  uploadProfilePhoto: (formData) =>
    API.post("/recruiter/profile/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteProfilePhoto: () => API.delete("/recruiter/profile/photo"),
  getHistory: () => API.get("/recruiter/history"),

  // =================================================================
  getJobPostings: () => API.get("/recruiter/job-postings"),

  createJobPosting: (data) => API.post("/recruiter/job-postings", data),

  aiSearchCandidates: (params) => API.get("/recruiter/ai-search", { params }),

  addCandidateToJob: (jobId, candidateId) =>
    API.post(`/recruiter/job-postings/${jobId}/candidates`, { candidateId }),

  getRecruiterPlans: () => API.get("/recruiter/plans"),

  getRecruiterPlanSummary: () => API.get("/recruiter/plan-summary"),

  purchaseRecruiterPlan: (planId) =>
    API.post("/recruiter/plans/purchase", { planId }),
  // ==================================================================
};

// Skills / Categories APIs (public - no auth needed)
export const categoriesAPI = {
  getCategories: () => API.get("/skills"),
};

// Admin APIs
export const adminAPI = {
  login: (data) => ADMIN_API.post("/admin/login", data),
  getMe: () => ADMIN_API.get("/admin/me"),
  getDashboard: () => ADMIN_API.get("/admin/dashboard"),
  getUsers: (params) => ADMIN_API.get("/admin/users", { params }),
  getUserDetail: (id) => ADMIN_API.get(`/admin/users/${id}`),
  getManagers: () => ADMIN_API.get("/admin/managers"),
  createManager: (data) => ADMIN_API.post("/admin/managers", data),
  deleteManager: (id) => ADMIN_API.delete(`/admin/managers/${id}`),
  getApprovalLogs: (params) => ADMIN_API.get("/admin/approval-logs", { params }),
  toggleBlockUser: (id) => ADMIN_API.put(`/admin/users/${id}/block`),
  deleteUser: (id) => ADMIN_API.delete(`/admin/users/${id}`),
  // approveProvider: (id, data) => ADMIN_API.put(`/admin/providers/${id}/approve`, data),
  deleteProvider: (id) => ADMIN_API.delete(`/admin/providers/${id}`),
  getProviders: (params) => ADMIN_API.get("/admin/providers", { params }),
  // approveRecruiter: (id, data) => ADMIN_API.put(`/admin/recruiters/${id}/approve`, data),
  deleteRecruiter: (id) => ADMIN_API.delete(`/admin/recruiters/${id}`),
  getRecruiters: (params) => ADMIN_API.get("/admin/recruiters", { params }),
  getPlans: () => ADMIN_API.get("/admin/plans"),
  createPlan: (data) => ADMIN_API.post("/admin/plans", data),
  updatePlan: (id, data) => ADMIN_API.put(`/admin/plans/${id}`, data),
  deletePlan: (id) => ADMIN_API.delete(`/admin/plans/${id}`),
  getSettings: () => ADMIN_API.get("/admin/settings"),
  updateSettings: (data) => ADMIN_API.put("/admin/settings", data),
  getRotationPools: () => ADMIN_API.get("/admin/rotation-pools"),
  updateRotationPool: (id, data) =>
    ADMIN_API.put(`/admin/rotation-pools/${id}`, data),
  getPayments: (params) => ADMIN_API.get("/admin/payments", { params }),
  getProviderSubscriptions: (params) =>
    ADMIN_API.get("/admin/provider-subscriptions", { params }),
  updateProviderSubscriptionStatus: (id, data) =>
    ADMIN_API.patch(`/admin/provider-subscriptions/${id}/status`, data),
  getJobs: () => ADMIN_API.get("/admin/jobs"),
  uploadProfilePhoto: (formData) =>
    ADMIN_API.post("/admin/profile/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getProfilePhoto: () => ADMIN_API.get("/admin/profile/photo"),
  getProfilePhotoApprovals: () => ADMIN_API.get("/admin/profile-photo-approvals"),

  approveProfilePhoto: (userId) =>
    ADMIN_API.patch(`/admin/profile-photo-approvals/${userId}/approve`),

  rejectProfilePhoto: (userId, reason = "") =>
    ADMIN_API.patch(`/admin/profile-photo-approvals/${userId}/reject`, { reason }),
  getContent: (type) => ADMIN_API.get(`/admin/content/${type}`),
  updateContent: (type, value) =>
    ADMIN_API.put(`/admin/content/${type}`, { value }),
  getPaymentSettings: () => ADMIN_API.get("/admin/payment-settings"),
  updatePaymentSettings: (data) =>
    ADMIN_API.put("/admin/payment-settings", data),
  getCurrencySettings: () => ADMIN_API.get("/admin/currency-settings"),
  updateCurrencySettings: (data) =>
    ADMIN_API.put("/admin/currency-settings", data),
  getCloudinarySettings: () => ADMIN_API.get("/admin/cloudinary-settings"),
  updateCloudinarySettings: (data) =>
    ADMIN_API.put("/admin/cloudinary-settings", data),
  getWhatsappLogs: (params) => ADMIN_API.get("/admin/whatsapp-logs", { params }),
  getWhatsappSettings: () => ADMIN_API.get("/admin/whatsapp-settings"),
  updateWhatsappSettings: (data) =>
    ADMIN_API.put("/admin/whatsapp-settings", data),
  getFeatureFlags: () => ADMIN_API.get("/admin/feature-flags"),
  updateFeatureFlag: (key, data) =>
    ADMIN_API.put(`/admin/feature-flags/${encodeURIComponent(key)}`, data),
  // Skill categories (admin CRUD)
  getSkillCategories: () => ADMIN_API.get("/admin/skills"),
  createSkillCategory: (data) => ADMIN_API.post("/admin/skills", data),
  updateSkillCategory: (id, data) => ADMIN_API.put(`/admin/skills/${id}`, data),
  deleteSkillCategory: (id) => ADMIN_API.delete(`/admin/skills/${id}`),
  updateSkillCategoryStatus: (id, data) =>
    ADMIN_API.patch(`/admin/skills/${id}/status`, data),
  addSkillToCategory: (id, data) =>
    ADMIN_API.post(`/admin/skills/${id}/skills`, data),
  removeSkillFromCategory: (id, skillId) =>
    ADMIN_API.delete(`/admin/skills/${id}/skills/${skillId}`),
  getAIMatchWeights: () => ADMIN_API.get("/admin/ai/match-weights"),
  updateAIMatchWeights: (data) =>
    ADMIN_API.put("/admin/ai/match-weights", data),
  getAITrustWeights: () => ADMIN_API.get("/admin/ai/trust-weights"),
  updateAITrustWeights: (data) =>
    ADMIN_API.put("/admin/ai/trust-weights", data),
  getPromptTemplates: () => ADMIN_API.get("/admin/ai/prompt-templates"),
  createPromptTemplate: (data) =>
    ADMIN_API.post("/admin/ai/prompt-templates", data),
  updatePromptTemplate: (id, data) =>
    ADMIN_API.put(`/admin/ai/prompt-templates/${id}`, data),
  getSkillSynonyms: (params) =>
    ADMIN_API.get("/admin/ai/skill-synonyms", { params }),
  createSkillSynonym: (data) =>
    ADMIN_API.post("/admin/ai/skill-synonyms", data),
  updateSkillSynonym: (id, data) =>
    ADMIN_API.put(`/admin/ai/skill-synonyms/${id}`, data),
  deleteSkillSynonym: (id) =>
    ADMIN_API.delete(`/admin/ai/skill-synonyms/${id}`),
  getFraudQueue: () => ADMIN_API.get("/admin/ai/fraud-queue"),
  getOcrReviewQueue: () => API.get("/admin/ai/ocr-review-queue"),
  updateOcrReviewDecision: (id, data) =>
    API.put(`/admin/ai/ocr-review-queue/${id}`, data),
  getAIUsageDashboard: () => API.get("/admin/ai/usage-dashboard"),
  getDemandSnapshots: () => API.get("/admin/ai/demand-snapshots"),
  // =================================================================
  approveUser: (userId) => API.patch(`/admin/users/${userId}/approve`),

  rejectUser: (userId, reason = "") =>
    API.patch(`/admin/users/${userId}/reject`, { reason }),

  approveProvider: (userId) => API.patch(`/admin/users/${userId}/approve`),

  approveRecruiter: (userId) => API.patch(`/admin/users/${userId}/approve`),
  // =================================================================
};

export const searchAPI = {
  interpret: (data) => API.post("/search/interpret", data),
  parseIntentAI: (data) => API.post("/search/ai/parse-intent", data),
  providers: (params) => API.get("/search/providers", { params }),
  autoMatch: (data) => API.post("/search/auto-match", data),
  autoMatchPreview: (data) => API.post("/search/auto-match/preview", data),
  repeatRecommendations: (params) =>
    API.get("/search/repeat-recommendations", { params }),
  trustScore: (providerId) => API.get(`/search/trust-score/${providerId}`),
};

export const aiAPI = {
  health: () => API.get("/ai/health"),

  profileBuild: (data) => API.post("/ai/profile/build", data),
  profileImprove: (data) => API.post("/ai/profile/improve", data),
  profileBuildFreeText: (data) => API.post("/ai/profile/build-free-text", data),
  profilePricingSuggest: (data) =>
    API.post("/ai/profile/pricing-suggest", data),

  ocrText: (formData) =>
    API.post("/ai/ocr/text", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  ocrDocument: (formData) =>
    API.post("/ai/ocr/document", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  ocrLabels: (formData) =>
    API.post("/ai/ocr/labels", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  createConversation: (data) => API.post("/ai/chat/conversations", data || {}),
  getConversations: (params) => API.get("/ai/chat/conversations", { params }),
  getConversationHistory: (id, params) =>
    API.get(`/ai/chat/conversations/${id}`, { params }),
  getChatHistory: (params) => API.get("/ai/chat/history", { params }),
  sendMessage: (data) => API.post("/ai/chat/send", data),
  regenerateReply: (data) => API.post("/ai/chat/regenerate", data),
  markMessageStatus: (data) => API.patch("/ai/chat/message-status", data),

  createEmbedding: (data) => API.post("/ai/embeddings/create", data),
  vectorSearch: (data) => API.post("/ai/vector/search", data),
};

export const chatAPI = {
  ask: (data) => aiAPI.sendMessage(data),
};

// Jobs APIs (provider browses / applies; recruiter views applications)
export const jobsAPI = {
  getAvailableJobs: (params) => API.get("/jobs", { params }),
  applyToJob: (jobId, data) => API.post(`/jobs/${jobId}/apply`, data),
  getMyApplications: () => API.get("/jobs/my-applications"),
  getJobApplications: (jobId) => API.get(`/jobs/${jobId}/applications`),
  updateApplicationStatus: (applicationId, data) =>
    API.put(`/jobs/applications/${applicationId}`, data),
};

// Subscription APIs
export const subscriptionAPI = {
  getMySubscription: () => API.get("/subscriptions/me"),
};

// Notification APIs
export const notificationAPI = {
  getMyNotifications: (params) => API.get("/notifications", { params }),
  markAsRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllAsRead: () => API.patch("/notifications/read-all"),
  deleteNotification: (id) => API.delete(`/notifications/${id}`),
};

// Profile APIs
export const profileAPI = {
  getByUserId: (userId) => API.get(`/profile/${userId}`),
  updateMyProfile: (data) => API.patch("/profile", data),
};

// Review APIs
export const reviewAPI = {
  create: (data) => API.post("/reviews", data),
  getByUserId: (userId) => API.get(`/reviews/${userId}`),
  canReview: (revieweeId, leadId) =>
    API.get(`/reviews/can-review/${revieweeId}`, { params: { leadId } }),
  update: (id, data) => API.patch(`/reviews/${id}`, data),
  delete: (id) => API.delete(`/reviews/${id}`),
};

// Payment APIs
export const paymentAPI = {
  getConfig: () => API.get("/payments/config"),
  createOrder: (data) => API.post("/payments/create-order", data),
  verifyPayment: (data) => API.post("/payments/verify", data), // body: { sessionId }
  paymentFailed: (data) => API.post("/payments/failed", data), // body: { sessionId, errorMessage }
  getMyPayments: () => API.get("/payments/my-payments"),
  getPaymentById: (id) => API.get(`/payments/${id}`),
};

// Locale APIs
export const localeAPI = {
  detect: () => API.get("/locale/detect"),
  getCurrencies: () => API.get("/locale/currencies"),
  reverseGeocode: (lat, lng) =>
    API.get("/locale/reverse-geocode", { params: { lat, lng } }),
};

export const locationAPI = {
  autocomplete: (query) => API.post("/location/autocomplete", { query }),
  nearby: (lat, lon) => API.post("/location/nearby", { lat, lon }),
};

export default API;
