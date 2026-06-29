import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that are publicly accessible without authentication
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/onboarding",     // auth required but profile-check skipped
  "/auth/callback",
  "/invite",         // permanent invite links — always public
  "/pay",            // Quick Pay links are public
  "/faq",
  "/help",
  "/api-docs",
  "/blog",
  "/about",
  "/contact",
  "/careers",
  "/terms",
  "/privacy",
  "/security",
  "/cookies",
];

/** Returns the correct home route for each role (4-portal model) */
function roleHome(role: string): string {
  switch (role) {
    case "tenant":         return "/tenant/dashboard";
    case "caretaker":      return "/caretaker/dashboard";
    case "platform_owner": return "/admin/dashboard";
    case "landlord":
    // Legacy roles — map to landlord dashboard
    case "property_manager":
    case "accountant":
    default:
      return "/dashboard";
  }
}

/**
 * Returns true if a user with `role` is allowed to access `pathname`.
 * Enforces strict portal isolation — wrong portal → redirected home.
 */
function isAllowedForRole(role: string, pathname: string): boolean {
  // Admin portal — platform_owner only
  if (pathname.startsWith("/admin") && role !== "platform_owner") return false;

  // Caretaker portal — caretaker only
  if (pathname.startsWith("/caretaker") && role !== "caretaker") return false;

  // Tenant portal — tenant only
  if ((pathname === "/tenant" || pathname.startsWith("/tenant/")) && role !== "tenant") return false;

  // Landlord portal routes — only landlord (+ legacy roles) can access
  const landlordRoutes = [
    "/dashboard",
    "/properties",
    "/tenants",
    "/rent",
    "/expenses",
    "/maintenance",
    "/staff",
    "/leases",
    "/settings",
  ];
  const isLandlordRoute = landlordRoutes.some((r) => pathname.startsWith(r));
  if (isLandlordRoute && (role === "tenant" || role === "caretaker")) return false;

  return true;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets and webhook endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/admin/bootstrap") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js"
  ) {
    return NextResponse.next();
  }

  // Refresh session cookie and get user + profile
  const { supabaseResponse, user, profile } = await updateSession(request);

  // ── Unauthenticated users ──────────────────────────────────────────────────
  if (!user) {
    if (pathname === "/" || PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
      return supabaseResponse;
    }
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // ── Authenticated users ────────────────────────────────────────────────────
  const role = profile?.role ?? "landlord";

  // New user with no landlord_id → must complete onboarding first
  // Exception: tenants, caretakers, and platform_owners don't need a landlord_id at this stage
  if (
    !profile?.landlord_id &&
    role !== "tenant" &&
    role !== "caretaker" &&
    role !== "platform_owner" &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/invite")
  ) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // Authenticated user hitting /login or /signup → their portal
  if (pathname === "/login" || pathname === "/signup") {
    return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  // Authenticated user hitting /onboarding after completing setup → their portal
  if (profile?.landlord_id && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  // Role-based cross-portal access guard
  if (!isAllowedForRole(role, pathname)) {
    return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
