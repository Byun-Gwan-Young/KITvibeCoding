import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/apiClient.js";
import { clearSession, readSession, writeSession } from "../lib/storage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    const stored = readSession();
    if (!stored) {
      setIsHydrating(false);
      return;
    }

    async function validate() {
      try {
        const response = await apiClient.me(stored.accessToken);
        const nextSession = { accessToken: stored.accessToken, user: response.user };
        writeSession(nextSession);
        setSession(nextSession);
      } catch {
        clearSession();
        setSession(null);
      } finally {
        setIsHydrating(false);
      }
    }

    void validate();
  }, []);

  async function login(payload) {
    const response = await apiClient.login(payload);
    writeSession(response);
    setSession(response);
    return response;
  }

  function logout() {
    clearSession();
    setSession(null);
  }

  const value = useMemo(() => ({ session, isHydrating, login, logout }), [session, isHydrating]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider 안에서만 사용할 수 있어.");
  return context;
}
