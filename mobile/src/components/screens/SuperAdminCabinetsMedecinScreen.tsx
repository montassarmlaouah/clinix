import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { medecinService } from '@/src/api/services/medecinService';
import { LunaHeroHeader, LunaScreen } from '@/src/components/common';
import type { CabinetMedecinListItem, CreerCabinetMedecinDTO } from '@/src/types/cabinet-medecin';
import { SPECIALITES_MEDICALES } from '@/src/types/personnel';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { normalizeTelephoneDigits } from '@/src/utils/telephone';

export function SuperAdminCabinetsMedecinScreen(): React.JSX.Element {
  const [medecins, setMedecins] = useState<CabinetMedecinListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cin, setCin] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [telephoneFixe, setTelephoneFixe] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [cinMessage, setCinMessage] = useState('');
  const [cinTrouve, setCinTrouve] = useState(false);
  const [cinRattacheClinique, setCinRattacheClinique] = useState(false);
  const [cinVerifying, setCinVerifying] = useState(false);
  const [specModal, setSpecModal] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await medecinService.listCabinets();
      setMedecins(Array.isArray(data) ? data : []);
    } catch {
      setMedecins([]);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = medecins.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (m.nom ?? '').toLowerCase().includes(q) ||
      (m.prenom ?? '').toLowerCase().includes(q) ||
      (m.specialite ?? '').toLowerCase().includes(q) ||
      (m.telephone ?? '').includes(q) ||
      (m.localisation ?? '').toLowerCase().includes(q)
    );
  });

  function resetCreateForm(): void {
    setCin('');
    setNom('');
    setPrenom('');
    setTelephone('');
    setTelephoneFixe('');
    setSpecialite('');
    setLocalisation('');
    setCinMessage('');
    setCinTrouve(false);
    setCinRattacheClinique(false);
  }

  async function onCinBlur(): Promise<void> {
    const c = cin.trim();
    if (c.length < 3) {
      setCinMessage('');
      setCinTrouve(false);
      setCinRattacheClinique(false);
      return;
    }
    setCinVerifying(true);
    try {
      const res = await medecinService.verifierCinCabinet(c, telephone);
      setCinMessage(res.message ?? '');
      setCinTrouve(!!res.trouve);
      setCinRattacheClinique(!!res.rattacheClinique);
      if (res.trouve && res.nom) setNom(res.nom);
      if (res.trouve && res.prenom) setPrenom(res.prenom);
      if (res.rattacheClinique && res.telephone) {
        setTelephone(normalizeTelephoneDigits(res.telephone).slice(-8));
      }
    } catch {
      setCinMessage('');
    } finally {
      setCinVerifying(false);
    }
  }

  function canSubmit(): boolean {
    const mobile = normalizeTelephoneDigits(telephone);
    const fix = normalizeTelephoneDigits(telephoneFixe);
    const fixOk = fix.length === 0 || fix.length === 8;
    return (
      cin.trim().length >= 3 &&
      nom.trim().length > 0 &&
      prenom.trim().length > 0 &&
      specialite.trim().length > 0 &&
      mobile.length === 8 &&
      fixOk
    );
  }

  async function submitCreate(): Promise<void> {
    if (!canSubmit()) {
      Alert.alert('Formulaire incomplet', 'Vérifiez le CIN, l\'identité et le mobile (8 chiffres).');
      return;
    }
    const mobile = normalizeTelephoneDigits(telephone);
    const fix = normalizeTelephoneDigits(telephoneFixe);
    const payload: CreerCabinetMedecinDTO = {
      nom: nom.trim(),
      prenom: prenom.trim(),
      telephone: mobile,
      specialite: specialite.trim(),
      numeroPieceIdentite: cin.trim().toUpperCase(),
      localisation: localisation.trim() || undefined,
      telephoneFixe: fix.length === 8 ? fix : undefined,
    };
    setSaving(true);
    try {
      const res = await medecinService.creerCabinet(payload);
      let msg: string;
      if (res.compteExistantRattache) {
        msg = res.smsDetail ?? 'Compte existant : même login (aucun SMS).';
      } else if (res.smsEnvoye) {
        msg = 'Cabinet créé. Identifiants envoyés par SMS.';
      } else {
        msg = res.smsDetail ?? 'Cabinet créé. Configurez TunisieSMS pour l\'envoi SMS.';
      }
      Alert.alert('Succès', msg);
      setCreateOpen(false);
      resetCreateForm();
      void load(true);
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Erreur', err?.message ?? 'Création impossible');
    } finally {
      setSaving(false);
    }
  }

  function confirmDesactiver(med: CabinetMedecinListItem): void {
    Alert.alert('Désactiver', `Désactiver le cabinet Dr. ${med.prenom} ${med.nom} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Désactiver',
        style: 'destructive',
        onPress: async () => {
          try {
            await medecinService.supprimerCabinet(med.id);
            void load(true);
          } catch {
            Alert.alert('Erreur', 'Désactivation impossible');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <LunaScreen edges={[]}>
        <LunaHeroHeader title="Cabinets médecins" subtitle="Chargement…" showBack={false} />
        <View style={styles.center}>
          <ActivityIndicator color={LUNA_COLORS.secondary} size="large" />
        </View>
      </LunaScreen>
    );
  }

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title="Cabinets médecins"
        subtitle={`${medecins.length} cabinet(s)`}
        showBack={false}
        right={
          <TouchableOpacity
            style={styles.fabHeader}
            onPress={() => {
              resetCreateForm();
              setCreateOpen(true);
            }}
            accessibilityLabel="Nouveau cabinet"
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        }
      />

      <View style={styles.topBar}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={LUNA_COLORS.textDisabled} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nom, spécialité, téléphone…"
            placeholderTextColor={LUNA_COLORS.textDisabled}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            colors={[LUNA_COLORS.secondary]}
            tintColor={LUNA_COLORS.secondary}
          />
        }
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="business-outline" size={40} color={LUNA_COLORS.textDisabled} />
            <Text style={styles.emptyText}>
              {search ? 'Aucun résultat' : 'Aucun cabinet — appuyez sur + pour en créer un'}
            </Text>
          </View>
        ) : (
          filtered.map((item) => {
            const initials = `${item.prenom?.[0] ?? ''}${item.nom?.[0] ?? ''}`.toUpperCase();
            const actif = item.actif !== false;
            return (
              <View key={item.id} style={[styles.card, !actif && styles.cardInactive]}>
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, !actif && styles.avatarInactive]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nom}>
                      Dr. {item.prenom} {item.nom}
                    </Text>
                    {item.specialite ? (
                      <Text style={styles.infoText}>{item.specialite}</Text>
                    ) : null}
                    {item.clinique?.nom ? (
                      <Text style={styles.cliniqueLine}>
                        Clinique : {item.clinique.nom} (même login)
                      </Text>
                    ) : null}
                    {item.localisation ? (
                      <Text style={styles.infoText}>{item.localisation}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.badge, actif ? styles.badgeActif : styles.badgeInactif]}>
                    <Text style={[styles.badgeText, { color: actif ? LUNA_COLORS.success : LUNA_COLORS.error }]}>
                      {actif ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>
                </View>
                {actif ? (
                  <TouchableOpacity style={styles.desactiverBtn} onPress={() => confirmDesactiver(item)}>
                    <Ionicons name="person-remove-outline" size={15} color={LUNA_COLORS.error} />
                    <Text style={styles.desactiverBtnText}>Désactiver</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={createOpen} animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouveau cabinet médecin</Text>
            <Pressable onPress={() => setCreateOpen(false)} hitSlop={12}>
              <Ionicons name="close" size={24} color={LUNA_COLORS.textPrimary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionLabel}>CIN</Text>
            <TextInput
              style={styles.input}
              value={cin}
              onChangeText={setCin}
              onBlur={() => void onCinBlur()}
              placeholder="Numéro CIN"
              autoCapitalize="characters"
              placeholderTextColor={LUNA_COLORS.textDisabled}
            />
            <Text style={styles.hint}>
              CIN connu (clinique ou cabinet) → même login, pas de SMS. Sinon → création + SMS.
            </Text>
            {cinVerifying ? (
              <Text style={styles.cinInfo}>Vérification du CIN…</Text>
            ) : null}
            {cinMessage ? (
              <View style={[styles.cinBanner, cinTrouve ? styles.cinBannerInfo : styles.cinBannerNew]}>
                <Text style={styles.cinBannerText}>{cinMessage}</Text>
              </View>
            ) : null}

            <Text style={styles.sectionLabel}>Identité</Text>
            <TextInput
              style={styles.input}
              value={nom}
              onChangeText={setNom}
              placeholder="Nom"
              placeholderTextColor={LUNA_COLORS.textDisabled}
            />
            <TextInput
              style={styles.input}
              value={prenom}
              onChangeText={setPrenom}
              placeholder="Prénom"
              placeholderTextColor={LUNA_COLORS.textDisabled}
            />
            <Pressable style={styles.input} onPress={() => setSpecModal(true)}>
              <Text style={specialite ? styles.inputValue : styles.inputPlaceholder}>
                {specialite || 'Spécialité *'}
              </Text>
            </Pressable>
            <TextInput
              style={[styles.input, cinRattacheClinique && styles.inputReadonly]}
              value={telephone}
              onChangeText={setTelephone}
              placeholder="Mobile (8 chiffres)"
              keyboardType="phone-pad"
              maxLength={8}
              editable={!cinRattacheClinique}
              placeholderTextColor={LUNA_COLORS.textDisabled}
            />
            <TextInput
              style={styles.input}
              value={telephoneFixe}
              onChangeText={setTelephoneFixe}
              placeholder="Fixe (optionnel)"
              keyboardType="phone-pad"
              maxLength={8}
              placeholderTextColor={LUNA_COLORS.textDisabled}
            />
            <TextInput
              style={styles.input}
              value={localisation}
              onChangeText={setLocalisation}
              placeholder="Localisation cabinet"
              placeholderTextColor={LUNA_COLORS.textDisabled}
            />

            <TouchableOpacity
              style={[styles.submitBtn, (!canSubmit() || saving) && styles.submitDisabled]}
              disabled={!canSubmit() || saving}
              onPress={() => void submitCreate()}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Créer</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={specModal} transparent animationType="fade">
        <Pressable style={styles.specOverlay} onPress={() => setSpecModal(false)}>
          <View style={styles.specSheet}>
            <ScrollView>
              {SPECIALITES_MEDICALES.map((s) => (
                <Pressable
                  key={s}
                  style={styles.specRow}
                  onPress={() => {
                    setSpecialite(s);
                    setSpecModal(false);
                  }}
                >
                  <Text style={styles.specRowText}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fabHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    backgroundColor: LUNA_COLORS.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 220, 234, 0.6)',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
  },
  searchInput: { flex: 1, fontSize: 14, color: LUNA_COLORS.textPrimary, padding: 0 },
  list: { padding: spacing.lg, paddingBottom: 88 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  cardInactive: { opacity: 0.65 },
  cardTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.md,
    backgroundColor: LUNA_COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInactive: { backgroundColor: LUNA_COLORS.surfaceLight },
  avatarText: { fontSize: 15, fontWeight: '700', color: LUNA_COLORS.primary },
  nom: { fontSize: 14, fontWeight: '700', color: LUNA_COLORS.textPrimary },
  infoText: { fontSize: 12, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  cliniqueLine: { fontSize: 12, color: LUNA_COLORS.tertiary, marginTop: 4, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  badgeActif: { backgroundColor: LUNA_COLORS.successLight },
  badgeInactif: { backgroundColor: LUNA_COLORS.errorLight },
  badgeText: { fontSize: 10, fontWeight: '700' },
  desactiverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
    height: 44,
    backgroundColor: LUNA_COLORS.errorLight,
    borderRadius: borderRadius.full,
  },
  desactiverBtnText: { color: LUNA_COLORS.error, fontWeight: '700', fontSize: 13 },
  emptyBox: { alignItems: 'center', paddingTop: 48, gap: spacing.md },
  emptyText: { color: LUNA_COLORS.textDisabled, fontSize: 14, textAlign: 'center' },
  modalRoot: { flex: 1, backgroundColor: LUNA_COLORS.surface },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.borderSubtle,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: LUNA_COLORS.textPrimary },
  modalBody: { padding: spacing.lg, paddingBottom: 40 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: LUNA_COLORS.dark, marginBottom: spacing.sm, marginTop: spacing.md },
  input: {
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    marginBottom: spacing.sm,
    fontSize: 15,
    color: LUNA_COLORS.textPrimary,
    justifyContent: 'center',
  },
  inputReadonly: { opacity: 0.75, backgroundColor: LUNA_COLORS.surfaceLight },
  inputValue: { fontSize: 15, color: LUNA_COLORS.textPrimary },
  inputPlaceholder: { fontSize: 15, color: LUNA_COLORS.textDisabled },
  hint: { fontSize: 12, color: LUNA_COLORS.textSecondary, marginBottom: spacing.sm },
  cinInfo: { fontSize: 12, color: LUNA_COLORS.secondary, marginBottom: spacing.sm },
  cinBanner: { padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md },
  cinBannerInfo: { backgroundColor: LUNA_COLORS.infoLight },
  cinBannerNew: { backgroundColor: LUNA_COLORS.successLight },
  cinBannerText: { fontSize: 13, color: LUNA_COLORS.textPrimary },
  submitBtn: {
    marginTop: spacing.lg,
    backgroundColor: LUNA_COLORS.primary,
    borderRadius: borderRadius.full,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  specOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  specSheet: { backgroundColor: LUNA_COLORS.surface, maxHeight: '50%', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  specRow: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.borderSubtle },
  specRowText: { fontSize: 15, color: LUNA_COLORS.textPrimary },
});
