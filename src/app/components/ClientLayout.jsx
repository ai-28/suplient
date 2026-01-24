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

  const isActiveRoute = (path) => pathname === path;

  // Conditional styles based on platform
  const containerStyle = isIOSNative ? {
    height: '100dvh',
    maxHeight: '100dvh',
    minHeight: '100dvh',
    paddingTop: 'env(safe-area-inset-top, 0px)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    overflow: 'hidden',
  } : {
    height: '100vh',
    maxHeight: '100vh',
  };

  const contentStyle = isIOSNative ? {
    paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
    WebkitOverflowScrolling: 'touch',
  } : {
    paddingBottom: '80px', // Account for bottom nav on all platforms
  };

  const bottomNavStyle = isIOSNative ? {
    paddingBottom: `calc(1rem + env(safe-area-inset-bottom, 0px))`,
    position: 'sticky',
    bottom: 0,
    zIndex: 50,
    marginTop: 'auto',
  } : {
    position: 'sticky',
    bottom: 0,
    zIndex: 50,
    marginTop: 'auto',
  };

  return (
    <SubscriptionGuard>
    <div 
      className="bg-background flex flex-col"
      style={containerStyle}
    >
      {/* Main Content */}
      <div 
        className="flex-1 overflow-y-auto"
        style={contentStyle}
      >
        {children}
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Bottom Navigation */}
      <div 
        className="bg-card border-t border-border p-4 shadow-lg"
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
            <span className={`text-xs ${isActiveRoute('/client/tasks') ? 'text-primary font-medium' : ''}`}>{t('client.navigation.action', 'Action')}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center space-y-1 h-auto p-2 ${isActiveRoute('/client/resources') ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => router.push('/client/resources')}
          >
            <Play className={`h-6 w-6 ${isActiveRoute('/client/resources') ? 'text-primary' : ''}`} />
            <span className={`text-xs ${isActiveRoute('/client/resources') ? 'text-primary font-medium' : ''}`}>{t('client.navigation.explore', 'Explore')}</span>
          </Button>
        </div>
      </div>
    </div>
    </SubscriptionGuard>
  );
}