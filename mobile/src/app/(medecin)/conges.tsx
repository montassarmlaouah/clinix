import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiGet, apiPost } from '@/src/api/client';
import { CONGES_MEDECIN } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Conge {
  id: number;
  dateDebut: string;
  dateFin: string;
  motif?: string;
  statut: 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE' | 'ANNULE';
}

const STATUT_LABEL: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  APPROUVE:   'Approuvé',
  REFUSE:     'Refusé',
  ANNULE:     'Annulé',
};
const STATUT_COLOR: Record<string, string> = {
  EN_ATTENTE: LUNA_COLORS.accentOrange,
  APPROUVE:   LUNA_COLORS.success,
  REFUSE:     '#FF4444',
  ANNULE:     LUNA_COLORS.tertiary,
};

// ── Composant ─────────────────────────────────────────────────────────────────
export default function CongesMedecinScreen(): React.JSX.Element {
  const router = useRouter();
  const { userId } = useAuthStore();
  const [items, setItems] = useState<Conge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ dateDebut: '', dateFin: '', motif: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      if (!userId) { setLoading(false); return; }
      const data = await apiGet<Conge[]>(CONGES_MEDECIN.BY_MEDECIN(userId));
      setItems(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit() {
    if (!form.dateDebut || !form.dateFin) return;
    setSubmitting(true);
    try {
      await apiPost(CONGES_MEDECIN.CREATE, {
        dateDebut: form.dateDebut,
        dateFin:   form.dateFin,
        motif:     form.motif,
      });
      setShowModal(false);
      setForm({ dateDebut: '', dateFin: '', motif: '' });
      load(true);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur lors de la demande');
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={LUNA_COLORS.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Mes congés</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={LUNA_COLORS.textInverse} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor={LUNA_COLORS.secondary}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="calendar-outline" size={48} color={LUNA_COLORS.tertiary} />
            <Text style={styles.emptyText}>Aucune demande de congé</Text>
            <TouchableOpacity style={styles.ctaBtn} onPress={() => setShowModal(true)}>
              <Text style={styles.ctaBtnText}>Faire une demande</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: STATUT_COLOR[item.statut] ?? LUNA_COLORS.tertiary }]}>
                <Text style={styles.badgeText}>{STATUT_LABEL[item.statut] ?? item.statut}</Text>
              </View>
            </View>
            <View style={styles.dates}>
              <View style={styles.dateBlock}>
                <Text style={styles.dateLabel}>Début</Text>
                <Text style={styles.dateValue}>{formatDate(item.dateDebut)}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={LUNA_COLORS.tertiary} />
              <View style={styles.dateBlock}>
                <Text style={styles.dateLabel}>Fin</Text>
                <Text style={styles.dateValue}>{formatDate(item.dateFin)}</Text>
              </View>
            </View>
            {item.motif && (
              <Text style={styles.motif}>{item.motif}</Text>
            )}
          </View>
        )}
      />

      {/* Modal demande de congé */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Demande de congé</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={LUNA_COLORS.textInverse} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Date de début *</Text>
              <TextInput
                style={styles.input}
                value={form.dateDebut}
                onChangeText={(v) => setForm((f) => ({ ...f, dateDebut: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={LUNA_COLORS.tertiary}
                keyboardType="default"
              />
              <Text style={styles.fieldLabel}>Date de fin *</Text>
              <TextInput
                style={styles.input}
                value={form.dateFin}
                onChangeText={(v) => setForm((f) => ({ ...f, dateFin: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={LUNA_COLORS.tertiary}
              />
              <Text style={styles.fieldLabel}>Motif (facultatif)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.motif}
                onChangeText={(v) => setForm((f) => ({ ...f, motif: v }))}
                placeholder="Précisez le motif..."
                placeholderTextColor={LUNA_COLORS.tertiary}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitBtnText}>Envoyer la demande</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: LUNA_COLORS.background },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  list:           { padding: spacing.md, gap: spacing.sm },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop:        spacing.xl,
    paddingBottom:     spacing.md,
    backgroundColor:   LUNA_COLORS.dark,
  },
  backBtn: { padding: spacing.xs },
  addBtn:  { marginLeft: 'auto', padding: spacing.xs },
  title:   { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.textInverse },
  errorBanner: {
    backgroundColor: '#FF4444', padding: spacing.sm, margin: spacing.md, borderRadius: borderRadius.md,
  },
  errorText: { color: '#fff', fontSize: fontSize.sm },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.lg,
    padding:         spacing.md,
    gap:             spacing.sm,
  },
  cardHeader: { flexDirection: 'row' },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: '#fff' },
  dates: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dateBlock: { alignItems: 'center' },
  dateLabel: { fontSize: fontSize.xs, color: LUNA_COLORS.tertiary },
  dateValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.textInverse },
  motif:     { fontSize: fontSize.sm, color: LUNA_COLORS.textInverse, fontStyle: 'italic' },
  emptyText: { fontSize: fontSize.md, color: LUNA_COLORS.tertiary, textAlign: 'center' },
  ctaBtn:    { backgroundColor: LUNA_COLORS.secondary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  ctaBtnText:{ color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: LUNA_COLORS.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '80%' },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.dark },
  modalTitle:   { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.textInverse },
  modalBody:    { padding: spacing.md },
  fieldLabel:   { fontSize: fontSize.sm, color: LUNA_COLORS.tertiary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: LUNA_COLORS.dark,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: LUNA_COLORS.textInverse,
    fontSize: fontSize.md,
  },
  textArea:          { minHeight: 80, textAlignVertical: 'top' },
  submitBtn:         { backgroundColor: LUNA_COLORS.secondary, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xl },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md },
});
