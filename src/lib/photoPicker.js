import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { isNative, isWeb } from './capacitor';

/**
 * Pick an image for avatar upload
 * Works on Web (file input), iOS (native camera), and Android (native camera)
 * 
 * @param {Object} options
 * @param {boolean} options.allowEditing - Allow image editing (crop/resize)
 * @param {number} options.quality - Image quality (0-100)
 * @returns {Promise<File|null>} File object or null if cancelled
 */
export async function pickAvatarImage(options = {}) {
    const {
        allowEditing = false,
        quality = 90
    } = options;

    // Native platforms (iOS/Android) - Use Capacitor Camera
    if (isNative()) {
        try {
            const image = await Camera.getPhoto({
                quality,
                allowEditing,
                resultType: CameraResultType.DataUrl, // Get base64 data
                source: CameraSource.Prompt, // Show action sheet: Camera or Photo Library
                correctOrientation: true,
            });

            if (!image || !image.dataUrl) {
                return null; // User cancelled
            }

            // Convert base64 to File object
            const response = await fetch(image.dataUrl);
            const blob = await response.blob();

            // Generate filename
            const timestamp = Date.now();
            const extension = image.format === 'png' ? 'png' : 'jpg';
            const fileName = `avatar-${timestamp}.${extension}`;

            // Create File object
            const file = new File([blob], fileName, {
                type: blob.type || `image/${extension}`,
                lastModified: Date.now()
            });

            return file;
        } catch (error) {
            console.error('Error picking image from camera:', error);
            // If user cancels, Camera plugin throws an error
            if (error.message?.includes('User cancelled') ||
                error.message?.includes('cancel') ||
                error.message?.includes('User did not grant permission')) {
                return null;
            }
            throw error;
        }
    }

    // Web platform - Use file input
    if (isWeb()) {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,.heic,.heif';
            input.style.display = 'none';

            input.onchange = async (event) => {
                const file = event.target.files?.[0];
                document.body.removeChild(input);

                if (!file) {
                    resolve(null);
                    return;
                }

                resolve(file);
            };

            input.oncancel = () => {
                document.body.removeChild(input);
                resolve(null);
            };

            document.body.appendChild(input);
            input.click();
        });
    }

    // Fallback
    return null;
}

/**
 * Convert HEIC/HEIF image to JPEG
 * @param {File} file - HEIC/HEIF file
 * @returns {Promise<File>} Converted JPEG file
 */
export async function convertHeicToJpeg(file) {
    try {
        if (typeof window === 'undefined') {
            throw new Error('HEIC conversion is not available on server side');
        }

        const heic2any = (await import('heic2any')).default;
        const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9
        });

        const convertedFile = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

        return new File([convertedFile], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now()
        });
    } catch (error) {
        console.error('Error converting HEIC:', error);
        throw error;
    }
}

/**
 * Validate image file
 * @param {File} file - Image file
 * @param {number} maxSizeMB - Maximum file size in MB
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateImageFile(file, maxSizeMB = 10) {
    // Check file type
    if (!file.type.startsWith('image/')) {
        return {
            valid: false,
            error: `Invalid file type (${file.type || 'unknown'}). Please select a JPG, PNG, WebP, GIF, or HEIC image.`
        };
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
        return {
            valid: false,
            error: `Image too large (${fileSizeMB.toFixed(2)}MB). Maximum size is ${maxSizeMB}MB.`
        };
    }

    return { valid: true };
}
