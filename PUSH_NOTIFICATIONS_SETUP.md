# Push Notifications Setup Guide

This guide explains how to set up both **Web Push Notifications** (like Telegram) and **Native Push Notifications** for your Next.js + Capacitor app.

## Architecture Overview

- **Web Platform**: Uses Web Push API with service workers (works in browsers and PWA)
- **Native Apps (iOS/Android)**: Uses Capacitor Push Notifications plugin with FCM (Android) and APNs (iOS)

## Part 1: Web Push Notifications Setup

### 1. Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

This will output:
- Public Key: `BN...` (starts with BN)
- Private Key: `...` (long string)

### 2. Add to `.env` file

```env
# Web Push VAPID Keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:admin@suplient.com
```

### 3. Install Dependencies

Already added to `package.json`:
- `web-push`: ^3.6.7

## Part 2: Native Push Notifications Setup

### For Android (FCM - Firebase Cloud Messaging)

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing
   - Add Android app with package name: `com.suplient.app`

2. **Download `google-services.json`**
   - Download from Firebase Console
   - Place in `android/app/` directory

3. **Get Firebase Credentials**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Download JSON file

4. **Add to `.env` file**

```env
# Firebase (FCM) for Android
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

5. **Install Capacitor Push Notifications Plugin**

```bash
npm install @capacitor/push-notifications
npx cap sync
```

6. **Install Firebase Admin SDK**

```bash
npm install firebase-admin
```

### For iOS (APNs - Apple Push Notification Service)

1. **Apple Developer Account Required**
   - Enroll in Apple Developer Program ($99/year)
   - Create App ID with Push Notifications capability

2. **Generate APNs Key**
   - Go to Apple Developer → Certificates, Identifiers & Profiles
   - Keys → Create new key
   - Enable "Apple Push Notifications service (APNs)"
   - Download `.p8` key file
   - Note the Key ID and Team ID

3. **Add to `.env` file**

```env
# APNs for iOS
APNS_KEY_ID=your-key-id
APNS_TEAM_ID=your-team-id
APNS_KEY_PATH=/path/to/AuthKey_XXXXX.p8
# OR use inline key:
APNS_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
APNS_BUNDLE_ID=com.suplient.app
```

4. **Install APNs Library**

```bash
npm install apn
```

## Part 3: Database Setup

The database tables are automatically created when you run the seed script:

```bash
npm run seed
```

This creates:
- `PushSubscription` table (for web push)
- `NativePushToken` table (for native push)

## Part 4: How It Works

### Web Platform Flow

1. User visits web app
2. Service worker registers
3. User clicks "Enable Push Notifications" in NotificationBell
4. Browser requests permission
5. Subscription saved to `PushSubscription` table
6. When notification is created, `NotificationService` detects web platform
7. Sends push via Web Push API
8. Service worker receives push event and displays notification

### Native App Flow

1. User opens native app (iOS/Android)
2. Capacitor Push Notifications plugin auto-registers
3. Token received and saved to `NativePushToken` table
4. When notification is created, `NotificationService` detects native platform
5. Sends push via FCM (Android) or APNs (iOS)
6. OS displays notification

## Part 5: Testing

### Test Web Push

1. Run in production mode:
   ```bash
   npm run build
   npm start
   ```

2. Open browser (Chrome/Edge recommended)
3. Allow notifications when prompted
4. Send a test message/notification
5. Should see desktop notification even when browser is closed

### Test Native Push

1. Build native app:
   ```bash
   npx cap sync
   npx cap open android  # or ios
   ```

2. Install on device
3. App will auto-register for push
4. Send test notification from server
5. Should see native notification

## Part 6: Files Created/Modified

### New Files
- `src/app/lib/push/vapid.js` - VAPID key configuration
- `src/app/lib/push/webPushService.js` - Web push service
- `src/app/lib/push/nativePushService.js` - Native push service (FCM/APNs)
- `src/app/hooks/useWebPushNotifications.js` - Web push hook
- `src/app/hooks/useNativePushNotifications.js` - Native push hook
- `src/app/api/push/vapid-public-key/route.js` - VAPID public key endpoint
- `src/app/api/push/subscribe/route.js` - Web push subscription endpoint
- `src/app/api/push/unsubscribe/route.js` - Web push unsubscribe endpoint
- `src/app/api/push/register-native/route.js` - Native token registration
- `src/app/api/push/unregister-native/route.js` - Native token unregistration

### Modified Files
- `public/sw-custom.js` - Added push event handler
- `src/app/lib/services/NotificationService.js` - Platform detection and push routing
- `src/app/components/NotificationBell.jsx` - Added push notification controls
- `src/app/seed/route.js` - Added database table creation
- `package.json` - Added `web-push` dependency

## Part 7: Environment Variables Summary

Add all these to your `.env` file:

```env
# Web Push (Required for web platform)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:admin@suplient.com

# Firebase/FCM (Required for Android native push)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# APNs (Required for iOS native push)
APNS_KEY_ID=your-key-id
APNS_TEAM_ID=your-team-id
APNS_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
APNS_BUNDLE_ID=com.suplient.app
```

## Part 8: Troubleshooting

### Web Push Not Working
- Check service worker is registered (DevTools → Application → Service Workers)
- Verify VAPID keys are correct
- Check browser console for errors
- Ensure HTTPS (required for push notifications)

### Native Push Not Working
- Verify Firebase/APNs credentials in `.env`
- Check device logs for registration errors
- Ensure app has notification permissions
- Verify token is saved in database

## Part 9: Next Steps

1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Set up Firebase project for Android
3. Set up Apple Developer account for iOS
4. Add all environment variables
5. Run `npm install` to install new dependencies
6. Run `npm run seed` to create database tables
7. Test web push in production mode
8. Build and test native apps

## Notes

- Web push works in browsers and PWA (like Telegram)
- Native push only works in Capacitor apps (iOS/Android)
- Platform is automatically detected
- Users can enable/disable push in NotificationBell component
- Invalid tokens/subscriptions are automatically cleaned up
