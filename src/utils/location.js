import { localeAPI } from '../services/api';

const getBrowserCoordinates = () => new Promise((resolve, reject) => {
  if (!navigator?.geolocation) {
    reject(new Error('Geolocation is not supported in this browser.'));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      if (error?.code === error.PERMISSION_DENIED) {
        reject(new Error('Location permission denied. Please allow location access.'));
        return;
      }
      reject(new Error('Unable to access your current location.'));
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
});

export const detectNearestLocation = async () => {
  const coords = await getBrowserCoordinates();
  const { data } = await localeAPI.reverseGeocode(coords.latitude, coords.longitude);

  return {
    city: data?.city || '',
    state: data?.state || '',
    country: data?.country || '',
    nearestLocation: data?.nearestLocation || '',
    latitude: data?.latitude ?? coords.latitude,
    longitude: data?.longitude ?? coords.longitude,
    source: data?.source || 'browser',
  };
};
