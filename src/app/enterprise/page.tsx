"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import EnterpriseHome from "@/components/enterprise/enterprise-home";

export default function EnterprisePage(): React.ReactElement {
  return (
    <RoleGuard
      allowedRoles={["enterprise"]}
      redirectPath="/enterprise/login"
    >
      <EnterpriseHome />
    </RoleGuard>
  );
}
