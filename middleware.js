import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
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

  // Name is now slightly imprecise — this is really "routes reachable
  // without a session" (login/auth flow, plus /help, which is static
  // content with no user-scoped data and no reason to require an account).
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname === "/help";
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");

  // "sp_guest" is a plain marker cookie set client-side when someone clicks
  // "Continue as guest" on the login page. It is NOT a Supabase session and
  // carries no data — it only tells this middleware "let this visitor reach
  // the one guest-accessible route without a real account." Guests only get
  // /planner/guest specifically: the Library and Gallery both require a real
  // account to mean anything (there's nothing to list or save for a guest),
  // so this cookie's scope is intentionally narrow rather than opening up
  // "/" the way it did before planners/folders existed.
  const isGuest = request.cookies.get("sp_guest")?.value === "1";
  const isGuestPlannerRoute = request.nextUrl.pathname === "/planner/guest";

  // API routes are left alone here and handle their own auth check,
  // returning a clean 401 JSON body — redirecting a fetch() call to the
  // HTML login page would fail when the client tries to parse that
  // response as JSON.
  if (!user && !isAuthRoute && !isApiRoute && !(isGuest && isGuestPlannerRoute)) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Already logged in and hitting /login -> bounce to the library.
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
