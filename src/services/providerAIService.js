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

export function testAIParser(payload) {
  return API.post('/provider/ai/test', payload);
}
