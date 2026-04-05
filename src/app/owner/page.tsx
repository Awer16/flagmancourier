"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import OwnerHome from "@/components/owner/owner-home";

export default function OwnerPage(): React.ReactElement {
  return (
    <RoleGuard
      allowedRoles={["company_owner"]}
      redirectPath="/owner/login"
    >
      <OwnerHome />
    </RoleGuard>
  );
}
