"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useSession } from "@/components/session/session-context";

const fieldClass =
  "w-full rounded-xl border border-border-soft bg-background px-3 py-2.5 text-base text-foreground placeholder:text-muted outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/40";

const labelClass = "text-sm font-medium text-foreground";

export default function OwnerLoginForm(): React.ReactElement {
  const router = useRouter();
  const { login } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      const ok = await login(email, password);
      setLoading(false);
      if (ok) {
        router.push("/owner");
      } else {
        setError("Неверный email или пароль");
      }
    },
    [login, email, password, router]
  );

  return (
    <form className="mt-8 flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="owner-login-email" className={labelClass}>
          Электронная почта
        </label>
        <input
          id="owner-login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={fieldClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="owner-login-password" className={labelClass}>
          Пароль
        </label>
        <div className="relative">
          <input
            id="owner-login-password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`${fieldClass} pr-11`}
          />
          <button
            type="button"
            aria-label={passwordVisible ? "Скрыть пароль" : "Показать пароль"}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((v) => !v)}
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border-soft/60 hover:text-foreground"
          >
            <i
              className={`fas ${passwordVisible ? "fa-eye-slash" : "fa-eye"} text-sm`}
              aria-hidden
            />
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-foreground shadow-[var(--shadow-card)] transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        {loading ? (
          <>
            <i className="fas fa-spinner fa-spin text-sm" aria-hidden />
            Вход...
          </>
        ) : (
          <>
            <i className="fas fa-right-to-bracket text-sm" aria-hidden />
            Войти как владелец
          </>
        )}
      </button>
      <p className="text-center text-sm text-muted">
        Нет аккаунта?{" "}
        <Link
          href="/owner/register"
          className="font-medium text-primary transition-colors hover:text-primary-hover"
        >
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
}
