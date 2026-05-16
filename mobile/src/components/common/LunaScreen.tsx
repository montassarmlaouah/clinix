import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LUNA_COLORS } from '@/src/theme/colors';

interface LunaScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}

/** Conteneur racine standard — fond LUNA + safe area */
export function LunaScreen({
  children,
  style,
  edges = ['top'],
}: LunaScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  inner: { flex: 1 },
});
