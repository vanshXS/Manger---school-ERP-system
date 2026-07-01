import axios from 'axios';

export function createApiClient(roleConfig) {
  let accessToken = null;
  let isRefreshing = false;
  let failedQueue = [];

  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    withCredentials: true,
  });

  const getAccessToken = () => accessToken;
  const setAccessToken = (token) => {
    accessToken = token;
  };
  const clearAccessToken = () => {
    accessToken = null;
  };

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

  // Request Interceptor
  client.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Automatically handle FormData content-type or default to JSON
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

  // Response Interceptor
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Don't retry public auth routes
      const isPublicAuthRoute =
        originalRequest.url.includes(`${roleConfig.apiPrefix}/login`) ||
        originalRequest.url.includes(`${roleConfig.apiPrefix}/refresh`) ||
        originalRequest.url.includes(`${roleConfig.apiPrefix}/logout`) ||
        originalRequest.url.includes(`${roleConfig.apiPrefix}/forget-password`) ||
        originalRequest.url.includes(`${roleConfig.apiPrefix}/reset-password`);

      if (
        (error.response?.status === 401 || error.response?.status === 403) &&
        !originalRequest._retry &&
        !isPublicAuthRoute
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return client(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const baseURL = client.defaults.baseURL || 'http://localhost:8080';

          const response = await axios.post(
            `${baseURL}${roleConfig.apiPrefix}/refresh`,
            {},
            {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const newAccessToken = response.data?.accessToken;

          if (!newAccessToken) {
            throw new Error('No access token received from refresh endpoint');
          }

          setAccessToken(newAccessToken);

          client.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          isRefreshing = false;

          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;

          clearAccessToken();

          if (typeof window !== 'undefined') {
            window.location.href = roleConfig.loginPath;
          }

          return Promise.reject(refreshError);
        }
      }

      // Standardize and clean up response errors
      if (error.response) {
        const data = error.response.data;
        error.customMessage =
          typeof data === 'string'
            ? data
            : data?.message || data?.error || 'An unexpected server error occurred.';
        error.fieldErrors = data?.fieldErrors || data?.errors || null;
      } else if (error.request) {
        error.customMessage = 'No response from server. Please check your connection.';
      } else {
        error.customMessage = error.message || 'An unexpected error occurred.';
      }

      return Promise.reject(error);
    }
  );

  return { client, getAccessToken, setAccessToken, clearAccessToken };
}
