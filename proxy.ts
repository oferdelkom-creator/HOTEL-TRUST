import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/owner", "/admin", "/book", "/exchange"];

export async function proxy(request: NextRequest) {
  const path=request.nextUrl.pathname;
  if(['/book/','/exchange/','/owner/nights'].some(p=>path.startsWith(p)))return NextResponse.redirect(new URL('/owner',request.url));
  if(path.startsWith('/api/notify/')&&!['/api/notify/welcome','/api/notify/contact-inquiry','/api/notify/new-hotel-review','/api/notify/verification-decision'].includes(path))return NextResponse.json({error:'The room exchange programme has been retired.'},{status:410});
  if(!PROTECTED_PREFIXES.some(p=>path.startsWith(p))&&!path.startsWith('/api/')&&path!=='/login'&&path!=='/reset-password')return NextResponse.next({request});
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if(user||isProtected||path.startsWith('/api/'))response.headers.set('Cache-Control','private, no-store');
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
