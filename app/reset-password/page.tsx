import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/translations";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">{dict.resetPassword.title}</h1>
      <p className="text-neutral-500 mb-8 text-sm">{dict.resetPassword.subtitle}</p>
      <ResetPasswordForm />
    </div>
  );
}
