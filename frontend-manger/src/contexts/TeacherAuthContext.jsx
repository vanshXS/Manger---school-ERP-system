'use client';

import apiClient from '@/lib/axios';
import { createContext, useContext, useEffect, useState } from 'react';

const TeacherAuthContext = createContext(undefined);

export function TeacherAuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(null);

    const baseURL = 'http://localhost:8080';

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
            const response = await fetch(`${baseURL}/api/auth/teacher/refresh`, {
                method: 'POST',
                credentials: 'include', // Sends teacherRefreshToken cookie
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
                window.__TEACHER_AUTH_ACCESS_TOKEN__ = newAccessToken;
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
            window.__TEACHER_AUTH_ACCESS_TOKEN__ = newAccessToken;
        }
    };

    // ================= LOGOUT =================
    const logout = async (shouldRedirect = true) => {
        setAccessToken(null);
        setIsAuthenticated(false);

        if (typeof window !== 'undefined') {
            delete window.__TEACHER_AUTH_ACCESS_TOKEN__;
        }

        try {
            await fetch(`${baseURL}/api/auth/teacher/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            // Logout request failed, but local state is already cleared
        }

        if (shouldRedirect && typeof window !== 'undefined') {
            window.location.href = '/teacher/auth/login';
        }
    };

    const getAccessToken = () => accessToken;

    return (
        <TeacherAuthContext.Provider
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
        </TeacherAuthContext.Provider>
    );
}

export function useTeacherAuth() {
    const context = useContext(TeacherAuthContext);
    if (!context) {
        throw new Error('useTeacherAuth must be used within TeacherAuthProvider');
    }
    return context;
}