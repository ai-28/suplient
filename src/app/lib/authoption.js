import CredentialsProvider from "next-auth/providers/credentials";
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
                    const user = await userRepo.authenticate(email, password);
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
        async jwt({ token, account, user }) {
            if (account && user) {
                token.accessToken = account.access_token;
                token.name = user.name;
                token.email = user.email;
                token.role = user.role;
                token.phone = user.phone;
                token.sub = user.id;
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