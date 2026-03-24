'use client';

import studentApiClient from '@/lib/studentAxios';
import { createContext, useContext, useEffect, useState } from 'react';

const StudentAuthContext = createContext(undefined);

export function StudentAuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(null);

    const baseURL = studentApiClient.defaults.baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    // ================= INIT AUTH =================
    useEffect(() => {
        const initAuth = async () => {
            try {
                const success = await refreshAccessToken();

                if (!success) {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    // ================= REFRESH TOKEN =================
    const refreshAccessToken = async () => {
        try {
            const response = await fetch(`${baseURL}/api/auth/student/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            const newAccessToken = data.accessToken;

            if (!newAccessToken) {
                return false;
            }

            setAccessToken(newAccessToken);
            setIsAuthenticated(true);

            if (typeof window !== 'undefined') {
                window.__STUDENT_AUTH_ACCESS_TOKEN__ = newAccessToken;
            }

            return true;
        } catch (error) {
            return false;
        }
    };

    // ================= LOGIN =================
    const login = (newAccessToken) => {
        setAccessToken(newAccessToken);
        setIsAuthenticated(true);

        if (typeof window !== 'undefined') {
            window.__STUDENT_AUTH_ACCESS_TOKEN__ = newAccessToken;
        }
    };

    // ================= LOGOUT =================
    const logout = async (shouldRedirect = true) => {
        setAccessToken(null);
        setIsAuthenticated(false);

        if (typeof window !== 'undefined') {
            delete window.__STUDENT_AUTH_ACCESS_TOKEN__;
        }

        try {
            await fetch(`${baseURL}/api/auth/student/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            // Logout request failed, but local state is already cleared
        }

        if (shouldRedirect && typeof window !== 'undefined') {
            window.location.href = '/student/auth/student-login';
        }
    };

    const getAccessToken = () => accessToken;

    return (
        <StudentAuthContext.Provider
            value={{
                isAuthenticated,
                isLoading,
                login,
                logout,
                getAccessToken,
                refreshAccessToken,
            }}
        >
            {children}
        </StudentAuthContext.Provider>
    );
}

export function useStudentAuth() {
    const context = useContext(StudentAuthContext);
    if (!context) {
        throw new Error('useStudentAuth must be used within StudentAuthProvider');
    }
    return context;
}
