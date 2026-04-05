import AuthPageShell from "@/components/auth/auth-page-shell";
import EnterpriseLoginForm from "@/components/auth/enterprise-login-form";

export default function EnterpriseLoginPage(): React.ReactElement {
  return (
    <AuthPageShell
      title="Вход для предприятия"
      subtitle="Подтверждайте заказы и управляйте доставкой"
    >
      <EnterpriseLoginForm />
    </AuthPageShell>
  );
}
