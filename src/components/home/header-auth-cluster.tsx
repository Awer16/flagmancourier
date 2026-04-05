"use client";

import Link from "next/link";
import { useSession } from "@/components/session/session-context";
import ThemeSwitcher from "@/components/theme/theme-switcher";

const btnClass =
  "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border-soft bg-card px-3 text-sm font-medium text-foreground shadow-[var(--shadow-card)] transition-colors hover:border-primary hover:text-primary sm:h-10 sm:px-4";

const linkClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border-soft bg-card px-2 text-xs text-muted shadow-[var(--shadow-card)] transition-colors hover:border-primary hover:text-primary sm:h-10 sm:px-3 sm:text-sm";

export default function HeaderAuthCluster(): React.ReactElement {
  const { isLoggedIn, user, openProfile, logout } = useSession();

  const roleRoute = user?.role === "company_owner" ? "/owner" : user?.role === "courier" ? "/courier" : "/customer";

  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <ThemeSwitcher />
      {!isLoggedIn && (
        <>
          <Link href="/owner/login" className={linkClass} title="Для владельца">
            <i className="fas fa-store text-xs" aria-hidden />
          </Link>
          <Link href="/courier/login" className={linkClass} title="Для курьера">
            <i className="fas fa-bicycle text-xs" aria-hidden />
          </Link>
        </>
      )}
      {isLoggedIn ? (
        <>
          <Link href={roleRoute} className={linkClass}>
            <i className="fas fa-tachometer-alt text-xs" aria-hidden />
            <span className="hidden sm:inline">Кабинет</span>
          </Link>
          {user?.role === "customer" && (
            <Link href="/customer/orders" className={linkClass}>
              <i className="fas fa-receipt text-xs" aria-hidden />
              <span className="hidden sm:inline">Заказы</span>
            </Link>
          )}
          <button type="button" onClick={openProfile} className={btnClass}>
            <i className="fas fa-user text-xs text-muted sm:text-sm" aria-hidden />
            Профиль
          </button>
          <button type="button" onClick={logout} className={`${linkClass} text-red-400 hover:border-red-500/50 hover:text-red-400`}>
            <i className="fas fa-sign-out-alt text-xs" aria-hidden />
          </button>
        </>
      ) : (
        <Link href="/login" className={btnClass}>
          <i className="fas fa-right-to-bracket text-xs text-muted sm:text-sm" aria-hidden />
          Войти
        </Link>
      )}
    </div>
  );
}
