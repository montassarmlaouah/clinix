import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LUNA_COLORS } from '@/src/theme/colors';

interface LunaScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}

export const LunaScreen = React.memo(function LunaScreen({
  children,
  style,
  edges = ['top'],
}: LunaScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: LUNA_COLORS.background }, style]} edges={edges}>
      <View style={{ flex: 1 }}>{children}</View>
    </SafeAreaView>
  );
});
