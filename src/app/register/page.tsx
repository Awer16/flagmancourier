import AuthPageShell from "@/components/auth/auth-page-shell";
import RegisterForm from "@/components/auth/register-form";

export default function RegisterPage(): React.ReactElement {
  return (
    <AuthPageShell
      title="Регистрация"
      subtitle="Создайте аккаунт покупателя — доставка станет удобнее."
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
