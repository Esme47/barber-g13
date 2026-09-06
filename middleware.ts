import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/login";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
  return to;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });

          Object.entries(headers ?? {}).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === LOGIN_PATH;

  if (userError || !user) {
    if (isLoginPage) {
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = "";
    const redirectResponse = copyCookies(response, NextResponse.redirect(loginUrl));
    redirectResponse.headers.set("Cache-Control", "private, no-store");
    return redirectResponse;
  }

  const { data: staffProfile, error: profileError } = await supabase
    .from("staff_profiles")
    .select("id,role,barber_id,full_name,active")
    .eq("user_id", user.id)
    .maybeSingle();

  const validProfile =
    !profileError &&
    !!staffProfile &&
    staffProfile.active === true &&
    (staffProfile.role === "admin" || staffProfile.role === "barber");

  if (!validProfile) {
    await supabase.auth.signOut();

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = "";
    const redirectResponse = copyCookies(response, NextResponse.redirect(loginUrl));
    redirectResponse.headers.set("Cache-Control", "private, no-store");
    return redirectResponse;
  }

  if (isLoginPage) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    const redirectResponse = copyCookies(response, NextResponse.redirect(homeUrl));
    redirectResponse.headers.set("Cache-Control", "private, no-store");
    return redirectResponse;
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
