import axios from 'axios';

/**
 * ===============================================================
 * STUDENT AXIOS INSTANCE
 * Separate from admin and teacher apiClient — uses student auth tokens
 * ===============================================================
 */
const studentApiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    withCredentials: true,
});

/**
 * ===============================================================
 * ACCESS TOKEN (IN-MEMORY ONLY)
 * Uses a separate window key to avoid collisions with other tokens
 * ===============================================================
 */
export const getStudentAccessToken = () => {
    if (typeof window !== 'undefined') {
        return window.__STUDENT_AUTH_ACCESS_TOKEN__ || null;
    }
    return null;
};

export const setStudentAccessToken = (token) => {
    if (typeof window !== 'undefined') {
        window.__STUDENT_AUTH_ACCESS_TOKEN__ = token;
    }
};

export const clearStudentAccessToken = () => {
    if (typeof window !== 'undefined') {
        delete window.__STUDENT_AUTH_ACCESS_TOKEN__;
    }
};

/**
 * ===============================================================
 * REQUEST INTERCEPTOR
 * ===============================================================
 */
studentApiClient.interceptors.request.use(
    (config) => {
        const accessToken = getStudentAccessToken();

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

studentApiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const isPublicAuthRoute =
            originalRequest.url.includes('/api/auth/student/login') ||
            originalRequest.url.includes('/api/auth/student/forget-password') ||
            originalRequest.url.includes('/api/auth/student/reset-password');

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
                        return studentApiClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const baseURL = studentApiClient.defaults.baseURL || 'http://localhost:8080';

                const response = await axios.post(
                    `${baseURL}/api/auth/student/refresh`,
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

                setStudentAccessToken(newAccessToken);

                studentApiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                processQueue(null, newAccessToken);
                isRefreshing = false;

                return studentApiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;

                clearStudentAccessToken();

                if (typeof window !== 'undefined') {
                    window.location.href = '/student/auth/student-login';
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

export default studentApiClient;
