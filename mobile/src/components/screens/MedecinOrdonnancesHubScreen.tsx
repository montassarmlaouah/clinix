import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ordonnanceService } from '@/src/api/services/medecinService';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Ordonnance {
  id: string;
  signee?: boolean;
  validee?: boolean;
  dateCreation?: string;
  patient?: { nom?: string; prenom?: string };
  medicaments?: Array<{ nomMedicament?: string; dosage?: string }>;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function MedecinOrdonnancesHubScreen(): React.JSX.Element {
  const router = useRouter();
  const medecinId = useAuthStore((s) => s.userId);
  const [items, setItems] = useState<Ordonnance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signing, setSigning] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!medecinId) return;
    try {
      const data = await ordonnanceService.list({ medecinId: String(medecinId) });
      setItems((data as Ordonnance[]) ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medecinId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function signer(id: string): Promise<void> {
    setSigning(id);
    try {
      await ordonnanceService.signer(id);
      await load();
    } catch {
      /* ignore */
    } finally {
      setSigning(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Ordonnances" subtitle="Liste et signature" />
      {loading ? <LoadingOverlay /> : null}
      <FlatList
        data={items}
        keyExtractor={(item, i) => String(item.id ?? i)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <EmptyState icon="document-text-outline" title="Aucune ordonnance" /> : null
        }
        renderItem={({ item }) => {
          const id = String(item.id ?? '');
          const patient = item.patient;
          const label = patient
            ? `${patient.prenom ?? ''} ${patient.nom ?? ''}`.trim()
            : `Ordonnance #${id}`;
          const statut = item.validee ? 'Validée' : item.signee ? 'Signée' : 'Brouillon';
          const isSigning = signing === id;

          return (
            <View style={styles.card}>
              <Pressable
                onPress={() => id && router.push(`/(medecin)/patients/${id}/prescriptions` as never)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{label}</Text>
                  <Text style={[styles.statutBadge,
                    item.validee ? styles.badgeValide :
                    item.signee ? styles.badgeSigne : styles.badgeBrouillon
                  ]}>
                    {statut}
                  </Text>
                </View>
                <Text style={styles.meta}>Créée le {formatDate(item.dateCreation)}</Text>
                {(item.medicaments ?? []).slice(0, 2).map((m, i) => (
                  <Text key={i} style={styles.medicament}>• {m.nomMedicament ?? '—'} {m.dosage ? `— ${m.dosage}` : ''}</Text>
                ))}
                {(item.medicaments ?? []).length > 2 && (
                  <Text style={styles.meta}>+{(item.medicaments ?? []).length - 2} autre(s)…</Text>
                )}
              </Pressable>
              {!item.signee && !item.validee && (
                <Pressable
                  style={[styles.signerBtn, isSigning && styles.signerBtnDisabled]}
                  onPress={() => { if (!isSigning) void signer(id); }}
                >
                  {isSigning
                    ? <ActivityIndicator size="small" color={LUNA_COLORS.textInverse} />
                    : <Text style={styles.signerBtnText}>Signer</Text>
                  }
                </Pressable>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  list: { padding: spacing.lg, paddingBottom: 80 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: LUNA_COLORS.primary,
    ...(shadows.sm as object),
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest, flex: 1 },
  statutBadge: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginLeft: spacing.sm,
  },
  badgeValide: { backgroundColor: '#D1FAE5', color: '#065F46' },
  badgeSigne:  { backgroundColor: '#DBEAFE', color: '#1E40AF' },
  badgeBrouillon: { backgroundColor: '#FEF3C7', color: '#92400E' },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
  medicament: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, marginTop: 2 },
  signerBtn: {
    marginTop: spacing.md,
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  signerBtnDisabled: { opacity: 0.6 },
  signerBtnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
});

