import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        // Add any additional middleware logic here
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Allow access to login page and other public routes
                if (req.nextUrl.pathname.startsWith("/login") ||
                    req.nextUrl.pathname.startsWith("/register") ||
                    req.nextUrl.pathname.startsWith("/forgot-password") ||
                    req.nextUrl.pathname.startsWith("/reset-password") ||
                    req.nextUrl.pathname.startsWith("/setup-2fa") ||
                    req.nextUrl.pathname === "/") {
                    return true;
                }

                // Protect all authenticated routes
                if (req.nextUrl.pathname.startsWith("/coach") ||
                    req.nextUrl.pathname.startsWith("/admin") ||
                    req.nextUrl.pathname.startsWith("/client") ||
                    req.nextUrl.pathname.startsWith("/dashboard")) {
                    return !!token;
                }
                return true;
            },
        },
        pages: {
            signIn: '/login',
        },
    }
);

export const config = {
    matcher: [
        "/coach/:path*",
        "/admin/:path*",
        "/client/:path*",
        "/dashboard/:path*",
    ],
};
