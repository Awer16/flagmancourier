"use client";

import { createContext, useContext } from "react";

export interface UserProfile {
  id: number;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: string;
}

export interface SessionContextValue {
  isLoggedIn: boolean;
  user: UserProfile | null;
  phoneDigits: string;
  profileOpen: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
    role?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  openProfile: () => void;
  closeProfile: () => void;
  saveSessionPhone: (digits: string) => void;
  refreshUser: () => Promise<void>;
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
