/**
 * DemandesScreen — Demandes médicaments + Demandes d'opération en deux onglets.
 * Fusionne demandes-medicament.tsx et demandes-operation.tsx.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DemandesMedicamentListScreen } from '@/src/components/screens/DemandesMedicamentListScreen';
import { DemandesOperationListScreen } from '@/src/components/screens/DemandesOperationListScreen';
import { SegmentTabs } from '@/src/components/common';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

type DemandesTab = 'medicament' | 'operation';

export interface DemandesScreenProps {
  initialTab?: DemandesTab;
}

export function DemandesScreen({ initialTab = 'medicament' }: DemandesScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<DemandesTab>(initialTab);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LUNA_COLORS.background }}>
      <View style={styles.header}>
        <Text style={styles.title}>Demandes</Text>
        <Text style={styles.sub}>Médicaments · Opérations</Text>
      </View>
      <SegmentTabs<DemandesTab>
        options={[
          { key: 'medicament', label: 'Médicaments' },
          { key: 'operation',  label: 'Opérations'  },
        ]}
        value={activeTab}
        onChange={setActiveTab}
        onDark={false}
      />
      {activeTab === 'medicament' ? (
        <DemandesMedicamentListScreen createRoute="/(medecin)/medicament-nouveau" />
      ) : (
        <DemandesOperationListScreen
          title="Demandes d'opération"
          detailRoutePrefix="/(medecin)/operations"
          createRoute="/(medecin)/operations/nouveau"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: LUNA_COLORS.surface,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  sub:   { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
});
