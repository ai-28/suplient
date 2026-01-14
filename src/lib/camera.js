import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNative } from './capacitor';

/**
 * Take a photo using Capacitor Camera (native) or file input (web)
 * @param {Object} options - Camera options
 * @param {string} options.source - 'camera' or 'gallery' (default: 'gallery')
 * @returns {Promise<File|null>} - Returns a File object or null if cancelled
 */
export async function takePhoto(options = {}) {
    const { source = 'gallery' } = options;

    // Use Capacitor Camera on native platforms
    if (isNative()) {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.DataUrl,
                source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
            });

            if (!image || !image.dataUrl) {
                return null;
            }

            // Convert dataUrl to File object
            const response = await fetch(image.dataUrl);
            const blob = await response.blob();

            // Generate filename with timestamp
            const timestamp = Date.now();
            const extension = image.format === 'jpeg' ? 'jpg' : image.format || 'jpg';
            const filename = `photo_${timestamp}.${extension}`;

            const file = new File([blob], filename, {
                type: blob.type || 'image/jpeg',
                lastModified: timestamp,
            });

            return file;
        } catch (error) {
            console.error('Error taking photo with Capacitor Camera:', error);
            // If user cancelled, return null instead of throwing
            if (error.message?.includes('cancel') || error.message?.includes('User cancelled')) {
                return null;
            }
            throw error;
        }
    }

    // Fallback to file input on web
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.heic,.heif';
        input.capture = source === 'camera' ? 'environment' : undefined;

        input.onchange = (e) => {
            const file = e.target.files?.[0] || null;
            resolve(file);
        };

        input.oncancel = () => {
            resolve(null);
        };

        input.click();
    });
}

// Re-export Camera for convenience
export { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
