"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { tournament } from "../../tournament.config";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  join: (name: string, email: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  join: async () => ({ ok: false }),
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const storageKey = tournament.localStorageKey;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    setLoading(false);
  }, [storageKey]);

  const join = useCallback(async (name: string, email: string) => {
    const res = await fetch("/api/auth/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? "Failed to join" };

    const u: User = { id: data.id, name: data.name, email };
    setUser(u);
    localStorage.setItem(storageKey, JSON.stringify(u));
    return { ok: true };
  }, [storageKey]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return (
    <AuthContext.Provider value={{ user, loading, join, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
