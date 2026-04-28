import { providerAPI, searchAPI } from './api';
import { extractProvidersList, normalizeProviderData, normalizeProvidersList } from '../utils/providerData';

const normalizeSearchResponse = (responseData = {}) => {
  const providers = extractProvidersList(responseData);
  const featured = Array.isArray(responseData?.featured) ? responseData.featured : [];
  const rotation = Array.isArray(responseData?.rotation) ? responseData.rotation : [];
  const normalProviders = Array.isArray(providers) ? providers : [];

  return {
    providers: normalizeProvidersList(normalProviders),
    featured: normalizeProvidersList(featured),
    rotation: normalizeProvidersList(rotation),
    pagination: responseData?.pagination || {},
    summary: responseData?.summary || {},
    intent: responseData?.intent || null,
    searchMeta: responseData?.searchMeta || responseData?.meta || {},
  };
};

export const getProviders = async (params = {}) => {
  const { data } = await searchAPI.providers(params);
  return normalizeSearchResponse(data || {});
};

export const searchProviders = async (filters = {}) => {
  return getProviders(filters);
};

export const getFeaturedProviders = async (params = {}) => {
  const pageSize = params.limit || 8;
  return getProviders({
    ...params,
    sortBy: params.sortBy || 'rating',
    limit: pageSize,
  });
};

export const getProviderById = async (id) => {
  const { data } = await providerAPI.getPublicProfile(id);
  const profile = data?.profile || data?.data?.profile || data?.provider || null;
  const reviews = data?.reviews || data?.data?.reviews || [];

  return {
    profile: profile ? normalizeProviderData(profile, 0, { isDummy: Boolean(profile?.isDummy) }) : null,
    reviews,
    raw: data || {},
  };
};

export const normalizeProviderCardData = (provider, index = 0) => normalizeProviderData(provider, index);
