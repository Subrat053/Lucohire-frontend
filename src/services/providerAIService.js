import API from './api';

export function sendChatMessage(payload) {
  return API.post('/provider/ai/chat', payload);
}

export function buildProfile(payload) {
  return API.post('/provider/ai/build-profile', payload);
}

export function getAIHealth() {
  return API.get('/provider/ai/health');
}

export function getAiUsage() {
  return API.get('/provider/ai/usage', { timeout: 30000 });
}

export function testAIParser(payload) {
  return API.post('/provider/ai/test', payload);
}

export function uploadResume(formData) {
  return API.post('/provider/ai/build-from-resume', formData, {
    timeout: 60000,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function getAtsOptimizer(data) {
  return API.post('/provider/ai/ats-optimizer', data);
}

export function getCareerHealth(payload) {
  return API.post('/provider/ai/career-health', payload, {
    timeout: 60000,
  });
}

export function getCareerGPS(payload) {
  return API.post('/provider/ai/career-gps', payload, {
    timeout: 60000,
  });
}

export function getHiringBarriers(payload) {
  return API.post('/provider/ai/hiring-barriers', payload, {
    timeout: 60000,
  });
}

export function getSkillGap(payload) {
  return API.post('/provider/ai/skill-gap', payload, {
    timeout: 60000,
  });
}

export function getJobMatchingEngine(payload) {
  return API.post('/provider/ai/job-matching-engine', payload, {
    timeout: 90000,
  });
}

export function getAICareerReport(payload) {
  return API.post('/provider/ai/career-report', payload, {
    timeout: 90000,
  });
}

export function getIncomeOpportunities() {
  return API.post('/provider/ai/income-opportunities', {}, {
    timeout: 60000,
  });
}
