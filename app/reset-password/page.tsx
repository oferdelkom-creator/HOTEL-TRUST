import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Новый пароль</h1>
      <p className="text-neutral-500 mb-8 text-sm">
        Вы перешли по ссылке из письма — задайте новый пароль ниже.
      </p>
      <ResetPasswordForm />
    </div>
  );
}
