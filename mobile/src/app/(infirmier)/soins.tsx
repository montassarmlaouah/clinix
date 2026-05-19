import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPatch } from '@/src/api/client';
import { ADMINISTRATIONS } from '@/src/api/endpoints';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

interface PatientInfo {
  id: string | number;
  nom: string;
  prenom: string;
  chambre?: string | null;
}

interface Administration {
  id: string | number;
  patient?: PatientInfo | null;
  patientNom?: string;
  patientPrenom?: string;
  medicament?: string;
  medicamentNom?: string;
  typeSoin?: string;
  typeTraitement?: string;
  dose?: string;
  dosage?: string;
  heurePrevue?: string;
  heurePrevu?: string;
  statut?: string;
}

interface SectionData {
  title: string;
  data: Administration[];
}

function getTime(value?: string): string {
  if (!value) return '--:--';
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function patientName(item: Administration): string {
  if (item.patient) return `${item.patient.prenom} ${item.patient.nom}`;
  return `${item.patientPrenom ?? ''} ${item.patientNom ?? ''}`.trim() || 'Patient';
}

function soinLabel(item: Administration): string {
  return item.typeSoin ?? item.typeTraitement ?? item.medicamentNom ?? item.medicament ?? 'Soin';
}

function doseLabel(item: Administration): string {
  return item.dose ?? item.dosage ?? '';
}

function isDone(item: Administration): boolean {
  return item.statut === 'ADMINISTRE' || item.statut === 'FAIT';
}

export default function SoinsScreen(): React.JSX.Element {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [items, setItems] = useState<Administration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doneIds, setDoneIds] = useState<Set<string | number>>(new Set());
  const [selected, setSelected] = useState<Administration | null>(null);
  const [observation, setObservation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<Administration[]>(ADMINISTRATIONS.BY_INFIRMIER(userId));
      setItems(data ?? []);
    } catch {
      setError('Impossible de charger le planning des soins.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const sections = useMemo<SectionData[]>(() => {
    const grouped = new Map<string, Administration[]>();
    [...items]
      .sort((a, b) => String(a.heurePrevue ?? a.heurePrevu ?? '').localeCompare(String(b.heurePrevue ?? b.heurePrevu ?? '')))
      .forEach((item) => {
        const hour = getTime(item.heurePrevue ?? item.heurePrevu);
        if (!grouped.has(hour)) grouped.set(hour, []);
        grouped.get(hour)!.push(item);
      });
    return Array.from(grouped.entries()).map(([title, data]) => ({ title, data }));
  }, [items]);

  const pendingCount = items.filter((item) => !isDone(item) && !doneIds.has(item.id)).length;
  const todayLabel = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

  async function confirmAdministration(): Promise<void> {
    if (!selected || !userId) return;
    setSubmitting(true);
    try {
      await apiPatch(ADMINISTRATIONS.ADMINISTRER(selected.id), {
        infirmierId: userId,
        dateHeure: new Date().toISOString(),
        observation,
      });
      setDoneIds((previous) => new Set(previous).add(selected.id));
      setSelected(null);
      setObservation('');
    } catch {
      setError("Erreur lors de l'administration du soin.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Soins du {todayLabel}</Text>
          <Text style={styles.subtitle}>{pendingCount} en attente / {items.length} total</Text>
        </View>
        <Pressable onPress={() => router.push('/(infirmier)/scanner' as never)} style={styles.scanButton}>
          <Ionicons name="scan-outline" size={17} color={LUNA_COLORS.textInverse} />
          <Text style={styles.scanText}>Scanner</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor={LUNA_COLORS.secondary}
            colors={[LUNA_COLORS.secondary]}
          />
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={14} color={LUNA_COLORS.tertiary} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const checked = isDone(item) || doneIds.has(item.id);
          return (
            <View style={[styles.row, checked && styles.rowDone]}>
              <Text style={styles.time}>{getTime(item.heurePrevue ?? item.heurePrevu)}</Text>
              <View style={styles.rowBody}>
                <Text style={styles.patient} numberOfLines={1}>{patientName(item)}</Text>
                <Text style={styles.soin} numberOfLines={1}>{soinLabel(item)} {doseLabel(item)}</Text>
                {item.patient?.chambre ? <Text style={styles.chambre}>Chambre {item.patient.chambre}</Text> : null}
              </View>
              <Pressable
                onPress={() => !checked && setSelected(item)}
                disabled={checked}
                style={[styles.checkbox, checked && styles.checkboxDone]}
              >
                {checked ? <Ionicons name="checkmark" size={17} color={LUNA_COLORS.textInverse} /> : null}
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="medkit-outline"
            title="Aucun soin planifie pour aujourd'hui"
            subtitle="Le planning infirmier ne contient aucune tache."
          />
        }
      />

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} />
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Administrer le soin</Text>
            {selected ? (
              <Text style={styles.modalSummary}>
                {patientName(selected)} - {soinLabel(selected)} {doseLabel(selected)}
              </Text>
            ) : null}
            <TextInput
              value={observation}
              onChangeText={setObservation}
              placeholder="Observation"
              placeholderTextColor={LUNA_COLORS.textDisabled}
              multiline
              style={styles.input}
            />
            <View style={styles.actions}>
              <Pressable onPress={() => setSelected(null)} style={[styles.actionButton, styles.cancelButton]}>
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                onPress={confirmAdministration}
                disabled={submitting}
                style={[styles.actionButton, styles.confirmButton, submitting && styles.disabled]}
              >
                <Text style={styles.confirmText}>{submitting ? '...' : 'Confirmer'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    backgroundColor: LUNA_COLORS.surface,
    ...(shadows.sm as object),
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  subtitle: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  scanButton: {
    flexDirection: 'row',
    minHeight: 48,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scanText: { color: LUNA_COLORS.textInverse, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  errorBox: {
    backgroundColor: LUNA_COLORS.errorLight,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  errorText: { color: LUNA_COLORS.error, fontSize: fontSize.sm },
  listContent: { paddingTop: spacing.md, paddingBottom: 80 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
    backgroundColor: LUNA_COLORS.background,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  }, // ✨
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
  },
  rowDone: { backgroundColor: LUNA_COLORS.successLight },
  time: {
    minWidth: 52,
    textAlign: 'center',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.tertiary,
  },
  rowBody: { flex: 1 },
  patient: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  soin: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  chambre: { fontSize: fontSize.xs, color: LUNA_COLORS.tertiary, marginTop: 2 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: LUNA_COLORS.success, borderColor: LUNA_COLORS.success },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: LUNA_COLORS.overlay },
  modal: {
    backgroundColor: LUNA_COLORS.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xxl,
    paddingBottom: spacing.huge,
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  modalSummary: { marginTop: spacing.sm, color: LUNA_COLORS.textSecondary, fontSize: fontSize.sm },
  input: {
    minHeight: 80,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: LUNA_COLORS.textPrimary,
    textAlignVertical: 'top',
  }, // ✨
  actions: { flexDirection: 'row', gap: spacing.md },
  actionButton: {
    flex: 1,
    height: 46,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: { backgroundColor: LUNA_COLORS.surfaceLight, borderWidth: 1, borderColor: LUNA_COLORS.borderDark },
  confirmButton: { backgroundColor: LUNA_COLORS.success },
  disabled: { opacity: 0.6 },
  cancelText: { color: LUNA_COLORS.dark, fontWeight: fontWeight.medium },
  confirmText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
});
