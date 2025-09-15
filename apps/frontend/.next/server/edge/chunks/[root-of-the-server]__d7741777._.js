(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__d7741777._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/Documents/xeno/shopify-mt/apps/frontend/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$4$2e$24$2e$11_next$40$15$2e$5$2e$2_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0_$5f$nodemailer$40$7_faed4ecdec8ff78f28843a701908915f$2f$node_modules$2f$next$2d$auth$2f$middleware$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/xeno/shopify-mt/node_modules/.pnpm/next-auth@4.24.11_next@15.5.2_react-dom@19.1.0_react@19.1.0__react@19.1.0__nodemailer@7_faed4ecdec8ff78f28843a701908915f/node_modules/next-auth/middleware.js [middleware-edge] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$4$2e$24$2e$11_next$40$15$2e$5$2e$2_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0_$5f$nodemailer$40$7_faed4ecdec8ff78f28843a701908915f$2f$node_modules$2f$next$2d$auth$2f$middleware$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["withAuth"])(function middleware(req) {
// Add any additional middleware logic here
}, {
    callbacks: {
        authorized: ({ token, req })=>{
            // Protect dashboard routes
            if (req.nextUrl.pathname.startsWith('/dashboard')) {
                return !!token;
            }
            return true;
        }
    }
});
const config = {
    matcher: [
        '/dashboard/:path*'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__d7741777._.js.map