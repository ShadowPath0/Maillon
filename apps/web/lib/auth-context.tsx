"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { AuthenticatedUser, AuthTokens } from "@gst/shared-types";
import { apiClient } from "./api-client";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (email: string, motDePasse: string) => Promise<void>;
  registerAgency: (data: { nomAgence: string; nom: string; email: string; motDePasse: string }) => Promise<void>;
  acceptInvitation: (data: { token: string; nom: string; motDePasse: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokens = apiClient.getStoredTokens();
    if (!tokens) {
      setLoading(false);
      return;
    }
    apiClient
      .get<AuthenticatedUser>("/auth/me")
      .then(setUser)
      .catch(() => apiClient.storeTokens(null))
      .finally(() => setLoading(false));
  }, []);

  const applySession = useCallback((data: { user: AuthenticatedUser; tokens: AuthTokens }) => {
    apiClient.storeTokens(data.tokens);
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (email: string, motDePasse: string) => {
      const data = await apiClient.post<{ user: AuthenticatedUser; tokens: AuthTokens }>("/auth/login", {
        email,
        motDePasse,
      });
      applySession(data);
    },
    [applySession],
  );

  const registerAgency = useCallback(
    async (payload: { nomAgence: string; nom: string; email: string; motDePasse: string }) => {
      const data = await apiClient.post<{ user: AuthenticatedUser; tokens: AuthTokens }>(
        "/auth/register-agency",
        payload,
      );
      applySession(data);
    },
    [applySession],
  );

  const acceptInvitation = useCallback(
    async (payload: { token: string; nom: string; motDePasse: string }) => {
      const data = await apiClient.post<{ user: AuthenticatedUser; tokens: AuthTokens }>(
        "/auth/accept-invitation",
        payload,
      );
      applySession(data);
    },
    [applySession],
  );

  const logout = useCallback(() => {
    apiClient.storeTokens(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, registerAgency, acceptInvitation, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
