import AuthSessionProvider from "@/app/components/providers/SessionProvider";
import { AuthProvider } from "@/app/context/AuthContext";
import SocketProvider from "@/app/components/providers/SocketProvider";
import { Toaster } from "sonner";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Suplient - Mental Coach Platform",
  description: "Your personal mental coaching companion",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Suplient",
  },
  icons: {
    icon: "/assets/icons/icon-192x192.svg",
    apple: "/assets/icons/icon-192x192.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Suplient" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Suplient" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#3b82f6" />

        {/* iOS PWA Support */}
        <link rel="apple-touch-icon" href="/assets/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/assets/icons/icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="167x167" href="/assets/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="120x120" href="/assets/icons/icon-128x128.svg" />
        <link rel="apple-touch-icon" sizes="76x76" href="/assets/icons/icon-96x96.svg" />

        {/* Android PWA Support */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Suplient" />

        {/* Windows PWA Support */}
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-TileImage" content="/assets/icons/icon-144x144.svg" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Standard Icons */}
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/assets/icons/icon-32x32.svg" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/assets/icons/icon-16x16.svg" />
        <link rel="icon" type="image/svg+xml" sizes="48x48" href="/assets/icons/icon-72x72.svg" />
        <link rel="icon" type="image/svg+xml" sizes="96x96" href="/assets/icons/icon-96x96.svg" />
        <link rel="icon" type="image/svg+xml" sizes="128x128" href="/assets/icons/icon-128x128.svg" />
        <link rel="icon" type="image/svg+xml" sizes="144x144" href="/assets/icons/icon-144x144.svg" />
        <link rel="icon" type="image/svg+xml" sizes="192x192" href="/assets/icons/icon-192x192.svg" />
        <link rel="icon" type="image/svg+xml" sizes="384x384" href="/assets/icons/icon-384x384.svg" />
        <link rel="icon" type="image/svg+xml" sizes="512x512" href="/assets/icons/icon-512x512.svg" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/assets/icons/icon-192x192.svg" />

        {/* Additional PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Suplient" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Open Graph / Social Media */}
        <meta property="og:title" content="Suplient - Mental Coach" />
        <meta property="og:description" content="Your personal mental coaching companion" />
        <meta property="og:image" content="/assets/icons/icon-512x512.svg" />
        <meta property="og:url" content="https://suplient.com" />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Suplient - Mental Coach" />
        <meta name="twitter:description" content="Your personal mental coaching companion" />
        <meta name="twitter:image" content="/assets/icons/icon-512x512.svg" />
      </head>
      <body className={inter.className}>
        <AuthSessionProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
              <Toaster position="top-right" richColors />
            </SocketProvider>
          </AuthProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
