import Link from "next/link";

interface AuthPageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AuthPageShell({
  title,
  subtitle,
  children,
}: AuthPageShellProps): React.ReactElement {
  return (
    <div className="relative min-h-dvh w-full flex-1 bg-background">
      <div className="fixed left-0 top-0 z-40 p-4 sm:left-1 sm:top-1 sm:p-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-border-soft bg-card/95 px-3 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-card)] backdrop-blur-sm transition-colors hover:border-primary hover:text-primary sm:px-4"
        >
          <i className="fas fa-arrow-left text-xs text-muted" aria-hidden />
          Назад
        </Link>
      </div>
      <main className="flex min-h-dvh flex-col items-center justify-center px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-24">
        <div className="w-full max-w-md rounded-2xl border border-border-soft bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-muted sm:text-base">{subtitle}</p>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
