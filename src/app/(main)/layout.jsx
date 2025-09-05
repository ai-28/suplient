"use client"

import { AppSidebar } from "@/app/components/AppSidebar";
import { SidebarProvider } from "@/app/components/ui/sidebar";
import { NotificationSystem } from "@/app/components/NotificationSystem";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { Button } from "@/app/components/ui/button";
import { Avatar } from "@/app/components/ui/avatar";
import { BookMarked, LogOut } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useEffect, useState } from "react";

const Layout = ({ children }) => {
    const pathname = usePathname();
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    
    // Only show sidebar for coach and admin routes, not for client routes
    const shouldShowSidebar = pathname.startsWith('/coach') || pathname.startsWith('/admin');
    const isClientRoute = pathname.startsWith('/client');

    // Prevent hydration mismatch by only rendering after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // For client routes, just render children without any main layout wrapper
    if (isClientRoute) {
        return <>{children}</>;
    }

    // Prevent hydration mismatch by showing loading state
    if (!mounted) {
        return (
            <div className="min-h-screen flex w-full bg-background">
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          {/* Conditionally render sidebar only for coach/admin routes */}
          {shouldShowSidebar && <AppSidebar />}
          
          <div className={`flex-1 flex flex-col ${shouldShowSidebar ? '' : 'w-full'}`}>
            {/* Header - show for all routes except client (client has its own navigation) */}
            {!isClientRoute && (
              <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shadow-soft">
                <div className="flex items-center">
                  <div className="ml-4">
                    <h1 className="text-xl font-semibold text-foreground">common:platform.name</h1>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <NotificationSystem userRole="coach" />
                  <ThemeToggle />
                  <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-12 w-12 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all duration-200 p-0"
              >
                <Avatar className="h-12 w-12 rounded-lg border-2 border-gray-200">
                  <div className="justify-center items-center h-full w-full text-3xl text-gray-700 font-bold">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                  </div>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              className="w-72 bg-white border border-gray-200 shadow-lg rounded-lg p-2" 
              align="end"
            >
              {/* Simple welcome header */}
              <DropdownMenuLabel className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-200 rounded-lg">
                    <BookMarked className="h-4 w-4 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Welcome back!</p>
                    <p className="text-xs text-gray-600">Signed in as {user?.role || "User"}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator className="my-2" />
              
              {/* User info */}
              <DropdownMenuItem className="px-4 py-3 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer">
                <div className="flex flex-col space-y-1 w-full">
                  <p className="text-sm font-medium text-gray-800 leading-none">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs leading-none text-gray-600">
                    {user?.email || "No email"}
                  </p>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="my-2" />
              
              {/* Logout option */}
              <DropdownMenuItem
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-all duration-200 cursor-pointer"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <div className="p-2 bg-red-100 rounded-lg">
                  <LogOut className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium text-red-700">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

                </div>
              </header>
            )}
            
            {/* Main Content */}
            <main className={`flex-1 ${isClientRoute ? 'p-0' : 'p-6'} bg-background`}>
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    )
}

export default Layout;