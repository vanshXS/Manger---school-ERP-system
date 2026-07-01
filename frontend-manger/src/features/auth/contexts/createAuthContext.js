'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export function createAuthContext(roleConfig, apiInstance) {
  const AuthContext = createContext(undefined);

  function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const baseURL = apiInstance.client.defaults.baseURL || 'http://localhost:8080';

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
        const response = await fetch(`${baseURL}${roleConfig.apiPrefix}/refresh`, {
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

        apiInstance.setAccessToken(newAccessToken);
        setIsAuthenticated(true);
        return true;
      } catch (error) {
        return false;
      }
    };

    // ================= LOGIN =================
    const login = (newAccessToken) => {
      apiInstance.setAccessToken(newAccessToken);
      setIsAuthenticated(true);
    };

    // ================= LOGOUT =================
    const logout = async (shouldRedirect = true) => {
      apiInstance.clearAccessToken();
      setIsAuthenticated(false);

      try {
        await fetch(`${baseURL}${roleConfig.apiPrefix}/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        // Logout request failed, but local state is already cleared
      }

      if (shouldRedirect && typeof window !== 'undefined') {
        window.location.href = roleConfig.loginPath;
      }
    };

    const getAccessToken = () => apiInstance.getAccessToken();

    return (
      <AuthContext.Provider
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
      </AuthContext.Provider>
    );
  }

  function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error(`useAuth must be used within ${roleConfig.label} AuthProvider`);
    }
    return context;
  }

  return { AuthProvider, useAuth };
}
