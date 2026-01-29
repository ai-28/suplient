# Web Push Notifications Setup Guide

## Overview
This implementation adds web push notifications for all notification items in the bell icon. The system uses the Web Push API with VAPID keys for secure push notifications.

## What Was Implemented

### 1. Database
- ✅ Created `PushSubscription` table with proper indexes
- ✅ Table stores subscription endpoints and encryption keys per user/device

### 2. Backend
- ✅ VAPID configuration (`src/app/lib/push/vapid.js`)
- ✅ Push service (`src/app/lib/push/pushService.js`)
- ✅ API routes:
  - `GET /api/push/vapid-public-key` - Returns public key for client subscription
  - `POST /api/push/subscribe` - Subscribe user to push notifications
  - `POST /api/push/unsubscribe` - Unsubscribe user from push notifications
- ✅ Updated `NotificationService` to automatically send push notifications

### 3. Frontend
- ✅ `usePushNotifications` hook for managing subscriptions
- ✅ Push notification button in `NotificationBell` component
- ✅ Service worker push handler (`public/push-handler.js`)

## Setup Instructions

### Step 1: Generate VAPID Keys

Run this command to generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

This will output something like:
```
Public Key: BEl62iUYgUivxIkv69yViEuiBIa40HI...
Private Key: 8vKDdLUaP4VwWXj...
```

### Step 2: Add Environment Variables

Add these to your `.env.local` file:

```bash
# VAPID Keys for Web Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:admin@suplient.com
```

**Important:** 
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser
- `VAPID_SUBJECT` should be a mailto: URL or a URL to your website

### Step 3: Run Database Migration

The `PushSubscription` table will be created automatically when you run the seed:

```bash
# Visit or call your seed endpoint
GET /api/seed
```

Or manually run the migration by calling `createPushSubscriptionTable()`.

### Step 4: Service Worker Integration

Since you're using `next-pwa`, the service worker is auto-generated. To add push notification handling, you have two options:

#### Option A: Custom Service Worker (Recommended)
Create a custom service worker file and configure next-pwa to use it. See `public/push-handler.js` for the push event handlers.

#### Option B: Manual Integration
Add the push event handlers from `public/push-handler.js` to your service worker after it's generated.

### Step 5: Test Push Notifications

1. **Enable push notifications:**
   - Click the bell icon in the header
   - Click the push notification button (🔕/🔔)
   - Grant permission when prompted

2. **Test notification:**
   - Create a notification through your app (e.g., send a message, complete a task)
   - You should receive a push notification even when the browser tab is closed

## How It Works

1. **User subscribes:**
   - Frontend requests VAPID public key
   - Browser creates push subscription
   - Subscription is sent to server and stored in `PushSubscription` table

2. **Notification is created:**
   - `NotificationService.createAndEmitNotification()` is called
   - Notification is saved to database
   - Socket.IO emits real-time notification (if user is online)
   - Push notification is sent to all user's devices (if subscribed)

3. **User receives notification:**
   - Browser receives push event
   - Service worker displays notification
   - User clicks notification → navigates to relevant page

## Features

- ✅ Multiple device support (one user can have multiple subscriptions)
- ✅ Automatic cleanup of invalid subscriptions
- ✅ Works when browser is closed
- ✅ Respects user notification preferences
- ✅ Integrated with existing notification system
- ✅ All notification types supported

## Troubleshooting

### Push notifications not working?

1. **Check VAPID keys:**
   - Ensure keys are set in `.env.local`
   - Restart your dev server after adding keys

2. **Check browser support:**
   - Push notifications require HTTPS (except localhost)
   - Check browser console for errors

3. **Check service worker:**
   - Ensure service worker is registered
   - Check `Application > Service Workers` in Chrome DevTools

4. **Check permissions:**
   - User must grant notification permission
   - Check `Settings > Site Settings > Notifications` in Chrome

### Common Issues

**"VAPID keys not configured" error:**
- Add VAPID keys to `.env.local`
- Restart dev server

**"Push notifications are not supported" error:**
- Browser doesn't support Push API
- Not running on HTTPS (except localhost)

**Notifications not appearing:**
- Check service worker is active
- Check browser notification settings
- Check console for errors

## Production Considerations

1. **HTTPS Required:**
   - Push notifications only work on HTTPS (except localhost)
   - Ensure your production site uses HTTPS

2. **VAPID Keys:**
   - Keep private key secure (never commit to git)
   - Use environment variables in production

3. **Service Worker:**
   - Ensure service worker is properly cached
   - Test push notifications in production environment

4. **Monitoring:**
   - Monitor failed push notifications
   - Clean up invalid subscriptions regularly

## Next Steps

- [ ] Add notification preferences UI
- [ ] Add notification sound support
- [ ] Add notification grouping
- [ ] Add notification actions (reply, mark as read, etc.)
- [ ] Add analytics for push notification engagement
