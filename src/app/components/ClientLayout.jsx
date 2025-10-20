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

export default function ClientLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Register service worker for PWA functionality
  useServiceWorker();

  const isActiveRoute = (path) => pathname === path;

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Bottom Navigation - Flexbox */}
      <div className="bg-card border-t border-border p-4 shadow-lg">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center space-y-1 h-auto p-2 ${isActiveRoute('/client') ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => router.push('/client')}
          >
            <Home className={`h-6 w-6 ${isActiveRoute('/client') ? 'text-primary' : ''}`} />
            <span className={`text-xs ${isActiveRoute('/client') ? 'text-primary font-medium' : ''}`}>Today</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center space-y-1 h-auto p-2 ${isActiveRoute('/client/sessions') ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => router.push('/client/sessions')}
          >
            <MessageCircle className={`h-6 w-6 ${isActiveRoute('/client/sessions') ? 'text-primary' : ''}`} />
            <span className={`text-xs ${isActiveRoute('/client/sessions') ? 'text-primary font-medium' : ''}`}>Chat</span>
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
            <span className={`text-xs ${isActiveRoute('/client/tasks') ? 'text-primary font-medium' : ''}`}>Action</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center space-y-1 h-auto p-2 ${isActiveRoute('/client/resources') ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => router.push('/client/resources')}
          >
            <Play className={`h-6 w-6 ${isActiveRoute('/client/resources') ? 'text-primary' : ''}`} />
            <span className={`text-xs ${isActiveRoute('/client/resources') ? 'text-primary font-medium' : ''}`}>Explore</span>
          </Button>
        </div>
      </div>
    </div>
  );
}