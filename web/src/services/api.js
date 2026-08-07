import axios from 'axios';
import useAuthStore from '@/store/authStore';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api/v1' : 'http://localhost:5001/api/v1');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (
      import.meta.env.DEV &&
      typeof config?.url === 'string' &&
      config.url.includes('/market/search')
    ) {
      console.debug('[api] market search request', {
        baseURL: config.baseURL,
        url: config.url,
        params: config.params,
      });
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const { response } = error;

    if (response) {
      if (response.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }

      return Promise.reject({
        status: response.status,
        message: response.data?.message || 'Something went wrong',
        errors: response.data?.errors || null,
        code: response.data?.error_code || null,
      });
    }

    return Promise.reject({
      status: 0,
      message: 'Network error. Please check your connection.',
      errors: null,
      code: 'NETWORK_ERROR',
    });
  }
);

export default api;
