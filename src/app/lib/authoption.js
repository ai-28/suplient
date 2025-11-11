import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { userRepo } from "@/app/lib/db/userRepo";

const authOptions = {
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials) {
                    return null;
                }
                const { email, password } = credentials;

                try {
                    // Normalize email to lowercase before authentication
                    const normalizedEmail = email.toLowerCase().trim();
                    const user = await userRepo.authenticate(normalizedEmail, password);
                    if (user) {
                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                            phone: user.phone,
                        };
                    }
                    return null;
                } catch (error) {
                    console.log("Authentication error:", error);
                    // Throw the specific error message to be handled by NextAuth
                    throw new Error(error.message);
                }
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: "openid email profile"
                }
            }
        })
    ],
    pages: {
        error: '/login',
        signIn: '/login',
        signOut: '/login',
    },
    session: {
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
    callbacks: {
        async jwt({ token, account, user, trigger, session: jwtSession }) {
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.expiresAt = account.expires_at;
            }
            if (user) {
                token.name = user.name;
                token.email = user.email;
                token.role = user.role;
                token.phone = user.phone;
                token.sub = user.id;
            }

            // Handle impersonation updates
            if (trigger === "update" && jwtSession?.impersonate) {
                const { targetUserId, targetUserRole, targetUserName, targetUserEmail } = jwtSession.impersonate;
                if (targetUserId) {
                    // Store original admin info
                    token.originalAdminId = token.originalAdminId || token.sub;
                    token.originalAdminRole = token.originalAdminRole || token.role;
                    token.originalAdminName = token.originalAdminName || token.name;
                    // Set active user (impersonated)
                    token.sub = targetUserId;
                    token.role = targetUserRole;
                    token.name = targetUserName;
                    token.email = targetUserEmail;
                } else {
                    // Stop impersonation - restore original admin
                    if (token.originalAdminId) {
                        token.sub = token.originalAdminId;
                        token.role = token.originalAdminRole;
                        token.name = token.originalAdminName;
                        delete token.originalAdminId;
                        delete token.originalAdminRole;
                        delete token.originalAdminName;
                    }
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.role = token.role;
                session.user.phone = token.phone;
                session.accessToken = token.accessToken;
                session.refreshToken = token.refreshToken;
                session.expiresAt = token.expiresAt;

                // Add impersonation info if active
                if (token.originalAdminId) {
                    session.user.originalAdminId = token.originalAdminId;
                    session.user.originalAdminRole = token.originalAdminRole;
                    session.user.originalAdminName = token.originalAdminName;
                    session.user.isImpersonating = true;
                } else {
                    session.user.isImpersonating = false;
                }
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // If the URL is relative, prepend the base URL
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            // If the URL is already absolute, return it
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
    },
};

export default authOptions;