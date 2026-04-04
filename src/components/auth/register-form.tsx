"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useSession } from "@/components/session/session-context";

const fieldClass =
  "w-full rounded-xl border border-border-soft bg-background px-3 py-2.5 text-base text-foreground placeholder:text-muted outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/40";

const labelClass = "text-sm font-medium text-foreground";

export default function RegisterForm(): React.ReactElement {
  const router = useRouter();
  const { register } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError("");

      if (password.length < 6) {
        setError("Пароль должен быть не менее 6 символов");
        return;
      }
      if (password !== passwordRepeat) {
        setError("Пароли не совпадают");
        return;
      }

      setLoading(true);
      const ok = await register({
        email,
        password,
        fullName: name || undefined,
        role: "customer",
      });
      setLoading(false);

      if (ok) {
        router.push("/");
      } else {
        setError("Email уже зарегистрирован");
      }
    },
    [register, email, password, passwordRepeat, name, router]
  );

  return (
    <form className="mt-8 flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="register-name" className={labelClass}>
          Имя
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как к вам обращаться"
          className={fieldClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="register-email" className={labelClass}>
          Электронная почта
        </label>
        <input
          id="register-email"
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
        <label htmlFor="register-password" className={labelClass}>
          Пароль
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Не менее 6 символов"
          className={fieldClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="register-password-repeat" className={labelClass}>
          Повторите пароль
        </label>
        <input
          id="register-password-repeat"
          name="passwordRepeat"
          type="password"
          autoComplete="new-password"
          value={passwordRepeat}
          onChange={(e) => setPasswordRepeat(e.target.value)}
          placeholder="••••••••"
          className={fieldClass}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-foreground shadow-[var(--shadow-card)] transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        {loading ? (
          <>
            <i className="fas fa-spinner fa-spin text-sm" aria-hidden />
            Регистрация...
          </>
        ) : (
          <>
            <i className="fas fa-user-plus text-sm" aria-hidden />
            Зарегистрироваться
          </>
        )}
      </button>
      <p className="text-center text-sm text-muted">
        Уже есть аккаунт?{" "}
        <Link
          href="/login"
          className="font-medium text-primary transition-colors hover:text-primary-hover"
        >
          Войти
        </Link>
      </p>
    </form>
  );
}
