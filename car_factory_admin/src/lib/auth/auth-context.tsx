"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/config";
import { getAdminUser } from "@/lib/firestore/client";
import { validateAdminAccess } from "@/lib/auth/parse-admin";
import type { AdminUser } from "@/lib/types";

async function resolveAdminUser(firebaseUser: User): Promise<AdminUser | null> {
  const token = await firebaseUser.getIdToken();
  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return (await res.json()) as AdminUser;
    if (res.status === 403) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(body?.error ?? "관리자 권한이 없습니다.");
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("승인")) throw err;
    // Admin SDK unavailable locally — fall back to client Firestore read.
  }
  const admin = await getAdminUser(firebaseUser.uid);
  const accessError = validateAdminAccess(admin);
  if (accessError) throw new Error(accessError);
  return admin;
}

interface AuthContextValue {
  user: User | null;
  adminUser: AdminUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(getClientAuth(), async (firebaseUser) => {
        if (!firebaseUser) {
          setUser(null);
          setAdminUser(null);
          setLoading(false);
          return;
        }
        try {
          const admin = await resolveAdminUser(firebaseUser);
          // Refresh token so Storage rules can read admin custom claims.
          await firebaseUser.getIdToken(true);
          setUser(firebaseUser);
          setAdminUser(admin);
          setError(null);
        } catch (err) {
          await signOut(getClientAuth());
          setUser(null);
          setAdminUser(null);
          setError(
            err instanceof Error ? err.message : "관리자 권한이 없습니다.",
          );
        } finally {
          setLoading(false);
        }
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Firebase 초기화에 실패했습니다.",
      );
      setLoading(false);
    }
    return () => unsub();
  }, []);

  async function login(email: string, password: string) {
    setError(null);
    const cred = await signInWithEmailAndPassword(
      getClientAuth(),
      email,
      password,
    );
    try {
      const admin = await resolveAdminUser(cred.user);
      await cred.user.getIdToken(true);
      setUser(cred.user);
      setAdminUser(admin);
    } catch (err) {
      await signOut(getClientAuth());
      throw err;
    }
  }

  async function logout() {
    await signOut(getClientAuth());
    setUser(null);
    setAdminUser(null);
  }

  async function getIdToken() {
    if (!user) return null;
    return user.getIdToken();
  }

  const value = useMemo(
    () => ({ user, adminUser, loading, error, login, logout, getIdToken }),
    [user, adminUser, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
