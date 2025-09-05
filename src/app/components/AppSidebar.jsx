"use client"

import { useState, useRef, useEffect } from "react";
import { 
  Home, 
  User, 
  Users, 
  Library, 
  ClipboardList, 
  Calendar,
  Settings,
  HelpCircle,
  MessageSquare,
  Shield,
  BookOpen,
  Search,
  Target,
  ArrowRight,
  X,
  BarChart3,
  FileText,
  Database
} from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/app/components/ui/sidebar";


export function AppSidebar() {
  const { open } = useSidebar();
  const router = useRouter();
  const currentPath = usePathname();

  const searchRef = useRef(null);

  // Determine if we're in admin or coach section
  const isAdmin = currentPath.startsWith('/admin');
  const isCoach = currentPath.startsWith('/coach');

  const isActive = (path) => {
    // Exact match for root paths
    if (path === '/coach' || path === '/admin') {
      return currentPath === path;
    }
    // For other paths, check if current path starts with the nav item path
    return currentPath.startsWith(path);
  };
  
  const getNavCls = ({ isActive }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium" 
      : "text-sidebar-foreground hover:bg-muted/50 hover:text-foreground";

  // Handle search result click
  const handleResultClick = (url) => {
    router.push(url);
    clearSearch();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      clearSearch();
    }
  };

  // Navigation items based on role
  const getMainNavItems = () => {
    if (isAdmin) {
      return [
        { title: "Dashboard", url: "/admin/dashboard", icon: Home },
        { title: "Coaches", url: "/admin/coaches", icon: User },
        { title: "Clients", url: "/admin/clients", icon: Users },
        { title: "Chat", url: "/admin/chat", icon: MessageSquare },
      ];
    } else if (isCoach) {
      return [
        { title: "Dashboard", url: "/coach/dashboard", icon: Home },
        { title: "Clients", url: "/coach/clients", icon: User },
        { title: "Groups", url: "/coach/groups", icon: Users },
        { title: "Library", url: "/coach/library", icon: Library },
        { title: "Programs", url: "/coach/programs", icon: Target },
        { title: "Tasks", url: "/coach/tasks", icon: ClipboardList },
        { title: "Sessions", url: "/coach/sessions", icon: Calendar },
      ];
    }
    return [];
  };

  const getBottomNavItems = () => {
    if (isAdmin) {
      return [
        { title: "Settings", url: "/admin/settings", icon: Settings },
        { title: "Help", url: "/admin/help", icon: HelpCircle },
      ];
    } else if (isCoach) {
      return [
        { title: "Settings", url: "/coach/settings", icon: Settings },
        { title: "Help", url: "/coach/help", icon: HelpCircle },
      ];
    }
    return [];
  };

  const main = getMainNavItems();
  const bottom = getBottomNavItems();

  return (
    <Sidebar
      side="left"
      className={`${!open ? "w-16" : "w-64"} transition-all duration-300 bg-sidebar border-r border-sidebar-border shadow-medium`}
      collapsible="icon"
    >
      <SidebarContent className="py-6">
        {/* Logo Section */}
        <div className="px-6 mb-4 flex justify-center">
          <img 
            src="/assets/logo.png" 
            alt="Suplient logo" 
            className="object-contain" 
            style={{ width: '150px', height: '150px' }}
          />
        </div>

        {/* Global Search */}
        {open && (
          <div className="px-6 mb-2" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/60" />
              <Input
                placeholder="Search"
                value={""}
                onChange={(e) => {}}
                onKeyDown={handleKeyDown}
                className="pl-10 bg-sidebar-accent/30 border-sidebar-border/50 text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:bg-sidebar-accent/50 focus:border-sidebar-primary/50 focus:ring-1 focus:ring-sidebar-primary/30 transition-all"
              />
              {"" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {}}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-sidebar-accent"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {"" && (
              <Card className="absolute left-6 right-6 top-full mt-2 z-50 max-h-96 overflow-hidden shadow-lg border-sidebar-border bg-sidebar">
                <CardContent className="p-0">
                  {totalResults > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-sidebar-border">
                        <div className="text-sm font-medium text-sidebar-foreground">
                          {""} {"" === 1 ? 'result' : 'results'} found
                        </div>
                      </div>
                      {categoriesWithResults.map(([category, results]) => (
                        <div key={category} className="border-b border-sidebar-border/50 last:border-b-0">
                          <div className="px-3 py-2 bg-sidebar-accent/20">
                            <div className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wide">
                              {""} ({results.length})
                            </div>
                          </div>
                          <div className="max-h-32 overflow-y-auto">
                            {results.slice(0, 3).map((result) => (
                              <button
                                key={result.id}
                                onClick={() => handleResultClick(result.url)}
                                className="w-full px-3 py-2 text-left hover:bg-sidebar-accent/30 transition-colors group"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-sidebar-foreground truncate">
                                      {result.title}
                                    </div>
                                    <div className="text-xs text-sidebar-foreground/60 truncate">
                                      {result.description}
                                    </div>
                                  </div>
                                  <ArrowRight className="h-3 w-3 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70 ml-2 flex-shrink-0" />
                                </div>
                              </button>
                            ))}
                            {results.length > 3 && (
                              <button
                                onClick={() => handleResultClick(results[0].url.split('/').slice(0, -1).join('/'))}
                                className="w-full px-3 py-1 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/20 transition-colors"
                              >
                                View all {results.length} {category} results
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <Search className="h-8 w-8 text-sidebar-foreground/40 mx-auto mb-2" />
                      <div className="text-sm text-sidebar-foreground/60">
                        No results found for ""
                      </div>
                      <div className="text-xs text-sidebar-foreground/40 mt-1">
                        Try searching for clients, groups, tasks, or library content
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider px-6 mb-4">
            {isAdmin ? 'Admin' : 'Coach'} Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => (
                <SidebarMenuItem key={item.title} className="list-none">
                  <Link 
                    href={item.url} 
                    className={`flex items-center px-6 py-3 transition-colors rounded-none ${getNavCls({ isActive: isActive(item.url) })}`}
                  >
                    <item.icon className="h-5 w-5" />
                    {open && <span className="ml-3">{item.title}</span>}
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Navigation */}
        <div className="mt-auto">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {bottom.map((item) => (
                  <SidebarMenuItem key={item.title} className="list-none">
                    <Link 
                      href={item.url} 
                      className={`flex items-center px-6 py-3 transition-colors rounded-none ${getNavCls({ isActive: isActive(item.url) })}`}
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span className="ml-3">{item.title}</span>}
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>

      {/* Toggle Button */}
      <SidebarTrigger className="absolute -right-4 top-6 bg-sidebar-primary text-sidebar-primary-foreground rounded-full p-2 shadow-medium hover:bg-sidebar-accent transition-colors" />
    </Sidebar>
  );
}