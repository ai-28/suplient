import AuthSessionProvider from "@/app/components/providers/SessionProvider";
import { AuthProvider } from "@/app/context/AuthContext";
import { LanguageProvider } from "@/app/context/LanguageContext";
import SocketProvider from "@/app/components/providers/SocketProvider";
import ServiceWorkerRegistration from "@/app/components/ServiceWorkerRegistration";
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
    icon: "/assets/Suplient-logo.png",
    apple: "/assets/Suplient-logo.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zoom up to 5x for accessibility
  userScalable: true, // Enable zoom for accessibility
  themeColor: "#3b82f6",
  viewportFit: "cover", // Required for iOS safe area insets to work
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent horizontal scroll in Capacitor apps ONLY (not web)
              (function() {
                if (typeof window === 'undefined') return;
                
                // Check if running in Capacitor (not web)
                const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
                
                // Only apply these fixes in Capacitor apps
                if (!isCapacitor) return;
                
                // Force prevent horizontal scroll
                document.documentElement.style.overflowX = 'hidden';
                document.body.style.overflowX = 'hidden';
                
                // Add class to body for Capacitor-specific CSS
                document.body.classList.add('capacitor-app');
                
                // Prevent horizontal scroll on touch move (but allow zoom)
                let lastTouchX = 0;
                let touchStartX = 0;
                let touchStartY = 0;
                let isZooming = false;
                
                document.addEventListener('touchstart', function(e) {
                  if (e.touches.length === 2) {
                    isZooming = true; // Two fingers = zoom gesture
                    return;
                  }
                  isZooming = false;
                  touchStartX = e.touches[0].clientX;
                  touchStartY = e.touches[0].clientY;
                  lastTouchX = touchStartX;
                }, { passive: true });
                
                document.addEventListener('touchmove', function(e) {
                  // Don't interfere with zoom gestures
                  if (isZooming || e.touches.length === 2) {
                    return;
                  }
                  
                  const touchX = e.touches[0].clientX;
                  const touchY = e.touches[0].clientY;
                  const deltaX = Math.abs(touchX - touchStartX);
                  const deltaY = Math.abs(touchY - touchStartY);
                  
                  // Only prevent if horizontal movement is significantly more than vertical
                  // This allows vertical scrolling and zooming
                  if (deltaX > 20 && deltaX > deltaY * 1.5) {
                    // Check if we're at the edge of horizontal scroll
                    const element = e.target;
                    if (element && (element.scrollLeft === 0 || 
                        (element.scrollLeft + element.clientWidth >= element.scrollWidth - 1))) {
                      e.preventDefault();
                    }
                  }
                  lastTouchX = touchX;
                }, { passive: false });
                
                // Continuously check and fix overflow (only in Capacitor)
                setInterval(function() {
                  if (document.documentElement.scrollWidth > window.innerWidth) {
                    document.documentElement.style.overflowX = 'hidden';
                  }
                  if (document.body.scrollWidth > window.innerWidth) {
                    document.body.style.overflowX = 'hidden';
                  }
                }, 100);
              })();
            `,
          }}
        />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
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
        <link rel="apple-touch-icon" href="/assets/Suplient-logo.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/assets/Suplient-logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/Suplient-logo.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/assets/Suplient-logo.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/assets/Suplient-logo.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/assets/Suplient-logo.png" />

        {/* Android PWA Support */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Suplient" />

        {/* Windows PWA Support */}
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-TileImage" content="/assets/Suplient-logo.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Standard Icons */}
        <link rel="icon" type="image/png" href="/assets/Suplient-logo.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/Suplient-logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/Suplient-logo.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/assets/Suplient-logo.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/assets/Suplient-logo.png" />
        <link rel="icon" type="image/png" sizes="128x128" href="/assets/Suplient-logo.png" />
        <link rel="icon" type="image/png" sizes="144x144" href="/assets/Suplient-logo.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/assets/Suplient-logo.png" />
        <link rel="icon" type="image/png" sizes="384x384" href="/assets/Suplient-logo.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/assets/Suplient-logo.png" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/assets/Suplient-logo.png" />

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
        <ServiceWorkerRegistration />
        <AuthSessionProvider>
          <AuthProvider>
            <LanguageProvider>
              <SocketProvider>
                {children}
                <Toaster
                  position="top-right"
                  richColors
                  closeButton
                  classes={{
                    closeButton: 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                  }}
                />
              </SocketProvider>
            </LanguageProvider>
          </AuthProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}