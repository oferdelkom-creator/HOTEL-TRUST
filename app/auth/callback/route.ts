import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point for Supabase email confirmation links (see emailRedirectTo
// in LoginForm.tsx). Exchanges the code for a session, then sends the
// owner straight to the hotel form if they haven't registered one yet -
// otherwise there's no forced path back to /owner/hotel/new and a
// confirmed user can land on /owner without noticing the "Add hotel" CTA.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (next) return NextResponse.redirect(`${origin}${next}`);

      const { data: hotel } = await supabase
        .from("hotels")
        .select("id")
        .eq("owner_id", data.user.id)
        .maybeSingle();

      return NextResponse.redirect(`${origin}${hotel ? "/owner" : "/owner/hotel/new"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
