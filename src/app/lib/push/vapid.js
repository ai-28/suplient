import webpush from 'web-push';

/**
 * Get VAPID keys from environment variables
 * Generate keys using: npx web-push generate-vapid-keys
 */
export function getVapidKeys() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@suplient.com';

    if (!publicKey || !privateKey) {
        throw new Error('VAPID keys are not configured. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT in your .env file');
    }

    return { publicKey, privateKey, subject };
}

/**
 * Configure web-push with VAPID details
 */
export function configureWebPush() {
    const { privateKey, subject } = getVapidKeys();
    webpush.setVapidDetails(subject, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, privateKey);
    return webpush;
}
