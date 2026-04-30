import { API } from './api';

export const getProviderPlans = async () => {
  const { data } = await API.get('/provider/plans');
  return Array.isArray(data) ? data : [];
};

export const getMyPlan = async () => {
  const { data } = await API.get('/provider/my-plan');
  return data || {};
};

export const previewPlan = async (payload) => {
  const { data } = await API.post('/provider/plan/preview', payload);
  return data || {};
};

export const checkoutPlan = async (payload) => {
  const { data } = await API.post('/provider/plan/checkout', payload);
  return data || {};
};

export const confirmPayment = async (payload) => {
  const { data } = await API.post('/provider/plan/payment-success', payload);
  return data || {};
};
