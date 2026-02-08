import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        // Note: Capacitor PushNotifications plugin will handle UNUserNotificationCenter delegate
        
        // Diagnostic: Check if ApplicationDelegateProxy is set up
        print("🔍 [AppDelegate] ApplicationDelegateProxy available: \(ApplicationDelegateProxy.shared != nil)")
        
        // Diagnostic: Listen for when Capacitor's plugin receives the token (if it does)
        NotificationCenter.default.addObserver(
            forName: Notification.Name("CAPDidRegisterForRemoteNotificationsWithDeviceToken"),
            object: nil,
            queue: .main
        ) { notification in
            print("✅ [AppDelegate] DIAGNOSTIC: NotificationCenter observer received token notification!")
            if let deviceToken = notification.object as? Data {
                let tokenParts = deviceToken.map { data in String(format: "%02.2hhx", data) }
                let token = tokenParts.joined()
                print("✅ [AppDelegate] DIAGNOSTIC: Token in notification: \(token.prefix(20))...")
            }
        }
        print("🔍 [AppDelegate] Added diagnostic observer for CAPDidRegisterForRemoteNotificationsWithDeviceToken")
        
        return true
    }
    
    // Handle successful registration for remote notifications
    // This is called by iOS when device token is received
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // Convert device token to string
        let tokenParts = deviceToken.map { data in String(format: "%02.2hhx", data) }
        let token = tokenParts.joined()
        print("📱 [AppDelegate] Device token received: \(token)")
        
        // Diagnostic: Check if ApplicationDelegateProxy can forward this
        // In Capacitor 8, the plugin might receive it automatically through ApplicationDelegateProxy
        // But since we're overriding, we need to manually forward
        print("🔍 [AppDelegate] DIAGNOSTIC: Checking ApplicationDelegateProxy...")
        print("🔍 [AppDelegate] DIAGNOSTIC: ApplicationDelegateProxy.shared exists: \(ApplicationDelegateProxy.shared != nil)")
        
        // Approach 1: Forward to Capacitor's PushNotifications plugin via NotificationCenter
        // (Best practice - let the plugin handle it)
        print("🔍 [AppDelegate] DIAGNOSTIC: Posting to NotificationCenter...")
        NotificationCenter.default.post(
            name: Notification.Name("CAPDidRegisterForRemoteNotificationsWithDeviceToken"),
            object: deviceToken,
            userInfo: nil
        )
        print("📤 [AppDelegate] Posted token via NotificationCenter (CAPDidRegisterForRemoteNotificationsWithDeviceToken)")
        
        // Small delay to see if plugin receives it
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            print("🔍 [AppDelegate] DIAGNOSTIC: 0.5s after posting - checking if plugin received it")
        }
        
        // Approach 2: Also try alternative notification name
        NotificationCenter.default.post(
            name: Notification.Name("capacitorDidRegisterForRemoteNotifications"),
            object: deviceToken,
            userInfo: nil
        )
        print("📤 [AppDelegate] Also posted via NotificationCenter (capacitorDidRegisterForRemoteNotifications)")
        
        // Approach 3: Direct JavaScript call via Capacitor bridge (fallback if plugin doesn't work)
        // This directly triggers the registration event in JavaScript
        // Add a delay to ensure Capacitor bridge is ready
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            if let bridge = self.window?.rootViewController as? CAPBridgeViewController,
               let webView = bridge.webView {
                print("🔍 [AppDelegate] DIAGNOSTIC: Bridge and WebView are available")
                
                // Escape the token string for JavaScript
                let escapedToken = token.replacingOccurrences(of: "\\", with: "\\\\")
                    .replacingOccurrences(of: "'", with: "\\'")
                    .replacingOccurrences(of: "\n", with: "\\n")
                
                // Diagnostic: Check if Capacitor plugin is available in JavaScript
                let diagnosticCode = """
                    (function() {
                        console.log('[AppDelegate] DIAGNOSTIC: Checking Capacitor plugin availability...');
                        console.log('[AppDelegate] DIAGNOSTIC: window.Capacitor exists:', !!window.Capacitor);
                        console.log('[AppDelegate] DIAGNOSTIC: window.Capacitor.Plugins exists:', !!(window.Capacitor && window.Capacitor.Plugins));
                        console.log('[AppDelegate] DIAGNOSTIC: PushNotifications plugin exists:', !!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications));
                        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications) {
                            console.log('[AppDelegate] DIAGNOSTIC: Plugin methods:', Object.keys(window.Capacitor.Plugins.PushNotifications));
                        }
                        return {
                            hasCapacitor: !!window.Capacitor,
                            hasPlugins: !!(window.Capacitor && window.Capacitor.Plugins),
                            hasPushPlugin: !!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications)
                        };
                    })();
                """
                
                webView.evaluateJavaScript(diagnosticCode) { result, error in
                    if let error = error {
                        print("❌ [AppDelegate] DIAGNOSTIC: Error checking plugin: \(error.localizedDescription)")
                    } else {
                        print("🔍 [AppDelegate] DIAGNOSTIC: Plugin availability check result: \(result ?? "nil")")
                    }
                }
                
                // Call JavaScript to trigger the registration event
                let jsCode = """
                    (function() {
                        try {
                            console.log('[AppDelegate] Attempting to send token directly to JavaScript...');
                            // Try to trigger Capacitor's plugin event
                            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications) {
                                console.log('[AppDelegate] Plugin found, calling notifyListeners...');
                                window.Capacitor.Plugins.PushNotifications.notifyListeners('registration', { value: '\(escapedToken)' });
                                console.log('[AppDelegate] notifyListeners called');
                            } else {
                                console.warn('[AppDelegate] Plugin not found, using custom event fallback');
                            }
                            // Also dispatch a custom event as fallback
                            window.dispatchEvent(new CustomEvent('pushNotificationRegistration', {
                                detail: { value: '\(escapedToken)' }
                            }));
                            console.log('[AppDelegate] Token sent directly to JavaScript');
                        } catch(e) {
                            console.error('[AppDelegate] Error in JavaScript:', e);
                        }
                    })();
                """
                
                webView.evaluateJavaScript(jsCode) { result, error in
                    if let error = error {
                        print("❌ [AppDelegate] Error calling JavaScript: \(error.localizedDescription)")
                    } else {
                        print("✅ [AppDelegate] Token sent directly to JavaScript via bridge")
                    }
                }
            } else {
                print("❌ [AppDelegate] DIAGNOSTIC: Bridge or WebView not available yet")
            }
        }
    }
    
    // Handle failure to register for remote notifications
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("❌ [AppDelegate] Failed to register for remote notifications: \(error.localizedDescription)")
        
        // Forward error to Capacitor's PushNotifications plugin
        NotificationCenter.default.post(
            name: NSNotification.Name("CAPDidFailToRegisterForRemoteNotificationsWithError"),
            object: error
        )
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        // Configure navigation handling to keep URLs within the app
        setupNavigationHandling()
    }
    
    private func setupNavigationHandling() {
        // Wait for the view controller to be ready
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            guard let window = self?.window,
                  let rootViewController = window.rootViewController as? CAPBridgeViewController else {
                return
            }
            
            // Find WKWebView in the view hierarchy
            func findWebView(in view: UIView) -> WKWebView? {
                if let webView = view as? WKWebView {
                    return webView
                }
                for subview in view.subviews {
                    if let webView = findWebView(in: subview) {
                        return webView
                    }
                }
                return nil
            }
            
            if let webView = findWebView(in: rootViewController.view) {
                webView.navigationDelegate = self
            }
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }


    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

// MARK: - WKNavigationDelegate
extension AppDelegate: WKNavigationDelegate {
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }
        
        let urlString = url.absoluteString
        
        // Check if the URL is within suplient.com domain (including subdomains) or localhost
        if urlString.contains("suplient.com") || urlString.contains("localhost") || urlString.contains("127.0.0.1") {
            // Load within the app WebView instead of opening external browser
            decisionHandler(.allow)
        } else if navigationAction.navigationType == .linkActivated {
            // For external links, allow them to open (or change to .cancel to block)
            decisionHandler(.allow)
        } else {
            // For other navigation types, allow default behavior
            decisionHandler(.allow)
        }
    }
}
