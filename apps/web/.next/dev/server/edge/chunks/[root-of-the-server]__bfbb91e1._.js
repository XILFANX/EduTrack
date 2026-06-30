(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__bfbb91e1._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/apps/web/lib/supabase/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "updateSession",
    ()=>updateSession
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
;
;
async function updateSession(request) {
    let supabaseResponse = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next({
        request
    });
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["createServerClient"])(("TURBOPACK compile-time value", "https://gwavhehrhxyfadmquwdf.supabase.co"), ("TURBOPACK compile-time value", "sb_publishable_NFeTHCi2W18OWGjmjEKsGg_fPDX7xmB"), {
        cookies: {
            getAll () {
                return request.cookies.getAll();
            },
            setAll (cookiesToSet) {
                cookiesToSet.forEach(({ name, value })=>request.cookies.set(name, value));
                supabaseResponse = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next({
                    request
                });
                cookiesToSet.forEach(({ name, value, options })=>supabaseResponse.cookies.set(name, value, options));
            }
        }
    });
    // Refresh the session — do NOT remove this await
    const { data: { user } } = await supabase.auth.getUser();
    let profile = null;
    if (user) {
        const { data } = await supabase.from('users').select('role, school_id').eq('id', user.id).single();
        profile = data;
    }
    return {
        supabaseResponse,
        user,
        profile
    };
}
}),
"[project]/apps/web/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$supabase$2f$middleware$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/lib/supabase/middleware.ts [middleware-edge] (ecmascript)");
;
;
const PUBLIC_ROUTES = [
    '/login',
    '/signup',
    '/forgot-password',
    '/auth',
    '/invite',
    '/faq',
    '/help',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/api/admin/bootstrap'
];
/** Returns the home route for each role */ function roleHome(role) {
    switch(role){
        case 'admin':
            return '/admin/dashboard';
        case 'principal':
        case 'headteacher':
            return '/dashboard';
        case 'class_teacher':
        case 'subject_teacher':
            return '/teacher/dashboard';
        case 'bursar':
            return '/bursar/dashboard';
        case 'librarian':
            return '/library/dashboard';
        case 'storekeeper':
            return '/store/dashboard';
        case 'transport_matron':
            return '/transport/dashboard';
        case 'parent':
            return '/parent/dashboard';
        default:
            return '/dashboard';
    }
}
/** Returns true if the role is allowed to access the pathname */ function isAllowedForRole(role, pathname) {
    if (pathname.startsWith('/admin') && role !== 'admin') return false;
    if (pathname.startsWith('/teacher') && role !== 'class_teacher' && role !== 'subject_teacher') return false;
    if (pathname.startsWith('/bursar') && role !== 'bursar') return false;
    if (pathname.startsWith('/library') && role !== 'librarian') return false;
    if (pathname.startsWith('/store') && role !== 'storekeeper') return false;
    if (pathname.startsWith('/transport') && role !== 'transport_matron') return false;
    if (pathname.startsWith('/parent') && role !== 'parent') return false;
    // Dashboard routes — principal only
    const principalRoutes = [
        '/dashboard',
        '/staff',
        '/classes',
        '/students',
        '/subjects',
        '/finance',
        '/reports',
        '/settings'
    ];
    const isPrincipalRoute = principalRoutes.some((r)=>pathname === r || pathname.startsWith(r + '/'));
    if (isPrincipalRoute && role !== 'principal' && role !== 'headteacher') return false;
    return true;
}
async function middleware(request) {
    const { pathname } = request.nextUrl;
    // Always allow static assets and API webhooks
    if (pathname.startsWith('/_next') || pathname.startsWith('/api/webhooks') || pathname.startsWith('/icons') || pathname === '/sw.js' || pathname === '/manifest.json') {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // Refresh auth session and get user + profile
    const { supabaseResponse, user, profile } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$supabase$2f$middleware$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["updateSession"])(request);
    // ── Unauthenticated ─────────────────────────────────────────────
    if (!user) {
        if (pathname === '/' || PUBLIC_ROUTES.some((r)=>pathname.startsWith(r))) {
            return supabaseResponse;
        }
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('next', pathname);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(redirectUrl);
    }
    // ── Authenticated ───────────────────────────────────────────────
    const role = profile?.role ?? 'principal';
    // Principal/Headteacher without school_id → must complete onboarding
    if ((role === 'principal' || role === 'headteacher') && !profile?.school_id && !pathname.startsWith('/onboarding') && !pathname.startsWith('/auth') && !pathname.startsWith('/invite')) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/onboarding', request.url));
    }
    // Authenticated user hitting login/signup → their portal
    if (pathname === '/login' || pathname === '/signup') {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(roleHome(role), request.url));
    }
    // Already set up principal/headteacher hitting onboarding → their portal
    if (profile?.school_id && (role === 'principal' || role === 'headteacher') && pathname.startsWith('/onboarding')) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/dashboard', request.url));
    }
    // Cross-portal access guard
    if (!isAllowedForRole(role, pathname)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(roleHome(role), request.url));
    }
    return supabaseResponse;
}
const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__bfbb91e1._.js.map