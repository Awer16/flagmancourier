"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import CourierHome from "@/components/courier/courier-home";

export default function CourierPage(): React.ReactElement {
  return (
    <RoleGuard
      allowedRoles={["courier"]}
      redirectPath="/courier/login"
    >
      <CourierHome />
    </RoleGuard>
  );
}
