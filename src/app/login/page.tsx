import AuthPageShell from "@/components/auth/auth-page-shell";
import LoginForm from "@/components/auth/login-form";

export default function LoginPage(): React.ReactElement {
  return (
    <AuthPageShell
      title="Вход"
      subtitle="Войдите в аккаунт, чтобы отслеживать заказы и адреса."
    >
      <LoginForm />
    </AuthPageShell>
  );
}
