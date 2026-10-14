"use client";
import { useEffect } from "react";
// Supabase can fall back to Site URL when an email redirect is not allowlisted.
export default function RecoveryLanding() {
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (query.has("code") || hash.get("type") === "recovery" || hash.has("error")) {
      window.location.replace("/reset-password" + window.location.search + window.location.hash);
    }
  }, []);
  return null;
}
