"use client";

import Link from "next/link";
import { useSession } from "@/components/session/session-context";
import ThemeSwitcher from "@/components/theme/theme-switcher";

const btnClass =
  "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border-soft bg-card px-3 text-sm font-medium text-foreground shadow-[var(--shadow-card)] transition-colors hover:border-primary hover:text-primary sm:h-10 sm:px-4";

export default function HeaderAuthCluster(): React.ReactElement {
  const { isLoggedIn, openProfile } = useSession();

  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <ThemeSwitcher />
      {isLoggedIn ? (
        <button type="button" onClick={openProfile} className={btnClass}>
          <i
            className="fas fa-user text-xs text-muted sm:text-sm"
            aria-hidden
          />
          Профиль
        </button>
      ) : (
        <Link href="/login" className={btnClass}>
          <i
            className="fas fa-right-to-bracket text-xs text-muted sm:text-sm"
            aria-hidden
          />
          Войти
        </Link>
      )}
    </div>
  );
}
