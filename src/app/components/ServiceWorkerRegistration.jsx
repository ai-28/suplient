"use client";

import { useServiceWorker } from "@/app/hooks/useServiceWorker";

/**
 * Service Worker Registration Component
 * Registers the service worker on all pages for PWA functionality
 * This component doesn't render anything - it just registers the SW
 */
export default function ServiceWorkerRegistration() {
  useServiceWorker();
  return null; // This component doesn't render anything
}
