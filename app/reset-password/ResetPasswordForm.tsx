"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const recoveryCheck = useRef<Promise<string | null> | null>(null);
  useEffect(() => {
    let active = true;
    if (!recoveryCheck.current) recoveryCheck.current = (async () => {
      const params = new URLSearchParams(window.location.search);
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      if (params.has("error") || fragment.has("error")) return "This reset link is invalid or has expired. Request a new link and open only the newest email.";
      const supabase = createClient();
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState(null, "", "/reset-password");
        if (error) return "Could not verify this link. Request a new link in this browser.";
      }
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return "No valid recovery session. Request a new reset link in this browser.";
      window.history.replaceState(null, "", "/reset-password");
      return null;
    })().catch(() => "Could not verify this reset link. Please request a new one.");
    recoveryCheck.current.then(message => { if (active) { setError(message); setReady(!message); } });
    return () => { active = false; };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!ready || loading) return;
    setLoading(true); setError(null);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) { setError("The password could not be saved. The link may have expired; request a new one."); setReady(false); return; }
      setPassword(""); router.replace("/admin/channex"); router.refresh();
    } catch { setError("Could not save your password. Please try again."); }
    finally { setLoading(false); }
  }

  return <div>
    {!ready && !error && <p role="status">Verifying your reset link…</p>}
    {error && <p role="alert" className="mb-4 text-red-600">{error}</p>}
    {!ready && error && <Link className="text-brand-green underline" href="/login?reset=1">Request a new reset link</Link>}
    {ready && <form onSubmit={handleSubmit} className="space-y-4">
      <label htmlFor="new-password" className="block text-sm font-medium">New password</label>
      <input id="new-password" autoComplete="new-password" required type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2" />
      <button type="submit" disabled={loading} className="w-full rounded-md bg-brand-green text-brand-gold px-4 py-2 disabled:opacity-50">{loading ? "Saving…" : "Set new password"}</button>
    </form>}
  </div>;
}
