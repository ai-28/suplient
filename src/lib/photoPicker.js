import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNative } from './capacitor';

/**
 * Helper function to convert image dataUrl to File object
 */
function dataUrlToFile(dataUrl, format = 'jpg') {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            const timestamp = Date.now();
            const extension = format === 'jpeg' ? 'jpg' : format || 'jpg';
            const filename = `photo_${timestamp}.${extension}`;

            const file = new File([blob], filename, {
                type: blob.type || 'image/jpeg',
                lastModified: timestamp,
            });

            resolve(file);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Select a photo from device library (Photo Library option)
 * @returns {Promise<File|null>} - Returns a File object or null if cancelled
 */
export async function selectPhotoFromLibrary() {
    if (isNative()) {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Photos, // Photo Library only
            });

            if (!image || !image.dataUrl) {
                return null;
            }

            return await dataUrlToFile(image.dataUrl, image.format);
        } catch (error) {
            console.error('Error selecting photo from library:', error);
            if (error.message?.includes('cancel') ||
                error.message?.includes('User cancelled') ||
                error.message?.includes('User canceled')) {
                return null;
            }
            throw error;
        }
    }

    // On web, use standard file input
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.heic,.heif';

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

/**
 * Select a file from device (Choose File option)
 * On iOS, this uses the same photo picker which allows accessing files from other apps
 * @returns {Promise<File|null>} - Returns a File object or null if cancelled
 */
export async function selectPhotoFromFiles() {
    // On iOS, the Photos picker can access files from other apps (Files app, etc.)
    // For now, we'll use the same implementation as photo library
    // In the future, you could integrate a document picker plugin if needed
    return selectPhotoFromLibrary();
}

/**
 * Select a photo (backward compatibility - defaults to library)
 * @returns {Promise<File|null>} - Returns a File object or null if cancelled
 */
export async function selectPhoto() {
    return selectPhotoFromLibrary();
}
