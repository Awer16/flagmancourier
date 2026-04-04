"use client";

import { createContext, useContext } from "react";

export interface SessionContextValue {
  isLoggedIn: boolean;
  phoneDigits: string;
  profileOpen: boolean;
  login: () => void;
  logout: () => void;
  openProfile: () => void;
  closeProfile: () => void;
  saveSessionPhone: (digits: string) => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession вне SessionProvider");
  }
  return ctx;
}

export { SessionContext };
