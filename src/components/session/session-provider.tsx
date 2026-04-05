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

const TOKEN_KEY = "auth_token";
const REFRESH_KEY = "auth_refresh";
const STORAGE_KEY_PREFIX = "courier-here-session";

// Use sessionStorage so each tab has its own session
const storage = typeof window !== "undefined" ? sessionStorage : null;

interface StoredPayload {
  isLoggedIn?: unknown;
  phoneDigits?: string;
  userRole?: string;
}

function getStorageKeys(role?: string): { token: string; refresh: string; session: string } {
  const suffix = role ? `_${role}` : "";
  return {
    token: `${TOKEN_KEY}${suffix}`,
    refresh: `${REFRESH_KEY}${suffix}`,
    session: `${STORAGE_KEY_PREFIX}${suffix}`,
  };
}

function readStored(role?: string): { isLoggedIn: boolean; phoneDigits: string } {
  if (!storage) {
    return { isLoggedIn: false, phoneDigits: "" };
  }
  const keys = getStorageKeys(role);
  try {
    const raw = localStorage.getItem(keys.session);
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

  // Read stored session (without role first, then after login we use role-specific keys)
  useEffect(() => {
    const s = readStored();
    setIsLoggedIn(s.isLoggedIn);
    setPhoneDigits(s.phoneDigits);
    setHydrated(true);
  }, []);

  // Если есть токен — пробуем получить данные с бэкенда
  useEffect(() => {
    if (!hydrated || !isLoggedIn) return;
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isLoggedIn]);

  useEffect(() => {
    if (!hydrated) return;
    const keys = getStorageKeys(user?.role);
    try {
      localStorage.setItem(
        keys.session,
        JSON.stringify({ isLoggedIn, phoneDigits, userRole: user?.role })
      );
    } catch {
      /* ignore */
    }
  }, [isLoggedIn, phoneDigits, hydrated, user?.role]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.getMe();
      const role = me.role as UserProfile["role"];
      const keys = getStorageKeys(role);
      const userObj: UserProfile = {
        id: me.id,
        email: me.email,
        fullName: me.first_name + (me.last_name ? ` ${me.last_name}` : ""),
        phone: me.phone,
        role,
      };
      setUser(userObj);
      setIsLoggedIn(true);
      // Save to BOTH generic and role-specific keys
      localStorage.setItem(keys.session, JSON.stringify({
        isLoggedIn: true,
        phoneDigits: me.phone || "",
        userRole: role,
      }));
    } catch {
      // Token invalid — try all role keys for refresh
      const roles = ["customer", "courier", "company_owner", "enterprise", "moderator"];
      for (const role of roles) {
        const keys = getStorageKeys(role);
        const refresh = localStorage.getItem(keys.refresh);
        if (refresh) {
          try {
            const tokens = await authApi.refreshToken(refresh);
            // Save to both generic and role-specific
            localStorage.setItem(TOKEN_KEY, tokens.access_token);
            localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
            localStorage.setItem(keys.token, tokens.access_token);
            localStorage.setItem(keys.refresh, tokens.refresh_token);
            const me = await authApi.getMe();
            setUser({
              id: me.id,
              email: me.email,
              fullName: me.first_name + (me.last_name ? ` ${me.last_name}` : ""),
              phone: me.phone,
              role: me.role as UserProfile["role"],
            });
            setIsLoggedIn(true);
            return;
          } catch {
            // continue to next role
          }
        }
      }
      // All failed — clear all sessions
      setIsLoggedIn(false);
      setUser(null);
      for (const role of roles) {
        const keys = getStorageKeys(role);
        storage!.removeItem(keys.token);
        storage!.removeItem(keys.refresh);
        storage!.removeItem(keys.session);
      }
      storage!.removeItem(TOKEN_KEY);
      storage!.removeItem(REFRESH_KEY);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const tokens = await authApi.login(email, password);
        // Save to BOTH localStorage (persists) and sessionStorage (per-tab)
        localStorage.setItem(TOKEN_KEY, tokens.access_token);
        localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
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
        const nameParts = (data.fullName || "").trim().split(/\s+/);
        const role = data.role || "customer";
        const tokens = await authApi.register({
          email: data.email,
          password: data.password,
          phone: data.phone || "",
          first_name: nameParts[0] || "User",
          last_name: nameParts.slice(1).join(" ") || undefined,
          role,
        });
        // Save to BOTH localStorage and sessionStorage
        localStorage.setItem(TOKEN_KEY, tokens.access_token);
        localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
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
    // Clear role-specific keys
    const roles = ["customer", "courier", "company_owner", "enterprise", "moderator"];
    for (const role of roles) {
      const keys = getStorageKeys(role);
      localStorage.removeItem(keys.token);
      localStorage.removeItem(keys.refresh);
      localStorage.removeItem(keys.session);
    }
    // Also clear generic keys
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setIsLoggedIn(false);
    setUser(null);
    setPhoneDigits("");
    setProfileOpen(false);
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
