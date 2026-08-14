"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        setInfo("Если такой email зарегистрирован, мы отправили на него ссылку для сброса пароля.");
        setLoading(false);
        return;
      }

      if (mode === "signup") {
        // full_name goes in user metadata, not a separate insert - a DB
        // trigger creates the profiles row from this the moment the auth
        // user is created, regardless of whether email confirmation delays
        // the session (a client-side insert would need auth.uid(), which
        // isn't set yet in that case).
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;

        if (!data.session) {
          setError(
            "Проверьте почту и подтвердите регистрацию по ссылке из письма, затем войдите."
          );
          setLoading(false);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      const next = searchParams.get("next") || "/account";
      router.push(next);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Что-то пошло не так";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (mode === "forgot") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setMode("signin")}
          className="text-sm text-brand underline mb-6"
        >
          &larr; Назад ко входу
        </button>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-brand">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand text-white px-4 py-2 disabled:opacity-50"
          >
            {loading ? "Отправляем..." : "Отправить ссылку"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-6 text-sm">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`px-3 py-1.5 rounded-md ${mode === "signin" ? "bg-brand text-white" : "bg-neutral-100"}`}
        >
          Войти
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`px-3 py-1.5 rounded-md ${mode === "signup" ? "bg-brand text-white" : "bg-neutral-100"}`}
        >
          Создать аккаунт
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-sm font-medium mb-1">Имя</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Пароль</label>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand text-white px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Подождите..." : mode === "signup" ? "Создать аккаунт" : "Войти"}
        </button>

        {mode === "signin" && (
          <button
            type="button"
            onClick={() => setMode("forgot")}
            className="text-sm text-neutral-500 underline block mx-auto"
          >
            Забыли пароль?
          </button>
        )}
      </form>
    </div>
  );
}
