/**
 * Admin website API client — separate from user-website client.
 * Uses admin JWT tokens stored under different localStorage keys.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const adminApiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

adminApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('admin_refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/admin/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refresh}` },
          });
          const newToken = data.data.access_token;
          localStorage.setItem('admin_access_token', newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return adminApiClient(original);
        } catch {
          localStorage.removeItem('admin_access_token');
          localStorage.removeItem('admin_refresh_token');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export const extractData = <T>(res: { data: { data: T } }): T => res.data.data;
export const extractPaginated = <T>(res: any) => ({
  items: res.data.data as T[],
  pagination: res.data.pagination,
});

export default adminApiClient;
