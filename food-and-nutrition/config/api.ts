import { Platform } from 'react-native';

// Get the local IP address for Android/iOS testing
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development environment
    if (Platform.OS === 'android') {
      return 'http://192.168.40.108:8000';
    }
    if (Platform.OS === 'ios') {
      return 'http://localhost:8000'; // iOS simulator can use localhost
    }
    return 'http://localhost:8000'; // Web/other platforms
  }
  
  return 'http://192.168.40.108:8000';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 10000, // 10 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

// Alternative URLs for testing
export const ALTERNATIVE_URLS = {
  LOCALHOST: 'http://localhost:8000',
  ANDROID_EMULATOR: 'http://10.0.2.2:8000',
  LOCAL_NETWORK: 'http://192.168.40.108:8000', // Current IP
};
