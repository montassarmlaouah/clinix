import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

/**
 * Enregistre un PDF reçu en base64 (réponse création personnel) et ouvre / télécharge le fichier.
 */
export async function saveAndOpenPdfFromBase64(
  base64: string,
  fileName: string,
): Promise<void> {
  const safeName = (fileName || 'clinux-identifiants-clinix.pdf').replace(/[^\w.\-]+/g, '_');

  if (Platform.OS === 'web') {
    const byteChars = atob(base64);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      bytes[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const FileSystem = await import('expo-file-system/legacy');
  const dest = `${FileSystem.cacheDirectory}${safeName}`;
  await FileSystem.writeAsStringAsync(dest, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const canOpen = await Linking.canOpenURL(dest);
  if (canOpen) {
    await Linking.openURL(dest);
  } else {
    throw new Error('Impossible d\'ouvrir le fichier PDF sur cet appareil.');
  }
}
