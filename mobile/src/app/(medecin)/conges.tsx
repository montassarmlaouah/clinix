import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
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
import { borderRadius, spacing, shadows } from '@/src/theme/spacing';
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
  const [form, setForm] = useState<{ dateDebut: Date | null; dateFin: Date | null; motif: string }>({
    dateDebut: null,
    dateFin:   null,
    motif:     '',
  });
  const [activePicker, setActivePicker] = useState<'debut' | 'fin' | null>(null);
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

  function toIsoDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  function displayDate(d: Date | null): string {
    if (!d) return 'Sélectionner une date';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function onDateChange(event: { type: string }, date?: Date) {
    if (event.type === 'dismissed') { setActivePicker(null); return; }
    if (!date) return;
    if (activePicker === 'debut') setForm(f => ({ ...f, dateDebut: date }));
    else if (activePicker === 'fin') setForm(f => ({ ...f, dateFin: date }));
    if (Platform.OS === 'android') setActivePicker(null);
  }

  async function handleSubmit() {
    if (!form.dateDebut || !form.dateFin) return;
    setSubmitting(true);
    try {
      await apiPost(CONGES_MEDECIN.CREATE, {
        medecinId: userId,
        dateDebut: toIsoDate(form.dateDebut),
        dateFin:   toIsoDate(form.dateFin),
        motif:     form.motif,
      });
      setShowModal(false);
      setForm({ dateDebut: null, dateFin: null, motif: '' });
      setActivePicker(null);
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
              {Platform.OS === 'web' ? (
                <View style={[styles.dateButton, !form.dateDebut && styles.dateButtonEmpty]}>
                  <Ionicons name="calendar-outline" size={18} color={form.dateDebut ? LUNA_COLORS.secondary : LUNA_COLORS.tertiary} />
                  {React.createElement('input', {
                    type: 'date',
                    value: form.dateDebut ? toIsoDate(form.dateDebut) : '',
                    min: toIsoDate(new Date()),
                    onChange: (e: any) => {
                      const v = e.target.value;
                      setForm(f => ({ ...f, dateDebut: v ? new Date(v + 'T12:00:00') : null }));
                    },
                    style: { flex: 1, background: 'transparent', border: 'none', color: LUNA_COLORS.textInverse, fontSize: 16, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' },
                  })}
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.dateButton, !form.dateDebut && styles.dateButtonEmpty]}
                    onPress={() => setActivePicker(activePicker === 'debut' ? null : 'debut')}
                  >
                    <Ionicons name="calendar-outline" size={18} color={form.dateDebut ? LUNA_COLORS.secondary : LUNA_COLORS.tertiary} />
                    <Text style={[styles.dateButtonText, !form.dateDebut && styles.dateButtonPlaceholder]}>
                      {displayDate(form.dateDebut)}
                    </Text>
                  </TouchableOpacity>
                  {activePicker === 'debut' && (
                    <DateTimePicker
                      value={form.dateDebut ?? new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                      onChange={onDateChange}
                      minimumDate={new Date()}
                      themeVariant="dark"
                      style={styles.datePicker}
                    />
                  )}
                </>
              )}

              <Text style={styles.fieldLabel}>Date de fin *</Text>
              {Platform.OS === 'web' ? (
                <View style={[styles.dateButton, !form.dateFin && styles.dateButtonEmpty]}>
                  <Ionicons name="calendar-outline" size={18} color={form.dateFin ? LUNA_COLORS.secondary : LUNA_COLORS.tertiary} />
                  {React.createElement('input', {
                    type: 'date',
                    value: form.dateFin ? toIsoDate(form.dateFin) : '',
                    min: form.dateDebut ? toIsoDate(form.dateDebut) : toIsoDate(new Date()),
                    onChange: (e: any) => {
                      const v = e.target.value;
                      setForm(f => ({ ...f, dateFin: v ? new Date(v + 'T12:00:00') : null }));
                    },
                    style: { flex: 1, background: 'transparent', border: 'none', color: LUNA_COLORS.textInverse, fontSize: 16, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' },
                  })}
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.dateButton, !form.dateFin && styles.dateButtonEmpty]}
                    onPress={() => setActivePicker(activePicker === 'fin' ? null : 'fin')}
                  >
                    <Ionicons name="calendar-outline" size={18} color={form.dateFin ? LUNA_COLORS.secondary : LUNA_COLORS.tertiary} />
                    <Text style={[styles.dateButtonText, !form.dateFin && styles.dateButtonPlaceholder]}>
                      {displayDate(form.dateFin)}
                    </Text>
                  </TouchableOpacity>
                  {activePicker === 'fin' && (
                    <DateTimePicker
                      value={form.dateFin ?? form.dateDebut ?? new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                      onChange={onDateChange}
                      minimumDate={form.dateDebut ?? new Date()}
                      themeVariant="dark"
                      style={styles.datePicker}
                    />
                  )}
                </>
              )}
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
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    borderRadius:    borderRadius.lg,
    padding:         spacing.md,
    gap:             spacing.sm,
  }, // ✨
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
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  dateButton: {
    backgroundColor:  LUNA_COLORS.dark,
    borderRadius:     borderRadius.md,
    padding:          spacing.sm,
    flexDirection:    'row',
    alignItems:       'center',
    gap:              spacing.sm,
  },
  dateButtonEmpty:       { borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle },
  dateButtonText:        { color: LUNA_COLORS.textInverse, fontSize: fontSize.md, flex: 1 },
  dateButtonPlaceholder: { color: LUNA_COLORS.tertiary },
  datePicker:            { backgroundColor: LUNA_COLORS.dark, borderRadius: borderRadius.md, marginTop: spacing.xs },
  submitBtn: { backgroundColor: LUNA_COLORS.secondary, padding: spacing.md, borderRadius: borderRadius.full, minHeight: 48,
    alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xl }, // ✨
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md },
});
