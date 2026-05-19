import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { technicienService, type Equipement } from '@/src/api/services/technicien.service';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Helpers ───────────────────────────────────────────────────────────────────
function categorieLabel(cat?: string): string {
  const map: Record<string, string> = {
    LITS_MOBILIER: 'Lits & Mobilier',
    DIAGNOSTIC: 'Diagnostic',
    MONITORING: 'Monitoring',
    CHIRURGIE: 'Chirurgie',
    IMAGERIE: 'Imagerie',
    LABORATOIRE: 'Laboratoire',
    STERILISATION: 'Stérilisation',
    REHABILITATION: 'Rééducation',
    INFORMATIQUE: 'Informatique',
    CLIMATISATION: 'Climatisation',
    AUTRE: 'Autre',
  };
  return cat ? (map[cat] ?? cat) : '—';
}

function criticiteLabel(c?: string): { label: string; color: string } {
  switch (c) {
    case 'CRITIQUE':  return { label: 'Critique',  color: LUNA_COLORS.error };
    case 'HAUTE':     return { label: 'Haute',     color: LUNA_COLORS.warning };
    case 'MOYENNE':   return { label: 'Moyenne',   color: LUNA_COLORS.info };
    default:          return { label: 'Faible',    color: LUNA_COLORS.success };
  }
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Composant détail ligne ────────────────────────────────────────────────────
function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

// ── Écran principal ────────────────────────────────────────────────────────────
export function TechnicienPannesScreen(): React.JSX.Element {
  const [pannes, setPannes] = useState<Equipement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Equipement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Formulaire de réparation
  const [repairNotes, setRepairNotes] = useState('');
  const [repairHours, setRepairHours] = useState('1');
  const [repairMinutes, setRepairMinutes] = useState('0');
  const [repairType, setRepairType] = useState<'CORRECTIVE' | 'PREVENTIVE'>('CORRECTIVE');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await technicienService.listEnPanne();
      setPannes(data ?? []);
    } catch {
      setPannes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function openModal(item: Equipement) {
    setSelected(item);
    setRepairNotes('');
    setRepairHours('1');
    setRepairMinutes('0');
    setRepairType('CORRECTIVE');
  }

  function closeModal() {
    setSelected(null);
  }

  async function handleTraiter(): Promise<void> {
    if (!selected) return;
    const hours = parseInt(repairHours, 10) || 0;
    const mins  = parseInt(repairMinutes, 10) || 0;

    if (!repairNotes.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir les notes de réparation.');
      return;
    }

    setSubmitting(true);
    try {
      await technicienService.traiterPanne(selected.id, {
        repairType,
        repairNotes: repairNotes.trim(),
        repairHours: hours,
        repairMinutes: mins,
      });
      closeModal();
      Alert.alert('Succès', 'Équipement remis en service.', [
        { text: 'OK', onPress: () => void load(true) },
      ]);
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Impossible de traiter la panne.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Pannes"
        subtitle={`${pannes.length} équipement(s) en panne`}
      />

      <FlatList
        data={pannes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); void load(true); }}
            tintColor={LUNA_COLORS.secondary}
          />
        }
        renderItem={({ item }) => {
          const crit = criticiteLabel(item.criticite);
          return (
            <Pressable style={styles.card} onPress={() => openModal(item)}>
              <View style={styles.cardAccent} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.nom}</Text>
                  <View style={[styles.panneBadge]}>
                    <Text style={styles.panneBadgeText}>EN PANNE</Text>
                  </View>
                </View>
                <Text style={styles.cardCode}>{item.code ?? '—'}</Text>
                <View style={styles.cardMeta}>
                  <Ionicons name="location-outline" size={13} color={LUNA_COLORS.textSecondary} />
                  <Text style={styles.cardMetaText}>
                    {item.chambre?.numero ? `Chambre ${item.chambre.numero}` : (item.localisation ?? '—')}
                  </Text>
                  <View style={[styles.critBadge, { backgroundColor: `${crit.color}22` }]}>
                    <Text style={[styles.critText, { color: crit.color }]}>{crit.label}</Text>
                  </View>
                </View>
                <Text style={styles.cardCat}>{categorieLabel(item.categorie)}</Text>
                <View style={styles.cardFooter}>
                  <Ionicons name="time-outline" size={13} color={LUNA_COLORS.textSecondary} />
                  <Text style={styles.cardDate}>{formatDate(item.datePanne ?? item.updatedAt)}</Text>
                  <View style={styles.voirBtn}>
                    <Text style={styles.voirText}>Traiter</Text>
                    <Ionicons name="arrow-forward-outline" size={13} color={LUNA_COLORS.secondary} />
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-circle-outline"
            title="Aucune panne"
            subtitle="Tous les équipements sont opérationnels."
          />
        }
      />

      {/* ── Modal traitement ──────────────────────────────────────────────── */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Titre */}
              <View style={styles.modalHeader}>
                <Ionicons name="construct-outline" size={22} color={LUNA_COLORS.secondary} />
                <Text style={styles.modalTitle}>Traitement de la panne</Text>
                <Pressable onPress={closeModal} hitSlop={8}>
                  <Ionicons name="close" size={22} color={LUNA_COLORS.textSecondary} />
                </Pressable>
              </View>

              {selected ? (
                <View style={styles.modalContent}>
                  {/* Détails équipement */}
                  <View style={styles.detailCard}>
                    <View style={styles.detailGrid}>
                      <View style={styles.detailCell}>
                        <Text style={styles.detailKey}>ÉQUIPEMENT</Text>
                        <Text style={styles.detailVal}>{selected.nom}</Text>
                      </View>
                      <View style={styles.detailCell}>
                        <Text style={styles.detailKey}>CODE</Text>
                        <Text style={styles.detailVal}>{selected.code ?? '—'}</Text>
                      </View>
                      <View style={styles.detailCell}>
                        <Text style={styles.detailKey}>CATÉGORIE</Text>
                        <Text style={styles.detailVal}>{categorieLabel(selected.categorie)}</Text>
                      </View>
                      <View style={styles.detailCell}>
                        <Text style={styles.detailKey}>LOCALISATION</Text>
                        <Text style={styles.detailVal}>
                          {selected.chambre?.numero ? `Chambre ${selected.chambre.numero}` : (selected.localisation ?? '—')}
                        </Text>
                      </View>
                      <View style={styles.detailCell}>
                        <Text style={styles.detailKey}>CRITICITÉ</Text>
                        <Text style={[styles.detailVal, { color: criticiteLabel(selected.criticite).color }]}>
                          {criticiteLabel(selected.criticite).label}
                        </Text>
                      </View>
                      <View style={styles.detailCell}>
                        <Text style={styles.detailKey}>ÉTAT TECHNIQUE</Text>
                        <View style={styles.panneBadgeInline}>
                          <Text style={styles.panneBadgeText}>{selected.etatTechnique ?? 'EN_PANNE'}</Text>
                        </View>
                      </View>
                      <View style={[styles.detailCell, { width: '100%' }]}>
                        <Text style={styles.detailKey}>DATE DU SIGNALEMENT</Text>
                        <Text style={styles.detailVal}>{formatDate(selected.datePanne ?? selected.updatedAt)}</Text>
                      </View>
                      {selected.descriptionPanne ? (
                        <View style={[styles.detailCell, { width: '100%' }]}>
                          <Text style={styles.detailKey}>OBSERVATIONS DE LA PANNE</Text>
                          <Text style={styles.detailVal}>{selected.descriptionPanne}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Hint */}
                  <View style={styles.hint}>
                    <Ionicons name="information-circle-outline" size={16} color={LUNA_COLORS.info} />
                    <Text style={styles.hintText}>
                      Cliquez sur « Réparation Complète » pour terminer et remettre l'équipement en service.
                    </Text>
                  </View>

                  {/* Formulaire */}
                  <Text style={styles.formLabel}>Type de réparation</Text>
                  <View style={styles.typeRow}>
                    {(['CORRECTIVE', 'PREVENTIVE'] as const).map((t) => (
                      <Pressable
                        key={t}
                        style={[styles.typeBtn, repairType === t && styles.typeBtnActive]}
                        onPress={() => setRepairType(t)}
                      >
                        <Text style={[styles.typeBtnText, repairType === t && styles.typeBtnTextActive]}>
                          {t === 'CORRECTIVE' ? 'Corrective' : 'Préventive'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.formLabel}>Notes de réparation *</Text>
                  <TextInput
                    value={repairNotes}
                    onChangeText={setRepairNotes}
                    placeholder="Décrire les travaux effectués…"
                    placeholderTextColor={LUNA_COLORS.textDisabled}
                    multiline
                    style={styles.textarea}
                  />

                  <View style={styles.durationRow}>
                    <View style={styles.durationCell}>
                      <Text style={styles.formLabel}>Heures</Text>
                      <TextInput
                        value={repairHours}
                        onChangeText={setRepairHours}
                        keyboardType="numeric"
                        style={styles.durationInput}
                        placeholderTextColor={LUNA_COLORS.textDisabled}
                      />
                    </View>
                    <View style={styles.durationCell}>
                      <Text style={styles.formLabel}>Minutes</Text>
                      <TextInput
                        value={repairMinutes}
                        onChangeText={setRepairMinutes}
                        keyboardType="numeric"
                        style={styles.durationInput}
                        placeholderTextColor={LUNA_COLORS.textDisabled}
                      />
                    </View>
                  </View>
                </View>
              ) : null}
            </ScrollView>

            {/* Boutons */}
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={closeModal}>
                <Ionicons name="close-outline" size={18} color={LUNA_COLORS.darkest} />
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.repairBtn, submitting && styles.disabledBtn]}
                onPress={() => void handleTraiter()}
                disabled={submitting}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.repairText}>
                  {submitting ? 'Traitement…' : 'Réparation Complète & Mettre en Marche'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: LUNA_COLORS.background },
  list:           { padding: spacing.lg, paddingBottom: 100 },

  // ── Card ──
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    marginBottom: spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
    ...(shadows.sm as object),
  },
  cardAccent:     { width: 5, backgroundColor: LUNA_COLORS.error },
  cardBody:       { flex: 1, padding: spacing.md, gap: 4 },
  cardTop:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName:       { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest, flex: 1 },
  cardCode:       { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, fontFamily: 'monospace' },
  cardMeta:       { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  cardMetaText:   { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, flex: 1 },
  cardCat:        { fontSize: fontSize.xs, color: LUNA_COLORS.tertiary },
  cardFooter:     { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 },
  cardDate:       { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, flex: 1 },

  panneBadge:     { backgroundColor: '#fef2f2', borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  panneBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: LUNA_COLORS.error },

  critBadge:      { borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  critText:       { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },

  voirBtn:        { flexDirection: 'row', alignItems: 'center', gap: 2 },
  voirText:       { fontSize: fontSize.xs, color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold },

  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.borderSubtle },
  infoLabel:      { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  infoValue:      { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.darkest, textAlign: 'right', flex: 1, marginLeft: 8 },

  // ── Modal ──
  modalOverlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(1,28,64,0.55)' },
  modal: {
    backgroundColor: LUNA_COLORS.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
    paddingBottom: spacing.huge,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.borderSubtle,
  },
  modalTitle:     { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest, flex: 1 },
  modalContent:   { padding: spacing.lg, gap: spacing.md },

  detailCard: {
    backgroundColor: LUNA_COLORS.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.md,
  },
  detailGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detailCell:     { width: '47%' },
  detailKey:      { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, fontWeight: fontWeight.semibold, textTransform: 'uppercase', marginBottom: 2 },
  detailVal:      { fontSize: fontSize.sm, color: LUNA_COLORS.darkest, fontWeight: fontWeight.medium },

  panneBadgeInline: { backgroundColor: '#fef2f2', borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },

  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: LUNA_COLORS.infoLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  hintText:       { fontSize: fontSize.sm, color: LUNA_COLORS.info, flex: 1 },

  formLabel:      { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.textSecondary, marginBottom: 4 },
  typeRow:        { flexDirection: 'row', gap: spacing.sm },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    alignItems: 'center',
    backgroundColor: LUNA_COLORS.surface,
  },
  typeBtnActive:  { backgroundColor: LUNA_COLORS.secondaryLight, borderColor: LUNA_COLORS.secondary },
  typeBtnText:    { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  typeBtnTextActive: { color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold },
  textarea: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: LUNA_COLORS.textPrimary,
    backgroundColor: LUNA_COLORS.inputBg,
    textAlignVertical: 'top',
  },
  durationRow:    { flexDirection: 'row', gap: spacing.md },
  durationCell:   { flex: 1 },
  durationInput: {
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: LUNA_COLORS.textPrimary,
    backgroundColor: LUNA_COLORS.inputBg,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: LUNA_COLORS.borderSubtle,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    backgroundColor: LUNA_COLORS.surface,
    minHeight: 48,
  },
  cancelText:     { color: LUNA_COLORS.darkest, fontWeight: fontWeight.medium },
  repairBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: LUNA_COLORS.success,
    minHeight: 48,
  },
  disabledBtn:    { opacity: 0.6 },
  repairText:     { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
