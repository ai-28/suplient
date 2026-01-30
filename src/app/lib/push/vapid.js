/**
 * VAPID keys configuration for Web Push API
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
 * Uses dynamic import to ensure web-push is only loaded server-side
 */
export async function configureWebPush() {
    // Dynamic import to prevent client-side bundling
    const webpush = (await import('web-push')).default;
    const { privateKey, subject } = getVapidKeys();
    webpush.setVapidDetails(subject, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, privateKey);
    return webpush;
}
