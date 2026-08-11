import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Sign in</h1>
      <p className="text-neutral-500 mb-8 text-sm">
        New here? The same form creates your account - you&apos;ll add your hotel and submit
        verification next.
      </p>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
