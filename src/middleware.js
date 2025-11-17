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

                // Check if user is authenticated
                if (!token) {
                    return false;
                }

                const userRole = token.role;
                const isAdminImpersonating = !!token.originalAdminId;

                // Role-based route protection with impersonation support
                if (req.nextUrl.pathname.startsWith("/admin")) {
                    // Admin routes: accessible by admins or admins impersonating others
                    return userRole === 'admin' || isAdminImpersonating;
                }

                if (req.nextUrl.pathname.startsWith("/coach")) {
                    // Coach routes: accessible by coaches or admins impersonating coaches
                    return userRole === 'coach' || isAdminImpersonating;
                }

                if (req.nextUrl.pathname.startsWith("/client")) {
                    // Client routes: accessible by clients or admins impersonating clients
                    return userRole === 'client' || isAdminImpersonating;
                }

                if (req.nextUrl.pathname.startsWith("/dashboard")) {
                    // Dashboard can be accessed by any authenticated user
                    return true;
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
