;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="4a2b7869-4b2b-b160-f774-9dc01d36f17b")}catch(e){}}();
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/web/instrumentation-client.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
__turbopack_context__.s([
    "onRouterTransitionStart",
    ()=>onRouterTransitionStart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@sentry/nextjs/build/esm/client/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$replay$2f$build$2f$npm$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/replay/build/npm/esm/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$client$2f$routing$2f$appRouterRoutingInstrumentation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/nextjs/build/esm/client/routing/appRouterRoutingInstrumentation.js [app-client] (ecmascript)");
globalThis["_sentryRouteManifest"] = "{\"dynamicRoutes\":[{\"path\":\"/classes/:id\",\"regex\":\"^/classes/([^/]+)$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false},{\"path\":\"/invite/:token\",\"regex\":\"^/invite/([^/]+)$\",\"paramNames\":[\"token\"],\"hasOptionalPrefix\":false}],\"staticRoutes\":[{\"path\":\"/\"},{\"path\":\"/forgot-password\"},{\"path\":\"/login\"},{\"path\":\"/onboarding\"},{\"path\":\"/signup\"},{\"path\":\"/\"},{\"path\":\"/classes\"},{\"path\":\"/messages\"},{\"path\":\"/staff\"},{\"path\":\"/students\"},{\"path\":\"/about\"},{\"path\":\"/admin\"},{\"path\":\"/api-docs\"},{\"path\":\"/blog\"},{\"path\":\"/bursar\"},{\"path\":\"/bursar/dashboard\"},{\"path\":\"/bursar/fee-structures\"},{\"path\":\"/bursar/invoices\"},{\"path\":\"/careers\"},{\"path\":\"/contact\"},{\"path\":\"/cookies\"},{\"path\":\"/faq\"},{\"path\":\"/help\"},{\"path\":\"/parent\"},{\"path\":\"/parent/dashboard\"},{\"path\":\"/parent/messages\"},{\"path\":\"/privacy\"},{\"path\":\"/security\"},{\"path\":\"/sentry-example-page\"},{\"path\":\"/store\"},{\"path\":\"/store/dashboard\"},{\"path\":\"/store/ledger\"},{\"path\":\"/teacher\"},{\"path\":\"/teacher/attendance\"},{\"path\":\"/teacher/dashboard\"},{\"path\":\"/teacher/grades\"},{\"path\":\"/terms\"},{\"path\":\"/transport\"},{\"path\":\"/transport/dashboard\"}],\"isrRoutes\":[]}";
globalThis["_sentryNextJsVersion"] = "16.1.6";
globalThis["_sentryRewritesTunnelPath"] = "/monitoring";
;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["init"]({
    dsn: "https://59e961947db8150c46b5c073d8ce1b4c@o4510981017567232.ingest.de.sentry.io/4510981019140176",
    // Add optional integrations for additional features
    integrations: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$replay$2f$build$2f$npm$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["replayIntegration"]()
    ],
    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 1,
    // Enable logs to be sent to Sentry
    enableLogs: true,
    // Define how likely Replay events are sampled.
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,
    // Define how likely Replay events are sampled when an error occurs.
    replaysOnErrorSampleRate: 1.0,
    // Enable sending user PII (Personally Identifiable Information)
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
    sendDefaultPii: true
});
const onRouterTransitionStart = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$client$2f$routing$2f$appRouterRoutingInstrumentation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["captureRouterTransitionStart"];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# debugId=4a2b7869-4b2b-b160-f774-9dc01d36f17b
//# sourceMappingURL=apps_web_instrumentation-client_ts_345602ff._.js.map