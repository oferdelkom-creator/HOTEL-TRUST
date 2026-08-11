"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        if (data.user && !data.session) {
          // Email confirmation is required on this Supabase project, so
          // there's no authenticated session yet - inserting the profile
          // now would fail RLS (auth.uid() would be null). Nothing more to
          // do client-side until they click the confirmation link.
          setError(
            "Check your email to confirm your account before signing in - we've sent a confirmation link."
          );
          setLoading(false);
          return;
        }

        if (data.user) {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            email,
            full_name: fullName,
            role: "hotel_owner",
          });
          if (profileError) throw profileError;

          await fetch("/api/notify/welcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId: data.user.id }),
          }).catch(() => {});
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      const next = searchParams.get("next") || "/owner";
      router.push(next);
      router.refresh();
    } catch (err) {
      // Supabase auth/postgrest errors are plain objects, not Error
      // instances, so `err instanceof Error` alone was silently swallowing
      // the real reason and always showing a useless generic message.
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-6 text-sm">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`px-3 py-1.5 rounded-md ${mode === "signin" ? "bg-brand-green text-brand-gold" : "bg-neutral-100"}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`px-3 py-1.5 rounded-md ${mode === "signup" ? "bg-brand-green text-brand-gold" : "bg-neutral-100"}`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
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
          <label className="block text-sm font-medium mb-1">Password</label>
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
          className="w-full rounded-md bg-brand-green text-brand-gold px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
