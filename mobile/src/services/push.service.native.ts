import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { apiPost } from '@/src/api/client';
import { NOTIFICATIONS } from '@/src/api/endpoints';

// ── Foreground handler (app en premier plan) ──────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
    shouldShowBanner: true,
    shouldShowList:  true,
  }),
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface NotifData {
  type?:      string;
  id?:        string | number;
  contactId?: string | number;
}

// ── Enregistrement du token push ──────────────────────────────────────────────
export async function registerPushToken(userId: number | string): Promise<void> {
  if (!Device.isDevice) {
    return;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('clinix-default', {
      name:             'Clinix',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#54ACBF',
      showBadge:        true,
    });
  }

  let token: Notifications.ExpoPushToken;
  try {
    token = await Notifications.getExpoPushTokenAsync();
  } catch {
    return;
  }

  try {
    await apiPost(NOTIFICATIONS.PUSH_TOKEN, {
      userId,
      expoPushToken: token.data,
      platform:      Platform.OS,
    });
    await SecureStore.setItemAsync('push_token', token.data);
  } catch {
    // Non-bloquant
  }
}

// ── Gestion du tap sur une notification ──────────────────────────────────────
export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): void {
  const data = response.notification.request.content.data as NotifData | undefined;
  if (!data?.type) return;

  switch (data.type) {
    case 'NOUVEAU_RDV':
      router.push('/(secretaire)/rendez-vous' as never);
      break;
    case 'TELECONSULTATION':
      if (data.id) router.push(`/(medecin)/teleconsultation/${data.id}` as never);
      break;
    case 'ALERTE_URGENCE':
      router.push('/(infirmier)/alertes' as never);
      break;
    case 'ORDONNANCE_PRETE':
      router.push('/(patient)/ordonnances' as never);
      break;
    case 'MESSAGE':
      if (data.contactId) router.push(`/(medecin)/messagerie/${data.contactId}` as never);
      break;
    default:
      break;
  }
}
