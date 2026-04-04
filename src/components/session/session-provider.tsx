"use client";

import ProfileModal from "@/components/session/profile-modal";
import {
  SessionContext,
  type SessionContextValue,
} from "@/components/session/session-context";
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
  const [phoneDigits, setPhoneDigits] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const s = readStored();
    setIsLoggedIn(s.isLoggedIn);
    setPhoneDigits(s.phoneDigits);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ isLoggedIn, phoneDigits }),
      );
    } catch {
      /* ignore */
    }
  }, [isLoggedIn, phoneDigits, hydrated]);

  const login = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
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
      phoneDigits,
      profileOpen,
      login,
      logout,
      openProfile,
      closeProfile,
      saveSessionPhone,
    }),
    [
      isLoggedIn,
      phoneDigits,
      profileOpen,
      login,
      logout,
      openProfile,
      closeProfile,
      saveSessionPhone,
    ],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
      <ProfileModal />
    </SessionContext.Provider>
  );
}
