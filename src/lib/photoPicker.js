import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNative } from './capacitor';

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

export async function selectPhotoFromLibrary() {
    if (isNative()) {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Photos, // Photo Library only - no camera option
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

    // Web fallback - use file input
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
