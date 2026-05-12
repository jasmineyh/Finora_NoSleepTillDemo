import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { setGlobalLang } from '@/lib/useLanguage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    console.log("App mounted — checking auth session");
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        try {
          const profiles = await base44.entities.UserProfile.filter({ created_by: currentUser.email });
          if (profiles[0]?.language) setGlobalLang(profiles[0].language);
        } catch {}
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = useCallback(() => {
    console.log("Logout — clearing session");
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout("/login");
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      return currentUser;
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authChecked,
      logout,
      refreshUser,
      checkUserAuth: checkAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};