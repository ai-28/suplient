"use client"

import { Button } from "@/app/components/ui/button";
import { 
  Home,
  Plus,
  Play,
  MessageCircle,
  CheckCircle,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import PWAInstallPrompt from "./PWAInstallPrompt";
import { useServiceWorker } from "@/app/hooks/useServiceWorker";
import { useTranslation } from "@/app/context/LanguageContext";
import SubscriptionGuard from "./SubscriptionGuard";
import { isIOS } from "@/lib/capacitor";
import { useEffect, useState } from "react";
import { GlobalNotificationListener } from "./GlobalNotificationListener";

export default function ClientLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslation();
  const [isIOSNative, setIsIOSNative] = useState(false);
  
  // Register service worker for PWA functionality
  useServiceWorker();

  // Check if running on iOS Capacitor (client-side only)
  useEffect(() => {
    setIsIOSNative(isIOS());
  }, []);

  // Prevent body scroll on iOS to keep layout fixed
  useEffect(() => {
    if (isIOSNative) {
      // Lock body scroll
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      return () => {
        // Restore on unmount
        document.body.style.overflow = originalStyle;
        document.documentElement.style.overflow = originalStyle;
      };
    }
  }, [isIOSNative]);

  // Prevent horizontal scroll - ONLY in Capacitor apps (not web)
  useEffect(() => {
    // Check if running in Capacitor
    const isCapacitor = typeof window !== 'undefined' && 
                       window.Capacitor && 
                       window.Capacitor.isNativePlatform && 
                       window.Capacitor.isNativePlatform();
    
    // Only run in Capacitor apps
    if (!isCapacitor) return;

    const preventHorizontalScroll = () => {
      // Force prevent horizontal scroll on all elements
      document.documentElement.style.overflowX = 'hidden';
      document.body.style.overflowX = 'hidden';
      
      // Find and fix any elements causing overflow
      const allElements = document.querySelectorAll('*');
      allElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          const computedStyle = window.getComputedStyle(el);
          if (computedStyle.overflowX !== 'hidden' && computedStyle.overflowX !== 'clip') {
            // Only fix elements that might cause horizontal scroll
            if (el.scrollWidth > el.clientWidth && el.scrollWidth > window.innerWidth) {
              el.style.overflowX = 'hidden';
            }
          }
        }
      });
    };

    // Run immediately
    preventHorizontalScroll();

    // Run on resize and scroll events
    window.addEventListener('resize', preventHorizontalScroll);
    window.addEventListener('scroll', preventHorizontalScroll);
    
    // Use MutationObserver to catch dynamically added content
    const observer = new MutationObserver(preventHorizontalScroll);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      window.removeEventListener('resize', preventHorizontalScroll);
      window.removeEventListener('scroll', preventHorizontalScroll);
      observer.disconnect();
    };
  }, []);

  const isActiveRoute = (path) => pathname === path;

  // Conditional styles based on platform
  // Use 100dvh for iOS to handle dynamic viewport, 100vh for others
  // Position absolute to lock it in place and prevent body scroll
  const containerStyle = isIOSNative ? {
    height: '100dvh',
    maxHeight: '100dvh',
    minHeight: '100dvh',
    overflow: 'hidden',
    overflowX: 'hidden', // Prevent horizontal scroll
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    maxWidth: '100vw', // Ensure no horizontal overflow
  } : {
    height: '100vh',
    maxHeight: '100vh',
    overflow: 'hidden',
    overflowX: 'hidden', // Prevent horizontal scroll
    position: 'relative',
    maxWidth: '100vw', // Ensure no horizontal overflow
  };

  // Content area - add bottom padding to account for fixed bottom nav
  // Bottom nav: p-3 (12px) + content (~56px) + safe area = ~68px + safe area
  const contentStyle = isIOSNative ? {
    paddingBottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
    WebkitOverflowScrolling: 'touch',
    height: '100%',
    overflowY: 'auto', // Allow vertical scroll
    overflowX: 'hidden', // Prevent horizontal scroll
    position: 'relative',
    width: '100%',
    maxWidth: '100vw', // Ensure no horizontal overflow
  } : {
    paddingBottom: '68px', // Account for bottom nav height
    height: '100%',
    overflowY: 'auto', // Allow vertical scroll
    overflowX: 'hidden', // Prevent horizontal scroll
    width: '100%',
    maxWidth: '100vw', // Ensure no horizontal overflow
  };

  // Bottom nav should be fixed, not sticky, to prevent movement
  const bottomNavStyle = isIOSNative ? {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom, 0px))`,
    zIndex: 50,
    backgroundColor: 'hsl(var(--card))',
  } : {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'hsl(var(--card))',
  };

  return (
    <SubscriptionGuard>
    <div 
      className="bg-background flex flex-col"
      style={containerStyle}
    >
      {/* Global notification listener - shows toasts on all client pages */}
      <GlobalNotificationListener />
      
      {/* Main Content */}
      <div 
        className="overflow-y-auto"
        style={contentStyle}
      >
        {children}
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Bottom Navigation - Fixed position to prevent movement */}
      <div 
        className="border-t border-border p-3 shadow-lg"
        style={bottomNavStyle}
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center space-y-1 h-auto p-2 ${isActiveRoute('/client') ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => router.push('/client')}
          >
            <Home className={`h-6 w-6 ${isActiveRoute('/client') ? 'text-primary' : ''}`} />
            <span className={`text-xs ${isActiveRoute('/client') ? 'text-primary font-medium' : ''}`}>{t('client.navigation.today', 'Today')}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center space-y-1 h-auto p-2 ${isActiveRoute('/client/sessions') ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => router.push('/client/sessions')}
          >
            <MessageCircle className={`h-6 w-6 ${isActiveRoute('/client/sessions') ? 'text-primary' : ''}`} />
            <span className={`text-xs ${isActiveRoute('/client/sessions') ? 'text-primary font-medium' : ''}`}>{t('client.navigation.chat', 'Chat')}</span>
          </Button>
          
          <Button 
            className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
            onClick={() => router.push('/client/journal')}
          >
            <Plus className="h-6 w-6" />
          </Button>
          
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center space-y-1 h-auto p-2 ${isActiveRoute('/client/tasks') ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => router.push('/client/tasks')}
          >
            <CheckCircle className={`h-6 w-6 ${isActiveRoute('/client/tasks') ? 'text-primary' : ''}`} />
            <span className={`text-xs ${isActiveRoute('/client/tasks') ? 'text-primary font-medium' : ''}`}>{t('client.navigation.task', 'Task')}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center space-y-1 h-auto p-2 ${isActiveRoute('/client/resources') ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => router.push('/client/resources')}
          >
            <Play className={`h-6 w-6 ${isActiveRoute('/client/resources') ? 'text-primary' : ''}`} />
            <span className={`text-xs ${isActiveRoute('/client/resources') ? 'text-primary font-medium' : ''}`}>{t('client.navigation.library', 'Library')}</span>
          </Button>
        </div>
      </div>
    </div>
    </SubscriptionGuard>
  );
}