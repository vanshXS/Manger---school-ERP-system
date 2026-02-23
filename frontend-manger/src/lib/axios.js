import axios from 'axios';

/**
 * ===============================================================
 * AXIOS INSTANCE
 * ===============================================================
 */
const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true, // Important for sending HTTP-only cookies
});

/**
 * ===============================================================
 * ACCESS TOKEN (IN-MEMORY ONLY)
 * ===============================================================
 */

export const getAccessToken = () => {
  if (typeof window !== 'undefined') {
    return window.__AUTH_ACCESS_TOKEN__ || null;
  }
  return null;
};

export const setAccessToken = (token) => {
  if (typeof window !== 'undefined') {
    window.__AUTH_ACCESS_TOKEN__ = token;
  }
};

export const clearAccessToken = () => {
  if (typeof window !== 'undefined') {
    delete window.__AUTH_ACCESS_TOKEN__;
  }
};

/**
 * ===============================================================
 * REQUEST INTERCEPTOR
 * ===============================================================
 */
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Let browser handle FormData automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (config.data) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * ===============================================================
 * RESPONSE INTERCEPTOR (AUTO REFRESH)
 * ===============================================================
 */

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry public auth routes
    const isPublicAuthRoute =
      originalRequest.url.includes('/api/auth/admin/login') ||
      originalRequest.url.includes('/api/auth/admin/register') ||
      originalRequest.url.includes('/api/auth/admin/forget-password') ||
      originalRequest.url.includes('/api/auth/admin/reset-password');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicAuthRoute
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const baseURL = apiClient.defaults.baseURL || 'http://localhost:8080';

        const response = await axios.post(
          `${baseURL}/api/auth/admin/refresh`,
          {},
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const newAccessToken = response.data?.accessToken;

        if (!newAccessToken) {
          throw new Error('No access token received from refresh endpoint');
        }

        // Update token everywhere
        setAccessToken(newAccessToken);

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        clearAccessToken();

        if (typeof window !== 'undefined') {
          window.location.href = '/admin/auth/admin-login';
        }

        return Promise.reject(refreshError);
      }
    }

    /**
     * Clean error handling
     */
    if (error.response) {
      const data = error.response.data;

      error.customMessage =
        typeof data === 'string'
          ? data
          : data?.message ||
          data?.error ||
          'An unexpected server error occurred.';

      error.fieldErrors =
        data?.fieldErrors || data?.errors || null;
    } else if (error.request) {
      error.customMessage =
        'No response from server. Please check your connection.';
    } else {
      error.customMessage =
        error.message || 'An unexpected error occurred.';
    }

    return Promise.reject(error);
  }
);

export default apiClient;