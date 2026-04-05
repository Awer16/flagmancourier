"use client";

import { useSession } from "@/components/session/session-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectPath: string;
}

export function RoleGuard({
  children,
  allowedRoles,
  redirectPath,
}: RoleGuardProps): React.ReactElement {
  const { user, isLoggedIn } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push(redirectPath);
      return;
    }
    if (user && !allowedRoles.includes(user.role)) {
      router.push("/");
      return;
    }
    setChecking(false);
  }, [isLoggedIn, user, allowedRoles, redirectPath, router]);

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-primary" />
          <p className="mt-3 text-muted">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
