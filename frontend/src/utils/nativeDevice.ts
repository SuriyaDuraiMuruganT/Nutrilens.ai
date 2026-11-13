import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
  try {
    if (Capacitor.isPluginAvailable('Haptics')) {
      await Haptics.impact({ style });
    }
  } catch (e) {
    // Graceful fallback on web
  }
};

export const captureMealPhoto = async (): Promise<{ file: File; previewUrl: string } | null> => {
  try {
    // If running in Native App (Android/iOS)
    if (Capacitor.isPluginAvailable('Camera')) {
      await triggerHaptic(ImpactStyle.Medium);
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        saveToGallery: false,
        width: 1280,
      });

      if (!photo.webPath) return null;

      // Fetch blob from Capacitor local webPath
      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const file = new File([blob], `meal_${Date.now()}.jpg`, { type: 'image/jpeg' });

      return { file, previewUrl: photo.webPath };
    }
  } catch (err: any) {
    // User cancelled camera or permission not granted
    if (err?.message !== 'User cancelled photos app') {
      console.warn('Native camera capture fallback:', err);
    }
  }
  return null;
};
