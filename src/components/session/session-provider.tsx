"use client";

import ProfileModal from "@/components/session/profile-modal";
import {
  SessionContext,
  type SessionContextValue,
  type UserProfile,
} from "@/components/session/session-context";
import { authApi } from "@/lib/api-client";
import { normalizePhoneDigits } from "@/lib/phone-format";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "courier-here-session";

interface StoredPayload {
  isLoggedIn?: unknown;
  phoneDigits?: unknown;
}

function readStored(): { isLoggedIn: boolean; phoneDigits: string } {
  if (typeof window === "undefined") {
    return { isLoggedIn: false, phoneDigits: "" };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { isLoggedIn: false, phoneDigits: "" };
    }
    const p = JSON.parse(raw) as StoredPayload;
    return {
      isLoggedIn: Boolean(p.isLoggedIn),
      phoneDigits:
        typeof p.phoneDigits === "string"
          ? normalizePhoneDigits(p.phoneDigits)
          : "",
    };
  } catch {
    return { isLoggedIn: false, phoneDigits: "" };
  }
}

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const s = readStored();
    setIsLoggedIn(s.isLoggedIn);
    setPhoneDigits(s.phoneDigits);
    setHydrated(true);
  }, []);

  // Если есть сессия — пробуем получить данные с бэкенда
  useEffect(() => {
    if (!hydrated || !isLoggedIn) return;
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isLoggedIn]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ isLoggedIn, phoneDigits })
      );
    } catch {
      /* ignore */
    }
  }, [isLoggedIn, phoneDigits, hydrated]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.getMe();
      setUser({
        id: me.id,
        email: me.email,
        fullName: me.full_name,
        phone: me.phone,
        role: me.role,
      });
      setIsLoggedIn(true);
    } catch {
      // Сессия невалидна — разлогиниваем
      setIsLoggedIn(false);
      setUser(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        await authApi.login(email, password);
        setIsLoggedIn(true);
        await refreshUser();
        return true;
      } catch (e) {
        console.error("Login failed:", e);
        return false;
      }
    },
    [refreshUser]
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      fullName?: string;
      phone?: string;
      role?: string;
    }): Promise<boolean> => {
      try {
        const result = await authApi.register({
          email: data.email,
          password: data.password,
          full_name: data.fullName,
          phone: data.phone,
          role: (data.role as any) || "customer",
        });
        setIsLoggedIn(true);
        await refreshUser();
        return true;
      } catch (e) {
        console.error("Register failed:", e);
        return false;
      }
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    setIsLoggedIn(false);
    setUser(null);
    setPhoneDigits("");
    setProfileOpen(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const openProfile = useCallback(() => {
    setProfileOpen(true);
  }, []);

  const closeProfile = useCallback(() => {
    setProfileOpen(false);
  }, []);

  const saveSessionPhone = useCallback((digits: string) => {
    setPhoneDigits(normalizePhoneDigits(digits));
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      isLoggedIn,
      user,
      phoneDigits,
      profileOpen,
      login,
      register,
      logout,
      openProfile,
      closeProfile,
      saveSessionPhone,
      refreshUser,
    }),
    [
      isLoggedIn,
      user,
      phoneDigits,
      profileOpen,
      login,
      register,
      logout,
      openProfile,
      closeProfile,
      saveSessionPhone,
      refreshUser,
    ]
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
      <ProfileModal />
    </SessionContext.Provider>
  );
}
