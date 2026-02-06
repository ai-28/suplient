# Native Push Notifications - Next Steps

## ✅ What's Already Done

- ✅ Hook implementation fixed (`useNativePushNotifications.js`)
- ✅ Capacitor config updated with PushNotifications plugin
- ✅ Android build.gradle updated with Firebase dependencies
- ✅ AndroidManifest.xml updated with permissions and FCM config
- ✅ Hook is already being used in `NotificationBell.jsx`

## 📋 Action Plan

### Step 1: Sync Capacitor (Required)

```bash
npx cap sync
```

This will apply the configuration changes to your native projects.

---

### Step 2: Android Setup (FCM - Firebase Cloud Messaging)

#### 2.1 Create/Configure Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Add Android app:
   - Package name: `com.suplient.app`
   - App nickname: Suplient (optional)
   - Download `google-services.json`

#### 2.2 Add google-services.json

Place the downloaded `google-services.json` file in:
```
android/app/google-services.json
```

#### 2.3 Get Firebase Admin Credentials

1. In Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract these values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)

#### 2.4 Add to `.env` file

```env
# Firebase (FCM) for Android Push Notifications
FIREBASE_PROJECT_ID=your-project-id-here
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Important:** Keep the quotes and `\n` characters in `FIREBASE_PRIVATE_KEY`

---

### Step 3: iOS Setup (APNs - Apple Push Notification Service)

#### 3.1 Enable Push Notifications in Xcode

1. Open Xcode:
   ```bash
   npx cap open ios
   ```

2. Select your app target (App)
3. Go to **Signing & Capabilities** tab
4. Click **+ Capability**
5. Add **Push Notifications**
6. Add **Background Modes** and enable:
   - ✅ Remote notifications

#### 3.2 Generate APNs Key

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles** → **Keys**
3. Click **+** to create new key
4. Name it (e.g., "APNs Key for Suplient")
5. Enable **Apple Push Notifications service (APNs)**
6. Click **Continue** → **Register**
7. Download the `.p8` key file (you can only download once!)
8. Note the **Key ID** and **Team ID**

#### 3.3 Add to `.env` file

```env
# APNs for iOS Push Notifications
APNS_KEY_ID=your-key-id-here
APNS_TEAM_ID=your-team-id-here
APNS_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
APNS_BUNDLE_ID=com.suplient.app
```

**Option 1:** Use inline key (recommended for deployment):
- Copy the entire key content from the `.p8` file
- Replace newlines with `\n`
- Keep the quotes

**Option 2:** Use file path (for local development):
```env
APNS_KEY_PATH=/path/to/AuthKey_XXXXX.p8
```

---

### Step 4: Build and Test

#### Android Testing

1. **Build the app:**
   ```bash
   npm run build
   npx cap sync
   cd android
   ./gradlew assembleDebug
   ```

2. **Install on real device** (not emulator):
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Check logs:**
   ```bash
   adb logcat | grep -i "push\|fcm\|capacitor"
   ```

4. **Verify token registration:**
   - Open app and log in
   - Check browser console or device logs for: `[Native Push] Registration token received`
   - Check your database `NativePushToken` table for the token

#### iOS Testing

1. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```

2. **Build and run on real device** (not simulator):
   - Select your device in Xcode
   - Click Run (⌘R)
   - Ensure device is connected and trusted

3. **Check logs:**
   - Open Xcode Console
   - Look for: `[Native Push] Registration token received`

4. **Verify token registration:**
   - Check your database `NativePushToken` table for the token

---

### Step 5: Test Push Notifications

#### Test from Server

You can test by creating a notification through your app (e.g., sending a message, completing a task). The `NotificationService` will automatically:
- Detect if user is on native platform
- Send via FCM (Android) or APNs (iOS)
- Display notification on device

#### Manual Test Endpoint

If you have a test endpoint, you can trigger a notification:
```bash
# Example: POST to your notification creation endpoint
curl -X POST https://app.suplient.com/api/notifications/test \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"
```

---

## 🔍 Troubleshooting

### Android Issues

**Token not received:**
- ✅ Ensure `google-services.json` is in `android/app/`
- ✅ Check Firebase project is configured correctly
- ✅ Verify app is running on **real device** (not emulator)
- ✅ Check device logs: `adb logcat | grep -i fcm`

**Notifications not showing:**
- ✅ Check notification permissions are granted
- ✅ Verify token is saved in database
- ✅ Check Firebase Console → Cloud Messaging for delivery status
- ✅ Ensure app has internet connection

### iOS Issues

**Token not received:**
- ✅ Ensure Push Notifications capability is enabled in Xcode
- ✅ Verify Background Modes → Remote notifications is enabled
- ✅ Check APNs credentials in `.env` are correct
- ✅ Verify app is running on **real device** (not simulator)

**Notifications not showing:**
- ✅ Check notification permissions are granted
- ✅ Verify token is saved in database
- ✅ Check APNs key is valid and not expired
- ✅ Ensure app is built with correct provisioning profile

### Common Issues

**"Permission denied":**
- User needs to grant notification permissions
- On Android 13+, app will prompt automatically
- On iOS, check Settings → Notifications → Suplient

**"Registration error":**
- Check Firebase/APNs credentials are correct
- Verify network connection
- Check device logs for specific error messages

**Token not saved to database:**
- Check `/api/push/register-native` endpoint is working
- Verify user is logged in (session required)
- Check server logs for errors

---

## 📝 Checklist

Before testing, ensure:

- [ ] `npx cap sync` has been run
- [ ] `google-services.json` is in `android/app/` (Android)
- [ ] Firebase credentials added to `.env` (Android)
- [ ] Push Notifications capability enabled in Xcode (iOS)
- [ ] Background Modes → Remote notifications enabled (iOS)
- [ ] APNs credentials added to `.env` (iOS)
- [ ] App built and installed on **real device**
- [ ] User is logged in
- [ ] Notification permissions granted

---

## 🎯 Expected Behavior

1. **App opens** → Hook detects native platform
2. **User logs in** → Hook requests notification permission
3. **Permission granted** → Capacitor registers with FCM/APNs
4. **Token received** → Token sent to `/api/push/register-native`
5. **Token saved** → Stored in `NativePushToken` table
6. **Notification created** → Server sends via FCM/APNs
7. **Notification displayed** → OS shows notification on device

---

## 📚 Additional Resources

- [Capacitor Push Notifications Docs](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notification Service Docs](https://developer.apple.com/documentation/usernotifications)

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Device logs show: `[Native Push] Registration token received`
2. ✅ Database has entry in `NativePushToken` table
3. ✅ Notifications appear on device when triggered
4. ✅ Notifications work when app is in background
5. ✅ Tapping notification opens the app

Good luck! 🚀
