import AuthPageShell from "@/components/auth/auth-page-shell";
import CourierLoginForm from "@/components/auth/courier-login-form";

export default function CourierLoginPage(): React.ReactElement {
  return (
    <AuthPageShell
      title="Вход для курьера"
      subtitle="Принимайте заказы и доставляйте"
    >
      <CourierLoginForm />
    </AuthPageShell>
  );
}
