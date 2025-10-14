import AuthSessionProvider from "@/app/components/providers/SessionProvider";
import { AuthProvider } from "@/app/context/AuthContext";
import SocketProvider from "@/app/components/providers/SocketProvider";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Mental Coach Platform",
  description: "A comprehensive mental coaching platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthSessionProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </AuthProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
