import axios from 'axios';

// In development (no VITE_API_URL set): Vite proxies /api ? http://localhost:5000
// In production (separate deployment): set VITE_API_URL=https://your-backend.com/api
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Request interceptor to add JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = (error.config?.url || '').toLowerCase();
    const authPublicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/register/send-otp',
      '/auth/register/verify-otp',
      '/auth/google',
      '/auth/whatsapp/send-otp',
      '/auth/whatsapp/verify-otp',
    ];
    const isAuthPublicRequest = authPublicEndpoints.some((endpoint) => requestUrl.includes(endpoint));

    if (error.response?.status === 403 && error.response?.data?.approvalRequired) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/pending-approval') {
        window.location.href = '/pending-approval';
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!isAuthPublicRequest && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  sendRegistrationEmailOtp: (data) => API.post('/auth/register/send-otp', data),
  verifyRegistrationEmailOtp: (data) => API.post('/auth/register/verify-otp', data),
  login: (data) => API.post('/auth/login', data),
  googleAuth: (data) => API.post('/auth/google', data),
  whatsappSendOtp: (data) => API.post('/auth/whatsapp/send-otp', data),
  whatsappVerifyOtp: (data) => API.post('/auth/whatsapp/verify-otp', data),
  getMe: () => API.get('/auth/me'),
  switchRole: (data) => API.post('/auth/switch-role', data),
  sendEmailVerification: () => API.post('/auth/verify-email/send'),
  confirmEmailVerification: (data) => API.post('/auth/verify-email/confirm', data),
  updateWhatsappNumber: (data) => API.put('/auth/whatsapp-number', data),
  updateLocale: (data) => API.put('/auth/locale', data),
  toggleWhatsappAlerts: (data) => API.put('/auth/whatsapp-alerts', data),
};

export const userAPI = {
  updateLanguage: (data) => API.put('/user/language', data),
};

// Provider APIs
export const providerAPI = {
  getProfile: () => API.get('/provider/profile'),
  updateProfile: (data) => API.put('/provider/profile', data),
  aiSuggestProfile: (data) => API.post('/provider/profile/ai-suggest', data),
  buildAIProfile: (data) => API.post('/provider/ai/build-profile', data),
  getPricingSuggestion: (params) => API.get('/provider/ai/pricing-suggestion', { params }),
  getDashboard: () => API.get('/provider/dashboard'),
  getPlans: () => API.get('/provider/plans'),
  purchasePlan: (data) => API.post('/provider/plans/purchase', data),
  getLeads: () => API.get('/provider/leads'),
  updateLead: (id, data) => API.put(`/provider/leads/${id}`, data),
  getPublicProfile: (id) => API.get(`/provider/public/${id}`),
  uploadProfilePhoto: (formData) => API.post('/provider/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProfilePhoto: () => API.delete('/provider/profile/photo'),
  uploadDocument: (formData) => API.post('/provider/profile/document', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getHistory: () => API.get('/provider/history'),
};

// Recruiter APIs
export const recruiterAPI = {
  getDashboard: () => API.get('/recruiter/dashboard'),
  updateProfile: (data) => API.put('/recruiter/profile', data),
  generateJobDescription: (data) => API.post('/recruiter/ai/job-description', data),
  generateJD: (data) => API.post('/recruiter/ai/generate-jd', data),
  publicSearch: (params) => API.get('/recruiter/public-search', { params }),
  search: (params) => API.get('/recruiter/search', { params }),
  viewProvider: (id) => API.get(`/recruiter/view-provider/${id}`),
  unlockContact: (providerId) => API.post(`/recruiter/unlock/${providerId}`),
  checkUnlockStatus: (providerId) => API.get(`/recruiter/unlock-status/${providerId}`),
  postJob: (data) => API.post('/recruiter/jobs', data),
  getJobs: () => API.get('/recruiter/jobs'),
  getJobApplications: (jobId) => API.get(`/jobs/${jobId}/applications`),
  updateApplicationStatus: (applicationId, data) => API.put(`/jobs/applications/${applicationId}`, data),
  getPlans: () => API.get('/recruiter/plans'),
  purchasePlan: (data) => API.post('/recruiter/plans/purchase', data),
  addReview: (providerId, data) => API.post(`/recruiter/review/${providerId}`, data),
  uploadProfilePhoto: (formData) => API.post('/recruiter/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProfilePhoto: () => API.delete('/recruiter/profile/photo'),
  getHistory: () => API.get('/recruiter/history'),
};

// Skills / Categories APIs (public - no auth needed)
export const skillsAPI = {
  getCategories: () => API.get('/skills'),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => API.get('/admin/dashboard'),
  getUsers: (params) => API.get('/admin/users', { params }),
  getUserDetail: (id) => API.get(`/admin/users/${id}`),
  getManagers: () => API.get('/admin/managers'),
  createManager: (data) => API.post('/admin/managers', data),
  deleteManager: (id) => API.delete(`/admin/managers/${id}`),
  getApprovalLogs: (params) => API.get('/admin/approval-logs', { params }),
  toggleBlockUser: (id) => API.put(`/admin/users/${id}/block`),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  approveProvider: (id, data) => API.put(`/admin/providers/${id}/approve`, data),
  deleteProvider: (id) => API.delete(`/admin/providers/${id}`),
  getProviders: (params) => API.get('/admin/providers', { params }),
  approveRecruiter: (id, data) => API.put(`/admin/recruiters/${id}/approve`, data),
  deleteRecruiter: (id) => API.delete(`/admin/recruiters/${id}`),
  getRecruiters: (params) => API.get('/admin/recruiters', { params }),
  getPlans: () => API.get('/admin/plans'),
  createPlan: (data) => API.post('/admin/plans', data),
  updatePlan: (id, data) => API.put(`/admin/plans/${id}`, data),
  deletePlan: (id) => API.delete(`/admin/plans/${id}`),
  getSettings: () => API.get('/admin/settings'),
  updateSettings: (data) => API.put('/admin/settings', data),
  getRotationPools: () => API.get('/admin/rotation-pools'),
  updateRotationPool: (id, data) => API.put(`/admin/rotation-pools/${id}`, data),
  getPayments: (params) => API.get('/admin/payments', { params }),
  getJobs: () => API.get('/admin/jobs'),
  uploadProfilePhoto: (formData) => API.post('/admin/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getProfilePhoto: () => API.get('/admin/profile/photo'),
  getContent: (type) => API.get(`/admin/content/${type}`),
  updateContent: (type, value) => API.put(`/admin/content/${type}`, { value }),
  getPaymentSettings: () => API.get('/admin/payment-settings'),
  updatePaymentSettings: (data) => API.put('/admin/payment-settings', data),
  getCurrencySettings: () => API.get('/admin/currency-settings'),
  updateCurrencySettings: (data) => API.put('/admin/currency-settings', data),
  getCloudinarySettings: () => API.get('/admin/cloudinary-settings'),
  updateCloudinarySettings: (data) => API.put('/admin/cloudinary-settings', data),
  getWhatsappLogs: (params) => API.get('/admin/whatsapp-logs', { params }),
  getWhatsappSettings: () => API.get('/admin/whatsapp-settings'),
  updateWhatsappSettings: (data) => API.put('/admin/whatsapp-settings', data),
  getFeatureFlags: () => API.get('/admin/feature-flags'),
  updateFeatureFlag: (key, data) => API.put(`/admin/feature-flags/${encodeURIComponent(key)}`, data),
  // Skill categories (admin CRUD)
  getSkillCategories: () => API.get('/admin/skills'),
  createSkillCategory: (data) => API.post('/admin/skills', data),
  updateSkillCategory: (id, data) => API.put(`/admin/skills/${id}`, data),
  deleteSkillCategory: (id) => API.delete(`/admin/skills/${id}`),
  addSkillToCategory: (id, data) => API.post(`/admin/skills/${id}/skills`, data),
  removeSkillFromCategory: (id, skillId) => API.delete(`/admin/skills/${id}/skills/${skillId}`),
  getAIMatchWeights: () => API.get('/admin/ai/match-weights'),
  updateAIMatchWeights: (data) => API.put('/admin/ai/match-weights', data),
  getAITrustWeights: () => API.get('/admin/ai/trust-weights'),
  updateAITrustWeights: (data) => API.put('/admin/ai/trust-weights', data),
  getPromptTemplates: () => API.get('/admin/ai/prompt-templates'),
  createPromptTemplate: (data) => API.post('/admin/ai/prompt-templates', data),
  updatePromptTemplate: (id, data) => API.put(`/admin/ai/prompt-templates/${id}`, data),
  getSkillSynonyms: (params) => API.get('/admin/ai/skill-synonyms', { params }),
  createSkillSynonym: (data) => API.post('/admin/ai/skill-synonyms', data),
  updateSkillSynonym: (id, data) => API.put(`/admin/ai/skill-synonyms/${id}`, data),
  deleteSkillSynonym: (id) => API.delete(`/admin/ai/skill-synonyms/${id}`),
  getFraudQueue: () => API.get('/admin/ai/fraud-queue'),
  getOcrReviewQueue: () => API.get('/admin/ai/ocr-review-queue'),
  updateOcrReviewDecision: (id, data) => API.put(`/admin/ai/ocr-review-queue/${id}`, data),
  getAIUsageDashboard: () => API.get('/admin/ai/usage-dashboard'),
  getDemandSnapshots: () => API.get('/admin/ai/demand-snapshots'),
};

export const searchAPI = {
  interpret: (data) => API.post('/search/interpret', data),
  parseIntentAI: (data) => API.post('/search/ai/parse-intent', data),
  providers: (params) => API.get('/search/providers', { params }),
  autoMatch: (data) => API.post('/search/auto-match', data),
  autoMatchPreview: (data) => API.post('/search/auto-match/preview', data),
  repeatRecommendations: (params) => API.get('/search/repeat-recommendations', { params }),
  trustScore: (providerId) => API.get(`/search/trust-score/${providerId}`),
};

export const aiAPI = {
  health: () => API.get('/ai/health'),

  profileBuild: (data) => API.post('/ai/profile/build', data),
  profileImprove: (data) => API.post('/ai/profile/improve', data),
  profileBuildFreeText: (data) => API.post('/ai/profile/build-free-text', data),
  profilePricingSuggest: (data) => API.post('/ai/profile/pricing-suggest', data),

  ocrText: (formData) => API.post('/ai/ocr/text', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  ocrDocument: (formData) => API.post('/ai/ocr/document', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  ocrLabels: (formData) => API.post('/ai/ocr/labels', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  createConversation: (data) => API.post('/ai/chat/conversations', data || {}),
  getConversations: (params) => API.get('/ai/chat/conversations', { params }),
  getConversationHistory: (id, params) => API.get(`/ai/chat/conversations/${id}`, { params }),
  getChatHistory: (params) => API.get('/ai/chat/history', { params }),
  sendMessage: (data) => API.post('/ai/chat/send', data),
  regenerateReply: (data) => API.post('/ai/chat/regenerate', data),
  markMessageStatus: (data) => API.patch('/ai/chat/message-status', data),

  createEmbedding: (data) => API.post('/ai/embeddings/create', data),
  vectorSearch: (data) => API.post('/ai/vector/search', data),
};

export const chatAPI = {
  ask: (data) => aiAPI.sendMessage(data),
};

// Jobs APIs (provider browses / applies; recruiter views applications)
export const jobsAPI = {
  getAvailableJobs: (params) => API.get('/jobs', { params }),
  applyToJob: (jobId, data) => API.post(`/jobs/${jobId}/apply`, data),
  getMyApplications: () => API.get('/jobs/my-applications'),
  getJobApplications: (jobId) => API.get(`/jobs/${jobId}/applications`),
  updateApplicationStatus: (applicationId, data) => API.put(`/jobs/applications/${applicationId}`, data),
};

// Subscription APIs
export const subscriptionAPI = {
  getMySubscription: () => API.get('/subscriptions/me'),
};

// Notification APIs
export const notificationAPI = {
  getMyNotifications: (params) => API.get('/notifications', { params }),
  markAsRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllAsRead: () => API.patch('/notifications/read-all'),
  deleteNotification: (id) => API.delete(`/notifications/${id}`),
};

// Profile APIs
export const profileAPI = {
  getByUserId: (userId) => API.get(`/profile/${userId}`),
  updateMyProfile: (data) => API.patch('/profile', data),
};

// Review APIs
export const reviewAPI = {
  create: (data) => API.post('/reviews', data),
  getByUserId: (userId) => API.get(`/reviews/${userId}`),
  canReview: (revieweeId, leadId) => API.get(`/reviews/can-review/${revieweeId}`, { params: { leadId } }),
  update: (id, data) => API.patch(`/reviews/${id}`, data),
  delete: (id) => API.delete(`/reviews/${id}`),
};

// Payment APIs
export const paymentAPI = {
  getConfig: () => API.get('/payments/config'),
  createOrder: (data) => API.post('/payments/create-order', data),
  verifyPayment: (data) => API.post('/payments/verify', data),        // body: { sessionId }
  paymentFailed: (data) => API.post('/payments/failed', data),        // body: { sessionId, errorMessage }
  getMyPayments: () => API.get('/payments/my-payments'),
  getPaymentById: (id) => API.get(`/payments/${id}`),
};

// Locale APIs
export const localeAPI = {
  detect: () => API.get('/locale/detect'),
  getCurrencies: () => API.get('/locale/currencies'),
  reverseGeocode: (lat, lng) => API.get('/locale/reverse-geocode', { params: { lat, lng } }),
};

export const locationAPI = {
  autocomplete: (query) => API.post('/location/autocomplete', { query }),
  nearby: (lat, lon) => API.post('/location/nearby', { lat, lon }),
};

export default API;
