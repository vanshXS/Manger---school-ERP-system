import axios from 'axios';

/**
 * ===============================================================
 * TEACHER AXIOS INSTANCE
 * Separate from admin apiClient — uses teacher auth tokens
 * ===============================================================
 */
const teacherApiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    withCredentials: true,
});

/**
 * ===============================================================
 * ACCESS TOKEN (IN-MEMORY ONLY)
 * Uses a separate window key to avoid collisions with admin token
 * ===============================================================
 */
export const getTeacherAccessToken = () => {
    if (typeof window !== 'undefined') {
        return window.__TEACHER_AUTH_ACCESS_TOKEN__ || null;
    }
    return null;
};

export const setTeacherAccessToken = (token) => {
    if (typeof window !== 'undefined') {
        window.__TEACHER_AUTH_ACCESS_TOKEN__ = token;
    }
};

export const clearTeacherAccessToken = () => {
    if (typeof window !== 'undefined') {
        delete window.__TEACHER_AUTH_ACCESS_TOKEN__;
    }
};

/**
 * ===============================================================
 * REQUEST INTERCEPTOR
 * ===============================================================
 */
teacherApiClient.interceptors.request.use(
    (config) => {
        const accessToken = getTeacherAccessToken();

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

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

teacherApiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const isPublicAuthRoute =
            originalRequest.url.includes('/api/auth/teacher/login') ||
            originalRequest.url.includes('/api/auth/teacher/forget-password') ||
            originalRequest.url.includes('/api/auth/teacher/reset-password');

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
                        return teacherApiClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const baseURL = teacherApiClient.defaults.baseURL || 'http://localhost:8080';

                const response = await axios.post(
                    `${baseURL}/api/auth/teacher/refresh`,
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

                setTeacherAccessToken(newAccessToken);

                teacherApiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                processQueue(null, newAccessToken);
                isRefreshing = false;

                return teacherApiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;

                clearTeacherAccessToken();

                if (typeof window !== 'undefined') {
                    window.location.href = '/teacher/auth/login';
                }

                return Promise.reject(refreshError);
            }
        }

        // Clean error handling
        if (error.response) {
            const data = error.response.data;

            error.customMessage =
                typeof data === 'string'
                    ? data
                    : data?.message ||
                    data?.error ||
                    'An unexpected server error occurred.';

            error.fieldErrors = data?.fieldErrors || data?.errors || null;
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

export default teacherApiClient;
