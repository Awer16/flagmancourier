import AuthPageShell from "@/components/auth/auth-page-shell";
import RegisterForm from "@/components/auth/register-form";

export default function CourierRegisterPage(): React.ReactElement {
  return (
    <AuthPageShell
      title="Регистрация курьера"
      subtitle="Зарегистрируйтесь и начните доставлять заказы"
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
