import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Set a new password</h1>
      <p className="text-neutral-500 mb-8 text-sm">
        You followed a reset link from your email - choose a new password below.
      </p>
      <ResetPasswordForm />
    </div>
  );
}
