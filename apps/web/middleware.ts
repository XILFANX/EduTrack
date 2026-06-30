import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/auth',
  '/invite',   // permanent invite tokens — always public
  '/faq',
  '/help',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/api/admin/bootstrap',
]

/** Returns the home route for each role */
function roleHome(role: string): string {
  switch (role) {
    case 'admin':           return '/admin/dashboard'
    case 'principal':
    case 'headteacher':     return '/dashboard'
    case 'class_teacher':
    case 'subject_teacher': return '/teacher/dashboard'
    case 'bursar':          return '/bursar/dashboard'
    case 'librarian':       return '/library/dashboard'
    case 'storekeeper':     return '/store/dashboard'
    case 'transport_matron':return '/transport/dashboard'
    case 'parent':          return '/parent/dashboard'
    default:                return '/dashboard'
  }
}

/** Returns true if the role is allowed to access the pathname */
function isAllowedForRole(role: string, pathname: string): boolean {
  if (pathname.startsWith('/admin') && role !== 'admin') return false
  if (pathname.startsWith('/teacher') && role !== 'class_teacher' && role !== 'subject_teacher') return false
  if (pathname.startsWith('/bursar') && role !== 'bursar') return false
  if (pathname.startsWith('/library') && role !== 'librarian') return false
  if (pathname.startsWith('/store') && role !== 'storekeeper') return false
  if (pathname.startsWith('/transport') && role !== 'transport_matron') return false
  if (pathname.startsWith('/parent') && role !== 'parent') return false
  // Dashboard routes — principal only
  const principalRoutes = ['/dashboard', '/staff', '/classes', '/students', '/subjects', '/finance', '/reports', '/settings']
  const isPrincipalRoute = principalRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'))
  if (isPrincipalRoute && role !== 'principal' && role !== 'headteacher') return false
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow static assets and API webhooks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/icons') ||
    pathname === '/sw.js' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next()
  }

  // Refresh auth session and get user + profile
  const { supabaseResponse, user, profile } = await updateSession(request)

  // ── Unauthenticated ─────────────────────────────────────────────
  if (!user) {
    if (pathname === '/' || PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
      return supabaseResponse
    }
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // ── Authenticated ───────────────────────────────────────────────
  let role = profile?.role ?? 'principal'

  if (user.email && user.email.toLowerCase() === process.env.PRODUCT_ADMINISTRATOR_EMAIL?.toLowerCase()) {
    role = 'admin'
  }

  // Principal/Headteacher without school_id → must complete onboarding
  if (
    (role === 'principal' || role === 'headteacher') &&
    !profile?.school_id &&
    !pathname.startsWith('/onboarding') &&
    !pathname.startsWith('/auth') &&
    !pathname.startsWith('/invite')
  ) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Authenticated user hitting login/signup → their portal
  if (pathname === '/login' || pathname === '/signup') {
    return NextResponse.redirect(new URL(roleHome(role), request.url))
  }

  // Already set up principal/headteacher hitting onboarding → their portal
  if (profile?.school_id && (role === 'principal' || role === 'headteacher') && pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Cross-portal access guard
  if (!isAllowedForRole(role, pathname)) {
    return NextResponse.redirect(new URL(roleHome(role), request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
