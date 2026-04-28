const getBackendBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const withoutApi = apiUrl.replace(/\/api$/, '');
  const trimmed = withoutApi.replace(/\/$/, '');
  return trimmed || 'http://localhost:5000';
};

export const toAbsoluteMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${getBackendBaseUrl()}${normalizedPath}`;
};

export { getBackendBaseUrl };
