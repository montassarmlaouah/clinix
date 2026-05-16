/**
 * Web stub — push notifications are not supported on web.
 * React Native's platform-specific file resolution will use
 * push.service.native.ts on iOS/Android instead of this file.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function registerPushToken(_userId: number | string): Promise<void> {
  // no-op on web
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleNotificationResponse(_response: any): void {
  // no-op on web
}
