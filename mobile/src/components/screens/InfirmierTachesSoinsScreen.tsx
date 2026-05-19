import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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

import { apiGet } from '@/src/api/client';
import { MEDECINS, PATIENTS } from '@/src/api/endpoints';
import {
  administrationService,
  type AdministrationTraitement,
} from '@/src/api/services/administration.service';
import { infirmierWorkspaceService } from '@/src/api/services/infirmier-workspace.service';
import { Button, EmptyState, LoadingOverlay, LunaScreen } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

type TabKey = 'taches' | 'rapport' | 'signalement';

interface OptionItem {
  id: string;
  label: string;
}

function statutLabel(t: AdministrationTraitement): string {
  if (t.statutExecution) return t.statutExecution;
  return t.administre ? 'REALISE' : 'PLANIFIE';
}

function nomPatient(t: AdministrationTraitement): string {
  const p = t.patient;
  if (!p) return '—';
  return `${p.prenom ?? ''} ${p.nom ?? ''}`.trim() || '—';
}

export function InfirmierTachesSoinsScreen(): React.JSX.Element {
  const infirmierId = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [tab, setTab] = useState<TabKey>('taches');
  const [taches, setTaches] = useState<AdministrationTraitement[]>([]);
  const [medecins, setMedecins] = useState<OptionItem[]>([]);
  const [patients, setPatients] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [rapportMessage, setRapportMessage] = useState('');
  const [signalement, setSignalement] = useState({ medecinId: '', patientId: '', message: '' });
  const [saving, setSaving] = useState(false);

  const [editTask, setEditTask] = useState<AdministrationTraitement | null>(null);
  const [remarqueDraft, setRemarqueDraft] = useState('');
  const [pjUrl, setPjUrl] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!infirmierId) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await administrationService.byInfirmier(infirmierId);
      setTaches(data ?? []);
    } catch {
      setError('Impossible de charger les tâches.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [infirmierId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!cliniqueId) return;
    apiGet<Array<{ id: string; nom: string; prenom: string }>>(MEDECINS.BY_CLINIQUE(cliniqueId))
      .then((rows) =>
        setMedecins(
          (rows ?? []).map((m) => ({
            id: String(m.id),
            label: `Dr ${m.prenom ?? ''} ${m.nom ?? ''}`.trim(),
          })),
        ),
      )
      .catch(() => setMedecins([]));

    apiGet<Array<{ id: string; nom: string; prenom: string }>>(PATIENTS.BY_CLINIQUE(cliniqueId))
      .then((rows) =>
        setPatients(
          (rows ?? []).map((p) => ({
            id: String(p.id),
            label: `${p.prenom ?? ''} ${p.nom ?? ''}`.trim(),
          })),
        ),
      )
      .catch(() => setPatients([]));
  }, [cliniqueId]);

  const pendingCount = useMemo(
    () => taches.filter((t) => !['REALISE', 'ADMINISTRE', 'FAIT'].includes(statutLabel(t))).length,
    [taches],
  );

  async function patchStatut(t: AdministrationTraitement, statut: string): Promise<void> {
    if (!t.id) return;
    setSaving(true);
    setError('');
    try {
      await administrationService.patchStatutExecution(t.id, {
        statut,
        remarques: (editTask?.id === t.id ? remarqueDraft : t.remarquesInfirmier) ?? '',
      });
      setSuccess('Statut mis à jour.');
      setEditTask(null);
      await load(true);
    } catch {
      setError('Mise à jour impossible.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleUrgent(t: AdministrationTraitement): Promise<void> {
    if (!t.id) return;
    try {
      await administrationService.toggleUrgent(t.id, !t.prioriteUrgente);
      await load(true);
    } catch {
      setError('Impossible de modifier la priorité.');
    }
  }

  async function enregistrerPieceJointe(t: AdministrationTraitement): Promise<void> {
    if (!t.id || !pjUrl.trim()) return;
    try {
      await administrationService.pieceJointe(t.id, pjUrl.trim());
      setSuccess('Lien enregistré.');
      setEditTask(null);
      await load(true);
    } catch {
      setError('Enregistrement du lien impossible.');
    }
  }

  async function envoyerRapport(): Promise<void> {
    if (!infirmierId || !rapportMessage.trim()) {
      setError('Saisissez un message pour le rapport.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await infirmierWorkspaceService.rapportFinJournee(infirmierId, rapportMessage.trim());
      setSuccess('Rapport transmis aux médecins.');
      setRapportMessage('');
    } catch {
      setError('Envoi du rapport impossible.');
    } finally {
      setSaving(false);
    }
  }

  async function envoyerSignalement(): Promise<void> {
    if (!infirmierId || !signalement.medecinId || !signalement.message.trim()) {
      setError('Médecin et message obligatoires.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await infirmierWorkspaceService.signalementMedecin(infirmierId, {
        medecinId: signalement.medecinId,
        patientId: signalement.patientId || undefined,
        message: signalement.message.trim(),
      });
      setSuccess('Signalement envoyé au médecin.');
      setSignalement({ medecinId: '', patientId: '', message: '' });
    } catch {
      setError('Signalement impossible.');
    } finally {
      setSaving(false);
    }
  }

  function openEdit(t: AdministrationTraitement): void {
    setEditTask(t);
    setRemarqueDraft(t.remarquesInfirmier ?? '');
    setPjUrl(t.pieceJointeUrl ?? '');
  }

  if (loading) return <LoadingOverlay />;

  return (
    <LunaScreen edges={['bottom']}>
      <ScreenHeader
        title="Tâches & soins"
        subtitle={`${pendingCount} tâche(s) en cours`}
      />

      {error ? (
        <View style={styles.bannerError}>
          <Text style={styles.bannerErrorText}>{error}</Text>
        </View>
      ) : null}
      {success ? (
        <View style={styles.bannerSuccess}>
          <Text style={styles.bannerSuccessText}>{success}</Text>
        </View>
      ) : null}

      <View style={styles.tabs}>
        {(
          [
            { key: 'taches' as TabKey, label: 'Tâches', icon: 'list-outline' },
            { key: 'rapport' as TabKey, label: 'Rapport', icon: 'document-text-outline' },
            { key: 'signalement' as TabKey, label: 'Signalement', icon: 'alert-circle-outline' },
          ] as const
        ).map(({ key, label, icon }) => (
          <Pressable
            key={key}
            style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
            onPress={() => { setTab(key); setSuccess(''); setError(''); }}
          >
            <Ionicons
              name={icon}
              size={16}
              color={tab === key ? LUNA_COLORS.textInverse : LUNA_COLORS.secondary}
            />
            <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'taches' ? (
        <FlatList
          data={taches}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void load(true); }}
              tintColor={LUNA_COLORS.secondary}
            />
          }
          ListEmptyComponent={
            <EmptyState icon="clipboard-outline" title="Aucune tâche assignée" />
          }
          renderItem={({ item }) => {
            const statut = statutLabel(item);
            const done = ['REALISE', 'ADMINISTRE', 'FAIT'].includes(statut);
            return (
              <View style={[styles.card, done && styles.cardDone]}>
                <View style={styles.cardHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardPatient}>{nomPatient(item)}</Text>
                    <Text style={styles.cardSoin}>
                      {item.nomMedicament ?? 'Soin'} ({item.typeTraitement ?? '—'})
                    </Text>
                    {item.heureAdministration ? (
                      <Text style={styles.cardMeta}>
                        Prévu : {new Date(item.heureAdministration).toLocaleString('fr-FR')}
                      </Text>
                    ) : null}
                  </View>
                  {item.prioriteUrgente ? (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>Urgent</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.statut}>Statut : {statut}</Text>
                <View style={styles.rowActions}>
                  {!done ? (
                    <>
                      <Pressable style={styles.chip} onPress={() => void patchStatut(item, 'EN_COURS')}>
                        <Text style={styles.chipText}>En cours</Text>
                      </Pressable>
                      <Pressable style={[styles.chip, styles.chipOk]} onPress={() => void patchStatut(item, 'REALISE')}>
                        <Text style={[styles.chipText, styles.chipTextLight]}>Réalisé</Text>
                      </Pressable>
                      <Pressable style={styles.chip} onPress={() => void patchStatut(item, 'NON_REALISE')}>
                        <Text style={styles.chipText}>Non réalisé</Text>
                      </Pressable>
                    </>
                  ) : null}
                  <Pressable style={styles.chipOutline} onPress={() => toggleUrgent(item)}>
                    <Text style={styles.chipText}>
                      {item.prioriteUrgente ? 'Retirer urgent' : 'Urgent'}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.chipOutline} onPress={() => openEdit(item)}>
                    <Text style={styles.chipText}>Remarque / lien</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      ) : null}

      {tab === 'rapport' ? (
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={styles.formTitle}>Rapport de fin de journée</Text>
          <Text style={styles.formHint}>Synthèse transmise aux médecins de la clinique.</Text>
          <TextInput
            style={styles.textArea}
            multiline
            value={rapportMessage}
            onChangeText={setRapportMessage}
            placeholder="Résumé des soins, incidents, points d'attention…"
            placeholderTextColor={LUNA_COLORS.textDisabled}
          />
          <Button title="Envoyer aux médecins" onPress={() => void envoyerRapport()} loading={saving} />
        </ScrollView>
      ) : null}

      {tab === 'signalement' ? (
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={styles.formTitle}>Signalement / anomalie</Text>
          <Text style={styles.label}>Médecin *</Text>
          <View style={styles.pickerWrap}>
            {medecins.map((m) => (
              <Pressable
                key={m.id}
                style={[styles.option, signalement.medecinId === m.id && styles.optionActive]}
                onPress={() => setSignalement((s) => ({ ...s, medecinId: m.id }))}
              >
                <Text style={styles.optionText}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Patient (optionnel)</Text>
          <View style={styles.pickerWrap}>
            <Pressable
              style={[styles.option, !signalement.patientId && styles.optionActive]}
              onPress={() => setSignalement((s) => ({ ...s, patientId: '' }))}
            >
              <Text style={styles.optionText}>— Aucun —</Text>
            </Pressable>
            {patients.slice(0, 12).map((p) => (
              <Pressable
                key={p.id}
                style={[styles.option, signalement.patientId === p.id && styles.optionActive]}
                onPress={() => setSignalement((s) => ({ ...s, patientId: p.id }))}
              >
                <Text style={styles.optionText}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={styles.textArea}
            multiline
            value={signalement.message}
            onChangeText={(message) => setSignalement((s) => ({ ...s, message }))}
            placeholder="Détail du signalement…"
            placeholderTextColor={LUNA_COLORS.textDisabled}
          />
          <Button title="Envoyer au médecin" onPress={() => void envoyerSignalement()} loading={saving} />
        </ScrollView>
      ) : null}

      <Modal visible={!!editTask} transparent animationType="slide" onRequestClose={() => setEditTask(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Remarque & document</Text>
            <TextInput
              style={styles.textArea}
              multiline
              value={remarqueDraft}
              onChangeText={setRemarqueDraft}
              placeholder="Remarque (douleur, état…)"
              placeholderTextColor={LUNA_COLORS.textDisabled}
            />
            <TextInput
              style={styles.input}
              value={pjUrl}
              onChangeText={setPjUrl}
              placeholder="URL photo / document"
              placeholderTextColor={LUNA_COLORS.textDisabled}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <Button title="Annuler" variant="secondary" onPress={() => setEditTask(null)} />
              <Button
                title="Enregistrer"
                onPress={() => editTask && void enregistrerPieceJointe(editTask)}
                loading={saving}
              />
            </View>
          </View>
        </View>
      </Modal>
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  bannerError: { backgroundColor: LUNA_COLORS.errorLight, padding: spacing.md, marginHorizontal: spacing.lg },
  bannerErrorText: { color: LUNA_COLORS.error, fontSize: fontSize.sm },
  bannerSuccess: { backgroundColor: LUNA_COLORS.successLight, padding: spacing.md, marginHorizontal: spacing.lg },
  bannerSuccessText: { color: LUNA_COLORS.success, fontSize: fontSize.sm },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    backgroundColor: LUNA_COLORS.surface,
  },
  tabBtnActive: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  tabLabel: { fontSize: fontSize.xs, color: LUNA_COLORS.secondary, fontWeight: fontWeight.medium },
  tabLabelActive: { color: LUNA_COLORS.textInverse },
  list: { padding: spacing.lg, paddingBottom: 80, gap: spacing.md },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.lg,
    ...(shadows.sm as object),
  },
  cardDone: { borderLeftWidth: 4, borderLeftColor: LUNA_COLORS.success },
  cardHead: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  cardPatient: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  cardSoin: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  cardMeta: { fontSize: fontSize.xs, color: LUNA_COLORS.textDisabled, marginTop: 4 },
  statut: { fontSize: fontSize.sm, color: LUNA_COLORS.tertiary, marginBottom: spacing.sm },
  urgentBadge: {
    backgroundColor: LUNA_COLORS.errorLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  urgentText: { color: LUNA_COLORS.error, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: LUNA_COLORS.infoLight,
  },
  chipOk: { backgroundColor: LUNA_COLORS.success },
  chipOutline: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
  },
  chipText: { fontSize: fontSize.xs, color: LUNA_COLORS.dark, fontWeight: fontWeight.medium },
  chipTextLight: { color: LUNA_COLORS.textInverse },
  form: { padding: spacing.lg, paddingBottom: 80, gap: spacing.md },
  formTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  formHint: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: LUNA_COLORS.textPrimary,
    textAlignVertical: 'top',
    backgroundColor: LUNA_COLORS.inputBg,
  },
  input: {
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: LUNA_COLORS.textPrimary,
    backgroundColor: LUNA_COLORS.inputBg,
  },
  pickerWrap: { gap: spacing.xs },
  option: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    backgroundColor: LUNA_COLORS.surface,
  },
  optionActive: { borderColor: LUNA_COLORS.secondary, backgroundColor: LUNA_COLORS.infoLight },
  optionText: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: LUNA_COLORS.overlay },
  modal: {
    backgroundColor: LUNA_COLORS.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  modalActions: { flexDirection: 'row', gap: spacing.md },
});
