import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconArrowLeft, IconLogout } from '@tabler/icons-react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';

interface HeaderBarProps {
  title: string;
  showLogout?: boolean;
  onBack?: () => void;
}

export const HeaderBar = React.memo(function HeaderBar({ title, showLogout = true, onBack }: HeaderBarProps): React.JSX.Element {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        style: 'destructive',
        onPress: async () => {
          clearAuth();
          await SecureStore.deleteItemAsync('token');
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const iconBtnStyle = {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: LUNA_COLORS.primary }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          height: 56,
        }}
      >
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          {onBack && (
            <Pressable onPress={onBack} style={iconBtnStyle} activeOpacity={0.75}>
              <IconArrowLeft size={22} color={LUNA_COLORS.textInverse} strokeWidth={2} />
            </Pressable>
          )}
        </View>
        <Text
          style={{
            flex: 2,
            fontSize: 17,
            fontWeight: '700',
            color: LUNA_COLORS.textInverse,
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          {showLogout && (
            <Pressable onPress={handleLogout} style={iconBtnStyle} activeOpacity={0.75}>
              <IconLogout size={22} color={LUNA_COLORS.danger} strokeWidth={2} />
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
});
