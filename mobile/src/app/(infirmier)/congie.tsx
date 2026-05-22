import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPost } from '@/src/api/client';
import { ABSENCES } from '@/src/api/endpoints';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing, shadows } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Absence {
  id: string | number;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  motif?: string;
}

const STATUT_COLOR: Record<string, string> = {
  APPROUVE: LUNA_COLORS.success,
  APPROUVEE: LUNA_COLORS.success,
  EN_ATTENTE: LUNA_COLORS.warning ?? '#f59e0b',
  REFUSE: LUNA_COLORS.error,
  REFUSEE: LUNA_COLORS.error,
};

function formatDate(val: string | undefined): string {
  if (!val) return '\u2014';
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? val : d.toLocaleDateString('fr-FR');
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function InfirmierCongieScreen(): React.JSX.Element {
  const userId = useAuthStore((s) => s.userId);
  const [liste, setListe] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [dateDebut, setDateDebut] = useState(todayStr());
  const [dateFin, setDateFin] = useState(todayStr());
  const [motif, setMotif] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<Absence[]>(ABSENCES.BY_INFIRMIER(userId));
      setListe(data ?? []);
    } catch { setListe([]); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  async function handleDemander(): Promise<void> {
    if (!dateDebut || !dateFin) {
      Alert.alert('Validation', 'Veuillez saisir les dates de debut et de fin.');
      return;
    }
    if (dateDebut > dateFin) {
      Alert.alert('Validation', 'La date de fin doit etre apres la date de debut.');
      return;
    }
    setSaving(true);
    try {
      await apiPost(ABSENCES.DEMANDE, {
        utilisateurId: userId,
        dateDebut,
        dateFin,
        motif: motif.trim() || 'Conge',
      });
      setMotif('');
      setDateDebut(todayStr());
      setDateFin(todayStr());
      Alert.alert('Succes', 'Demande de conge envoyee.');
      void load(true);
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Echec de la demande');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Demande de conge" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nouvelle demande</Text>

          <Text style={styles.label}>Date de debut (AAAA-MM-JJ)</Text>
          <TextInput
            style={styles.input}
            value={dateDebut}
            onChangeText={setDateDebut}
            placeholder="2025-01-01"
            placeholderTextColor={LUNA_COLORS.textSecondary}
          />

          <Text style={styles.label}>Date de fin (AAAA-MM-JJ)</Text>
          <TextInput
            style={styles.input}
            value={dateFin}
            onChangeText={setDateFin}
            placeholder="2025-01-07"
            placeholderTextColor={LUNA_COLORS.textSecondary}
          />

          <Text style={styles.label}>Motif</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={motif}
            onChangeText={setMotif}
            placeholder="Indiquez le motif de votre demande..."
            placeholderTextColor={LUNA_COLORS.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Pressable
            style={[styles.btn, saving && styles.btnDisabled]}
            onPress={handleDemander}
            disabled={saving}
          >
            <Text style={styles.btnText}>{saving ? 'Envoi...' : 'Envoyer la demande'}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Mes demandes</Text>

        <FlatList
          data={liste}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void load(true); }}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.absenceCard}>
              <View style={styles.absenceRow}>
                <Text style={styles.absenceDates}>
                  {formatDate(item.dateDebut)} {'->'} {formatDate(item.dateFin)}
                </Text>
                <View style={[styles.badge, { backgroundColor: STATUT_COLOR[item.statut ?? ''] ?? LUNA_COLORS.textSecondary }]}>
                  <Text style={styles.badgeText}>{item.statut ?? '\u2014'}</Text>
                </View>
              </View>
              {item.motif ? <Text style={styles.absenceMotif}>{item.motif}</Text> : null}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="airplane-outline" title="Aucune demande" subtitle="Vos demandes de conge apparaitront ici." />
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  scroll: { padding: spacing.lg, paddingBottom: 80 },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.text,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  label: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: LUNA_COLORS.text,
    marginBottom: spacing.md,
  },
  textarea: { minHeight: 80 },
  btn: {
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  absenceCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  absenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  absenceDates: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.text },
  absenceMotif: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  badge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { fontSize: fontSize.xs, color: '#fff', fontWeight: fontWeight.bold },
});