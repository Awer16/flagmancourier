import AuthPageShell from "@/components/auth/auth-page-shell";
import RegisterForm from "@/components/auth/register-form";

export default function OwnerRegisterPage(): React.ReactElement {
  return (
    <AuthPageShell
      title="Регистрация владельца"
      subtitle="Создайте аккаунт и добавьте свой ресторан"
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
