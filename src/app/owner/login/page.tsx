import AuthPageShell from "@/components/auth/auth-page-shell";
import OwnerLoginForm from "@/components/auth/owner-login-form";

export default function OwnerLoginPage(): React.ReactElement {
  return (
    <AuthPageShell
      title="Вход для владельца"
      subtitle="Управляйте вашим рестораном и меню"
    >
      <OwnerLoginForm />
    </AuthPageShell>
  );
}
