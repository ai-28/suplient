# iOS Push Notifications Setup Guide

This guide will walk you through setting up Apple Push Notification Service (APNs) for your Capacitor iOS app.

## Prerequisites

- ✅ Apple Developer Account (paid membership required)
- ✅ Xcode installed on macOS
- ✅ iOS device for testing (push notifications don't work on iOS Simulator)
- ✅ Your app's Bundle ID: `com.suplient.app`

## Step 1: Create APNs Authentication Key

1. **Go to Apple Developer Portal:**
   - Visit: https://developer.apple.com/account/resources/authkeys/list
   - Sign in with your Apple Developer account

2. **Create a new Key:**
   - Click the **"+"** button
   - Enter a **Key Name** (e.g., "Suplient APNs Key")
   - Check **"Apple Push Notifications service (APNs)"**
   - Click **"Continue"** then **"Register"**

3. **Download the Key:**
   - ⚠️ **IMPORTANT:** Download the `.p8` file immediately - you can only download it once!
   - Save it securely (e.g., `AuthKey_XXXXXXXXXX.p8`)
   - Note the **Key ID** shown on the page (10-character string)

4. **Get your Team ID:**
   - In Apple Developer Portal, go to **Membership** section
   - Your **Team ID** is displayed there (10-character string)

## Step 2: Configure Xcode Project

1. **Open your iOS project:**
   ```bash
   cd ios
   open App/App.xcworkspace
   ```

2. **Enable Push Notifications Capability:**
   - Select your **App** target in Xcode
   - Go to **"Signing & Capabilities"** tab
   - Click **"+ Capability"**
   - Add **"Push Notifications"**
   - Add **"Background Modes"** and check **"Remote notifications"**

3. **Verify Bundle Identifier:**
   - In **"Signing & Capabilities"**, ensure Bundle Identifier is: `com.suplient.app`
   - This must match your `capacitor.config.json` appId

4. **Configure Signing:**
   - Select your **Development Team**
   - Ensure **Automatically manage signing** is enabled (or configure manually)

## Step 3: Create Entitlements File (if needed)

The entitlements file should be created automatically when you add Push Notifications capability. Verify it exists:

1. In Xcode, check if `App.entitlements` exists in your project
2. If not, create it:
   - Right-click on **App** folder → **New File**
   - Choose **Property List**
   - Name it `App.entitlements`
   - Add these keys:
     ```xml
     <key>aps-environment</key>
     <string>development</string>
     ```
   - For production builds, change to `<string>production</string>`

3. **Link entitlements in Build Settings:**
   - Select your App target
   - Go to **Build Settings**
   - Search for "Code Signing Entitlements"
   - Set it to: `App/App.entitlements`

## Step 4: Set Up Environment Variables

Add these environment variables to your `.env` file (or your deployment environment):

```env
# APNs Configuration
APNS_KEY_ID=YOUR_KEY_ID_HERE          # 10-character Key ID from Step 1
APNS_TEAM_ID=YOUR_TEAM_ID_HERE        # 10-character Team ID from Step 1
APNS_BUNDLE_ID=com.suplient.app       # Your app's bundle ID
APNS_KEY_PATH=./path/to/AuthKey_XXXXXXXXXX.p8  # Path to .p8 file (optional)
# OR use APNS_KEY with the key content directly (see below)
```

### Option A: Using Key File Path (Recommended for local development)

```env
APNS_KEY_PATH=./keys/AuthKey_XXXXXXXXXX.p8
APNS_KEY_ID=XXXXXXXXXX
APNS_TEAM_ID=YYYYYYYYYY
APNS_BUNDLE_ID=com.suplient.app
```

### Option B: Using Key Content (Recommended for production)

If you prefer to store the key content directly (useful for cloud deployments):

1. Read the `.p8` file content:
   ```bash
   cat AuthKey_XXXXXXXXXX.p8
   ```

2. Copy the entire content (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)

3. Add to `.env`:
   ```env
   APNS_KEY="-----BEGIN PRIVATE KEY-----
   MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
   ... (full key content) ...
   -----END PRIVATE KEY-----"
   APNS_KEY_ID=XXXXXXXXXX
   APNS_TEAM_ID=YYYYYYYYYY
   APNS_BUNDLE_ID=com.suplient.app
   ```

   ⚠️ **Security Note:** Never commit `.env` files with keys to version control!

## Step 5: Sync Capacitor and Build

1. **Sync Capacitor:**
   ```bash
   npx cap sync ios
   ```

2. **Build and Run on Device:**
   - Connect your iOS device via USB
   - In Xcode, select your device
   - Click **Run** (⌘R)
   - ⚠️ **Push notifications only work on real devices, not simulators!**

## Step 6: Test Push Notifications

1. **Run the app on a real iOS device**

2. **Log in to your app**

3. **Grant notification permission** when prompted

4. **Check the database:**
   - Verify a token was saved in `NativePushToken` table
   - Platform should be `ios`
   - Token should start with a long alphanumeric string

5. **Test sending a notification:**
   - Have a coach send a message to the client
   - The client should receive a push notification
   - Test with app in foreground, background, and closed

## Troubleshooting

### Issue: "APNs credentials not configured"
- **Solution:** Check that all environment variables are set:
  - `APNS_KEY_ID`
  - `APNS_TEAM_ID`
  - Either `APNS_KEY_PATH` or `APNS_KEY`

### Issue: "Invalid token" errors
- **Solution:** 
  - Verify Bundle ID matches in Xcode and `capacitor.config.json`
  - Ensure Push Notifications capability is enabled
  - Check that the app is signed with the correct provisioning profile

### Issue: Notifications not appearing
- **Solution:**
  - Ensure you're testing on a **real device** (not simulator)
  - Check that notification permission was granted
  - Verify the token is saved in the database
  - Check server logs for APNs errors
  - Ensure `aps-environment` is set correctly in entitlements

### Issue: "Topic mismatch" error
- **Solution:** 
  - Verify `APNS_BUNDLE_ID` matches your app's Bundle ID exactly
  - Check that the Bundle ID in Xcode matches `com.suplient.app`

### Issue: Development vs Production
- **Development:** Use `aps-environment: development` in entitlements
- **Production:** Use `aps-environment: production` in entitlements
- The code automatically uses the correct environment based on `NODE_ENV`

## Production Deployment

Before deploying to App Store:

1. **Update entitlements for production:**
   - Change `aps-environment` to `production` in `App.entitlements`

2. **Create Production Provisioning Profile:**
   - In Apple Developer Portal, create a new App ID with Push Notifications enabled
   - Create a Distribution provisioning profile
   - Download and install in Xcode

3. **Archive and Upload:**
   - In Xcode: **Product** → **Archive**
   - Upload to App Store Connect

4. **Verify environment variables:**
   - Ensure production server has correct APNs credentials
   - Set `NODE_ENV=production` in production environment

## Code Already Configured ✅

The following is already set up in your codebase:
- ✅ `useNativePushNotifications` hook supports iOS
- ✅ `nativePushService.js` has APNs sending logic
- ✅ `NotificationService.js` routes to iOS platform
- ✅ `register-native` API route handles iOS tokens
- ✅ Capacitor config has PushNotifications plugin configured

You just need to:
1. Set up APNs key in Apple Developer
2. Configure Xcode capabilities
3. Add environment variables
4. Test on a real device

## Next Steps

1. Complete Steps 1-4 above
2. Test on a real iOS device
3. Verify notifications work in all app states (foreground, background, closed)
4. Deploy to TestFlight for beta testing
5. Submit to App Store when ready
