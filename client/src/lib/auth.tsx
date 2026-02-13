import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

interface AuthUser {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  role: string;
  permissions: string[] | null;
  status: string;
  profilePhoto: string | null;
  bio: string | null;
  title: string | null;
  linkedinUrl: string | null;
  dashboardWidgets: string[] | null;
  createdAt: string | null;
  lastLoginAt: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  needsSetup: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setup: (data: { username: string; password: string; displayName?: string; email?: string }) => Promise<void>;
  refresh: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setNeedsSetup(false);
      } else {
        setUser(null);
        const checkRes = await fetch("/api/auth/check-setup");
        if (checkRes.ok) {
          const { needsSetup: ns } = await checkRes.json();
          setNeedsSetup(ns);
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Login failed" }));
      throw new Error(err.message);
    }
    const data = await res.json();
    setUser(data);
    setNeedsSetup(false);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  const setup = async (data: { username: string; password: string; displayName?: string; email?: string }) => {
    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Setup failed" }));
      throw new Error(err.message);
    }
    const userData = await res.json();
    setUser(userData);
    setNeedsSetup(false);
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, needsSetup, login, logout, setup, refresh, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
