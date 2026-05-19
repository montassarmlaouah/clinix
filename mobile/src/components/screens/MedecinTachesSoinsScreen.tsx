import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { apiGet } from '@/src/api/client';
import { PATIENTS } from '@/src/api/endpoints';
import {
  administrationService,
  type AdministrationTraitement,
  type CreateAdministrationPayload,
} from '@/src/api/services/administration.service';
import { medecinService } from '@/src/api/services/medecinService';
import { Button, EmptyState, LoadingOverlay, LunaScreen } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface OptionItem {
  id: string;
  label: string;
}

function nomPatient(row: AdministrationTraitement): string {
  const p = row.patient;
  if (!p) return '—';
  return `${p.prenom ?? ''} ${p.nom ?? ''}`.trim() || '—';
}

function nomInfirmier(row: AdministrationTraitement): string {
  const i = row.infirmier;
  if (!i) return '—';
  return `${i.prenom ?? ''} ${i.nom ?? ''}`.trim() || '—';
}

export function MedecinTachesSoinsScreen(): React.JSX.Element {
  const medecinId = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [items, setItems] = useState<AdministrationTraitement[]>([]);
  const [patients, setPatients] = useState<OptionItem[]>([]);
  const [infirmiers, setInfirmiers] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    patientId: '',
    infirmierId: '',
    typeTraitement: 'Soin / surveillance',
    nomMedicament: '',
    dosage: '',
    voieAdministration: 'PO',
    heureAdministration: '',
  });

  const load = useCallback(async () => {
    if (!medecinId) return;
    try {
      const data = await medecinService.getWorkspaceSoinsSuivi(medecinId);
      setItems((data as AdministrationTraitement[]) ?? []);
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

  useEffect(() => {
    if (!medecinId) return;
    medecinService.getWorkspaceInfirmiers(medecinId).then((rows) => {
      setInfirmiers(
        ((rows as Array<{ id: string; nom: string; prenom: string }>) ?? []).map((i) => ({
          id: String(i.id),
          label: `${i.prenom ?? ''} ${i.nom ?? ''}`.trim(),
        })),
      );
    }).catch(() => setInfirmiers([]));

    const patientsReq = cliniqueId
      ? apiGet<Array<{ id: string; nom: string; prenom: string }>>(PATIENTS.BY_CLINIQUE(cliniqueId))
      : apiGet<Array<{ id: string; nom: string; prenom: string }>>(PATIENTS.LIST);

    patientsReq
      .then((rows) =>
        setPatients(
          (rows ?? []).map((p) => ({
            id: String(p.id),
            label: `${p.prenom ?? ''} ${p.nom ?? ''}`.trim(),
          })),
        ),
      )
      .catch(() => setPatients([]));
  }, [medecinId, cliniqueId]);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) =>
      [nomPatient(r), nomInfirmier(r), r.nomMedicament, r.typeTraitement, r.dosage]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [items, searchText]);

  const stats = useMemo(() => {
    const aValider = items.filter(
      (r) => r.statutExecution === 'REALISE' && r.validationMedecin == null,
    ).length;
    const aFaire = items.filter(
      (r) => !['REALISE', 'ADMINISTRE', 'FAIT'].includes(r.statutExecution ?? ''),
    ).length;
    const traites = items.filter((r) => r.validationMedecin === true || r.validationMedecin === false).length;
    return { aValider, aFaire, traites, total: items.length };
  }, [items]);

  async function valider(row: AdministrationTraitement, valide: boolean): Promise<void> {
    if (!row.id) return;
    setSaving(true);
    setError('');
    try {
      await administrationService.validationMedecin(row.id, valide);
      setSuccess(valide ? 'Soin validé.' : 'Soin refusé.');
      await load();
    } catch {
      setError('Validation impossible.');
    } finally {
      setSaving(false);
    }
  }

  async function creerTache(): Promise<void> {
    if (!medecinId || !form.patientId || !form.infirmierId) {
      setError('Patient et infirmier sont obligatoires.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: CreateAdministrationPayload = {
        patientId: form.patientId,
        infirmierId: form.infirmierId,
        medecinDemandeurId: medecinId,
        typeTraitement: form.typeTraitement || 'Soin',
        nomMedicament: form.nomMedicament || '—',
        dosage: form.dosage || '—',
        voieAdministration: form.voieAdministration || 'PO',
        administre: false,
        heureAdministration: form.heureAdministration
          ? new Date(form.heureAdministration).toISOString()
          : new Date().toISOString(),
      };
      await administrationService.create(payload);
      setSuccess('Tâche créée et transmise à l’infirmier.');
      setShowModal(false);
      setForm({
        patientId: '',
        infirmierId: '',
        typeTraitement: 'Soin / surveillance',
        nomMedicament: '',
        dosage: '',
        voieAdministration: 'PO',
        heureAdministration: '',
      });
      await load();
    } catch {
      setError('Création impossible.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingOverlay />;

  return (
    <LunaScreen edges={['bottom']}>
      <ScreenHeader
        title="Tâches infirmiers"
        subtitle="Prescription et validation des soins"
        right={
          <Pressable style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={22} color={LUNA_COLORS.textInverse} />
          </Pressable>
        }
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.aFaire}</Text>
          <Text style={styles.statLabel}>À réaliser</Text>
        </View>
        <View style={[styles.statBox, styles.statWarn]}>
          <Text style={styles.statValue}>{stats.aValider}</Text>
          <Text style={styles.statLabel}>À valider</Text>
        </View>
        <View style={[styles.statBox, styles.statOk]}>
          <Text style={styles.statValue}>{stats.traites}</Text>
          <Text style={styles.statLabel}>Traités</Text>
        </View>
      </View>

      <TextInput
        style={styles.search}
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Rechercher patient, infirmier, soin…"
        placeholderTextColor={LUNA_COLORS.textDisabled}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item, i) => String(item.id ?? i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); void load(); }}
            tintColor={LUNA_COLORS.secondary}
          />
        }
        ListEmptyComponent={
          <EmptyState icon="clipboard-outline" title="Aucune tâche en cours" />
        }
        renderItem={({ item }) => {
          const needsValidation =
            item.statutExecution === 'REALISE' && item.validationMedecin == null;
          return (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {nomPatient(item)} — {item.nomMedicament ?? item.typeTraitement ?? 'Soin'}
              </Text>
              <Text style={styles.meta}>Infirmier : {nomInfirmier(item)}</Text>
              {item.statutExecution ? (
                <Text style={styles.meta}>Statut : {item.statutExecution}</Text>
              ) : null}
              {needsValidation ? (
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.actionBtn, styles.actionOk]}
                    onPress={() => void valider(item, true)}
                    disabled={saving}
                  >
                    <Text style={styles.actionTextLight}>Valider</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.actionDanger]}
                    onPress={() => void valider(item, false)}
                    disabled={saving}
                  >
                    <Text style={styles.actionTextLight}>Refuser</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        }}
      />

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nouvelle demande de soins</Text>

            <Text style={styles.label}>Patient *</Text>
            {patients.slice(0, 8).map((p) => (
              <Pressable
                key={p.id}
                style={[styles.option, form.patientId === p.id && styles.optionActive]}
                onPress={() => setForm((f) => ({ ...f, patientId: p.id }))}
              >
                <Text style={styles.optionText}>{p.label}</Text>
              </Pressable>
            ))}

            <Text style={styles.label}>Infirmier *</Text>
            {infirmiers.map((i) => (
              <Pressable
                key={i.id}
                style={[styles.option, form.infirmierId === i.id && styles.optionActive]}
                onPress={() => setForm((f) => ({ ...f, infirmierId: i.id }))}
              >
                <Text style={styles.optionText}>{i.label}</Text>
              </Pressable>
            ))}

            <TextInput
              style={styles.input}
              value={form.nomMedicament}
              onChangeText={(nomMedicament) => setForm((f) => ({ ...f, nomMedicament }))}
              placeholder="Médicament / acte"
              placeholderTextColor={LUNA_COLORS.textDisabled}
            />
            <TextInput
              style={styles.input}
              value={form.dosage}
              onChangeText={(dosage) => setForm((f) => ({ ...f, dosage }))}
              placeholder="Dosage"
              placeholderTextColor={LUNA_COLORS.textDisabled}
            />

            <View style={styles.modalActions}>
              <Button title="Annuler" variant="secondary" onPress={() => setShowModal(false)} />
              <Button title="Créer" onPress={() => void creerTache()} loading={saving} />
            </View>
          </View>
        </View>
      </Modal>
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { color: LUNA_COLORS.error, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  success: { color: LUNA_COLORS.success, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
  },
  statWarn: { borderLeftWidth: 3, borderLeftColor: LUNA_COLORS.warning },
  statOk: { borderLeftWidth: 3, borderLeftColor: LUNA_COLORS.success },
  statValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  statLabel: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  search: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: LUNA_COLORS.inputBg,
    color: LUNA_COLORS.textPrimary,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 80, gap: spacing.md },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    borderLeftWidth: 4,
    borderLeftColor: LUNA_COLORS.secondary,
    ...(shadows.sm as object),
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, alignItems: 'center' },
  actionOk: { backgroundColor: LUNA_COLORS.success },
  actionDanger: { backgroundColor: LUNA_COLORS.error },
  actionTextLight: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: LUNA_COLORS.overlay },
  modal: {
    backgroundColor: LUNA_COLORS.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xxl,
    maxHeight: '85%',
    gap: spacing.sm,
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest, marginBottom: spacing.sm },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest, marginTop: spacing.sm },
  option: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    marginBottom: spacing.xs,
  },
  optionActive: { borderColor: LUNA_COLORS.secondary, backgroundColor: LUNA_COLORS.infoLight },
  optionText: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: LUNA_COLORS.textPrimary,
    backgroundColor: LUNA_COLORS.inputBg,
  },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
});
