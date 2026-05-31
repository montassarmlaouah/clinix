// app/(superadmin)/abonnements.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, StyleSheet, Text, View,
  Modal, TextInput, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { IconBrandStripe, IconPlus, IconPencil, IconTrash, IconLayersOff, IconCreditCard, IconSettings, IconBuilding, IconMedicalCross, type Icon as TablerIcon } from '@tabler/icons-react-native';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/src/api/client';
import { BILLING } from '@/src/api/endpoints';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import type { OffreAbonnement, AbonnementCliniqueSummary, StripeConfig } from '@/src/types/superadmin.types';
import { resolveTablerIcon } from '@/src/utils/iconMapper';

export default function AbonnementsScreen() {
  const [offres, setOffres]                     = useState<OffreAbonnement[]>([]);
  const [abonnementsActifs, setAbonnementsActifs] = useState<AbonnementCliniqueSummary[]>([]);
  const [abonnementsPayes, setAbonnementsPayes]   = useState<AbonnementCliniqueSummary[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* Stripe modal */
  const [stripeModalVisible, setStripeModalVisible] = useState(false);
  const [stripeConfig, setStripeConfig]   = useState<StripeConfig | null>(null);
  const [cfgMode, setCfgMode]             = useState<'TEST' | 'LIVE'>('TEST');
  const [cfgPublishable, setCfgPublishable] = useState('');
  const [cfgSecret, setCfgSecret]         = useState('');
  const [cfgWebhook, setCfgWebhook]       = useState('');
  const [savingStripe, setSavingStripe]   = useState(false);

  /* Offre modal */
  const [offreModalVisible, setOffreModalVisible] = useState(false);
  const [editingOffreId, setEditingOffreId] = useState<string | null>(null);
  const [offreForm, setOffreForm] = useState<Partial<OffreAbonnement>>({
    nom: '', description: '', prixMensuel: 0, prixAnnuel: 0, dureeMois: 12,
    categorie: 'CLINIQUE', smsGratuitsInclus: 0, nombreChambresMax: 0,
    nombrePersonnelMax: 0, nombrePatientsMax: 0, nombreRendezVousMax: 0,
    periodeEssaiJours: 0,
  });
  const [savingOffre, setSavingOffre] = useState(false);

  /* ── Load ── */
  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [offresData, actifsData, payesData] = await Promise.all([
        apiGet<OffreAbonnement[]>(BILLING.OFFRES),
        apiGet<AbonnementCliniqueSummary[]>('/api/billing/abonnements/actifs'),
        apiGet<AbonnementCliniqueSummary[]>('/api/billing/abonnements/payes'),
      ]);
      setOffres(Array.isArray(offresData) ? offresData : []);
      setAbonnementsActifs(Array.isArray(actifsData) ? actifsData : []);
      setAbonnementsPayes(Array.isArray(payesData) ? payesData : []);
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Stripe ── */
  const loadStripeConfig = async () => {
    try {
      const cfg = await apiGet<StripeConfig>(BILLING.STRIPE_CONFIG);
      setStripeConfig(cfg);
      if (cfg?.mode) setCfgMode(cfg.mode);
    } catch (error) { console.error(error); }
  };

  const openStripeModal = async () => {
    await loadStripeConfig();
    setCfgPublishable('');
    setCfgSecret('');
    setCfgWebhook('');
    setStripeModalVisible(true);
  };

  const saveStripeConfig = async () => {
    setSavingStripe(true);
    try {
      await apiPost(BILLING.STRIPE_CONFIG, {
        modeFacturation: cfgMode,
        publishableKey:  cfgPublishable || undefined,
        secretKey:       cfgSecret || undefined,
        webhookSecret:   cfgWebhook || undefined,
      });
      await loadStripeConfig();
      setStripeModalVisible(false);
      Alert.alert('Succès', 'Configuration Stripe enregistrée');
    } catch {
      Alert.alert('Erreur', 'Sauvegarde impossible');
    } finally {
      setSavingStripe(false);
    }
  };

  /* ── Offres ── */
  const toggleActif = async (offre: OffreAbonnement) => {
    try {
      await apiPatch(BILLING.UPDATE_OFFRE(offre.id), { actif: !offre.actif });
      loadAll(true);
    } catch {
      Alert.alert('Erreur', "Impossible de modifier l'offre");
    }
  };

  const deleteOffre = (offre: OffreAbonnement) => {
    Alert.alert('Supprimer', `Supprimer l'offre "${offre.nom}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(BILLING.DELETE_OFFRE(offre.id));
            loadAll(true);
          } catch {
            Alert.alert('Erreur', 'Suppression impossible');
          }
        },
      },
    ]);
  };

  const setCategorieOffre = (categorie: 'CLINIQUE' | 'CABINET_MEDICAL') => {
    if (categorie === 'CABINET_MEDICAL') {
      setOffreForm((prev) => ({ ...prev, categorie, smsGratuitsInclus: 0, nombreChambresMax: 0 }));
    } else {
      setOffreForm((prev) => ({ ...prev, categorie, nombrePatientsMax: 0, nombreRendezVousMax: 0 }));
    }
  };

  const openOffreModal = (offre?: OffreAbonnement) => {
    if (offre) {
      setEditingOffreId(offre.id);
      setOffreForm({
        nom: offre.nom, description: offre.description, prixMensuel: offre.prixMensuel,
        prixAnnuel: offre.prixAnnuel, dureeMois: offre.dureeMois, categorie: offre.categorie,
        smsGratuitsInclus: offre.smsGratuitsInclus, nombreChambresMax: offre.nombreChambresMax,
        nombrePersonnelMax: offre.nombrePersonnelMax, nombrePatientsMax: offre.nombrePatientsMax,
        nombreRendezVousMax: offre.nombreRendezVousMax, periodeEssaiJours: offre.periodeEssaiJours,
      });
    } else {
      setEditingOffreId(null);
      setOffreForm({
        nom: '', description: '', prixMensuel: 0, prixAnnuel: 0, dureeMois: 12,
        categorie: 'CLINIQUE', smsGratuitsInclus: 0, nombreChambresMax: 0,
        nombrePersonnelMax: 0, nombrePatientsMax: 0, nombreRendezVousMax: 0, periodeEssaiJours: 0,
      });
    }
    setOffreModalVisible(true);
  };

  const buildOffrePayload = (): Partial<OffreAbonnement> => {
    const isClinique = offreForm.categorie !== 'CABINET_MEDICAL';
    const duree = Math.min(36, Math.max(1, offreForm.dureeMois ?? 12));
    return {
      nom:              offreForm.nom?.trim(),
      description:      offreForm.description?.trim() || undefined,
      prixMensuel:      Math.max(0, offreForm.prixMensuel ?? 0),
      prixAnnuel:       Math.max(0, offreForm.prixAnnuel ?? 0),
      dureeMois:        duree,
      categorie:        offreForm.categorie ?? 'CLINIQUE',
      periodeEssaiJours: Math.max(0, offreForm.periodeEssaiJours ?? 0),
      smsGratuitsInclus: isClinique ? Math.max(0, offreForm.smsGratuitsInclus ?? 0) : 0,
      nombreChambresMax: isClinique ? Math.max(0, offreForm.nombreChambresMax ?? 0) : 0,
      nombrePersonnelMax: Math.max(0, offreForm.nombrePersonnelMax ?? 0),
      nombrePatientsMax:  isClinique ? 0 : Math.max(0, offreForm.nombrePatientsMax ?? 0),
      nombreRendezVousMax: isClinique ? 0 : Math.max(0, offreForm.nombreRendezVousMax ?? 0),
    };
  };

  const saveOffre = async () => {
    if (!offreForm.nom?.trim()) { Alert.alert('Erreur', 'Le nom est requis'); return; }
    setSavingOffre(true);
    try {
      const payload = buildOffrePayload();
      if (editingOffreId) {
        await apiPatch<OffreAbonnement>(BILLING.UPDATE_OFFRE(editingOffreId), payload);
      } else {
        await apiPost<OffreAbonnement>(BILLING.CREATE_OFFRE, payload);
      }
      setOffreModalVisible(false);
      loadAll(true);
      Alert.alert('Succès', editingOffreId ? 'Offre mise à jour.' : 'Offre créée.');
    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message ?? 'Sauvegarde impossible';
      Alert.alert('Erreur', msg);
    } finally {
      setSavingOffre(false);
    }
  };

  const syncStripeProduct = async (offre: OffreAbonnement) => {
    try {
      const updated = await apiPost<OffreAbonnement>(BILLING.SYNC_STRIPE(offre.id), {});
      setOffres((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      Alert.alert('Succès', 'Produit Stripe synchronisé');
    } catch {
      Alert.alert('Erreur', 'Synchronisation échouée');
    }
  };

  /* ── Helpers ── */
  const initials = (nom: string) =>
    nom.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  /* ── Loading ── */
  if (loading) {
    return (
      <LunaScreen edges={[]}>
        <LunaHeroHeader title="Abonnements" subtitle="Chargement…" showBack={false} />
        <View style={styles.center}>
          <ActivityIndicator color={LUNA_COLORS.secondary} size="large" />
        </View>
      </LunaScreen>
    );
  }

  /* ── Render ── */
  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title="Abonnements"
        subtitle={`${offres.length} offre(s)`}
        showBack={false}
        right={
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.stripeBtn} onPress={openStripeModal} activeOpacity={0.75}>
              <IconBrandStripe size={16} color={LUNA_COLORS.primary} />
              <Text style={styles.stripeBtnText}>Stripe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => openOffreModal()} activeOpacity={0.75}>
              <IconPlus size={22} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadAll(true); }}
            colors={[LUNA_COLORS.secondary]}
            tintColor={LUNA_COLORS.secondary}
          />
        }
      >
        {/* ── Stats ── */}
        <View style={styles.statsGrid}>
          <StatCard label="Total offres"         value={offres.length}                         icon="layers-outline"          color={LUNA_COLORS.secondary} />
          <StatCard label="Offres actives"        value={offres.filter((o) => o.actif).length}  icon="checkmark-circle-outline" color={LUNA_COLORS.success}   />
          <StatCard label="Abonnements actifs"    value={abonnementsActifs.length}              icon="medical-outline"         color={LUNA_COLORS.tertiary}  />
          <StatCard label="Abonnements payés"     value={abonnementsPayes.length}               icon="cash-outline"            color={LUNA_COLORS.warning}   />
        </View>

        {/* ── Offres ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Offres d'abonnement</Text>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>{offres.length}</Text>
            </View>
          </View>

          {offres.map((offre) => (
            <View key={offre.id} style={styles.offreCard}>
              {/* accent bar */}
              <View
                style={[
                  styles.offreAccent,
                  { backgroundColor: offre.categorie === 'CABINET_MEDICAL' ? LUNA_COLORS.warning : LUNA_COLORS.secondary },
                ]}
              />
              <View style={styles.offreCardInner}>
                <View style={styles.offreTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.offreNom}>{offre.nom}</Text>
                    <View style={styles.offreMeta}>
                      <View
                        style={[
                          styles.categorieBadge,
                          offre.categorie === 'CABINET_MEDICAL'
                            ? styles.badgeCabinet
                            : styles.badgeClinique,
                        ]}
                      >
                        <Text
                          style={[
                            styles.categorieBadgeText,
                            { color: offre.categorie === 'CABINET_MEDICAL' ? LUNA_COLORS.warning : LUNA_COLORS.primary },
                          ]}
                        >
                          {offre.categorie === 'CABINET_MEDICAL' ? 'Cabinet' : 'Clinique'}
                        </Text>
                      </View>
                      <Text style={styles.offrePrix}>
                        {offre.prixMensuel} DT / mois · {offre.dureeMois} mois
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => toggleActif(offre)} hitSlop={8}>
                    <View style={[styles.toggleTrack, offre.actif && styles.toggleTrackOn]}>
                      <View style={[styles.toggleThumb, offre.actif && styles.toggleThumbOn]} />
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={styles.offreLimits}>
                  {offre.categorie === 'CABINET_MEDICAL'
                    ? `${offre.nombrePatientsMax ?? 0} patients · ${offre.nombrePersonnelMax ?? 0} employés`
                    : `${offre.smsGratuitsInclus ?? 0} SMS · ${offre.nombreChambresMax ?? 0} chambres · ${offre.nombrePersonnelMax ?? 0} personnels`}
                </Text>

                <View style={styles.offreActions}>
                  <TouchableOpacity style={[styles.actionBtn, styles.actionEdit]} onPress={() => openOffreModal(offre)} activeOpacity={0.75}>
                    <IconPencil size={14} color={LUNA_COLORS.secondary} strokeWidth={2} />
                    <Text style={[styles.actionBtnText, { color: LUNA_COLORS.secondary }]}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.actionStripe]} onPress={() => syncStripeProduct(offre)} activeOpacity={0.75}>
                    <IconBrandStripe size={14} color="#635bff" strokeWidth={2} />
                    <Text style={[styles.actionBtnText, { color: '#635bff' }]}>Sync</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.actionDelete]} onPress={() => deleteOffre(offre)} activeOpacity={0.75}>
                    <IconTrash size={14} color={LUNA_COLORS.error} strokeWidth={2} />
                    <Text style={[styles.actionBtnText, { color: LUNA_COLORS.error }]}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {offres.length === 0 && (
            <View style={styles.emptyBox}>
              <IconLayersOff size={36} color={LUNA_COLORS.textDisabled} strokeWidth={1.5} />
              <Text style={styles.emptyText}>Aucune offre pour le moment</Text>
            </View>
          )}
        </View>

        {/* ── Abonnements actifs ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Abonnements actifs</Text>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>{abonnementsActifs.length}</Text>
            </View>
          </View>
          {abonnementsActifs.map((sub) => (
            <SubCard key={sub.id} sub={sub} initials={initials} showDate />
          ))}
          {abonnementsActifs.length === 0 && (
            <Text style={styles.emptyText}>Aucun abonnement actif</Text>
          )}
        </View>

        {/* ── Abonnements payés ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Abonnements payés</Text>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>{abonnementsPayes.length}</Text>
            </View>
          </View>
          {abonnementsPayes.map((sub) => (
            <SubCard key={sub.id} sub={sub} initials={initials} />
          ))}
          {abonnementsPayes.length === 0 && (
            <Text style={styles.emptyText}>Aucun abonnement payé</Text>
          )}
        </View>

      </ScrollView>

      {/* ──────────────── MODAL STRIPE ──────────────── */}
      <Modal visible={stripeModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <IconBrandStripe size={20} color="#635bff" strokeWidth={2} />
              <Text style={styles.modalTitle}>Configuration Stripe</Text>
            </View>

            <View style={styles.stripeModeRow}>
              <Text style={styles.fieldLabel}>Mode</Text>
              <View style={styles.modePillRow}>
                <TouchableOpacity
                  style={[styles.modePill, cfgMode === 'TEST' && styles.modePillActive]}
                  onPress={() => setCfgMode('TEST')}
                >
                  <Text style={[styles.modePillText, cfgMode === 'TEST' && styles.modePillTextActive]}>
                    TEST
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modePill, cfgMode === 'LIVE' && styles.modePillLiveActive]}
                  onPress={() => setCfgMode('LIVE')}
                >
                  <Text style={[styles.modePillText, cfgMode === 'LIVE' && styles.modePillTextActive]}>
                    LIVE
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Publishable Key</Text>
              <TextInput
                style={styles.input}
                placeholder="pk_test_…"
                placeholderTextColor={LUNA_COLORS.textDisabled}
                value={cfgPublishable}
                onChangeText={setCfgPublishable}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Secret Key</Text>
              <TextInput
                style={styles.input}
                placeholder="sk_test_…"
                placeholderTextColor={LUNA_COLORS.textDisabled}
                value={cfgSecret}
                onChangeText={setCfgSecret}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Webhook Secret</Text>
              <TextInput
                style={styles.input}
                placeholder="whsec_…"
                placeholderTextColor={LUNA_COLORS.textDisabled}
                value={cfgWebhook}
                onChangeText={setCfgWebhook}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setStripeModalVisible(false)}>
                <Text style={styles.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSave, savingStripe && styles.btnDisabled]}
                onPress={saveStripeConfig}
                disabled={savingStripe}
                activeOpacity={0.75}
              >
                <Text style={styles.btnSaveText}>{savingStripe ? 'Enregistrement…' : 'Enregistrer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ──────────────── MODAL OFFRE ──────────────── */}
      <Modal visible={offreModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalSheet} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editingOffreId ? 'Modifier l\'offre' : 'Nouvelle offre'}
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nom *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Starter Pro"
                placeholderTextColor={LUNA_COLORS.textDisabled}
                value={offreForm.nom}
                onChangeText={(t) => setOffreForm({ ...offreForm, nom: t })}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.input, { minHeight: 72, textAlignVertical: 'top' }]}
                placeholder="Description de l'offre…"
                placeholderTextColor={LUNA_COLORS.textDisabled}
                value={offreForm.description}
                onChangeText={(t) => setOffreForm({ ...offreForm, description: t })}
                multiline
              />
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Prix mensuel (DT)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(offreForm.prixMensuel)}
                  onChangeText={(t) => setOffreForm({ ...offreForm, prixMensuel: parseFloat(t) || 0 })}
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Prix annuel (DT)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(offreForm.prixAnnuel)}
                  onChangeText={(t) => setOffreForm({ ...offreForm, prixAnnuel: parseFloat(t) || 0 })}
                />
              </View>
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Durée (mois)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(offreForm.dureeMois)}
                  onChangeText={(t) => setOffreForm({ ...offreForm, dureeMois: parseInt(t, 10) || 12 })}
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Période essai (j)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(offreForm.periodeEssaiJours ?? 0)}
                  onChangeText={(t) => setOffreForm({ ...offreForm, periodeEssaiJours: parseInt(t, 10) || 0 })}
                />
              </View>
            </View>

            {/* Catégorie */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Catégorie</Text>
              <View style={styles.catRow}>
                <TouchableOpacity
                  style={[styles.catBtn, offreForm.categorie === 'CLINIQUE' && styles.catBtnActive]}
                  onPress={() => setCategorieOffre('CLINIQUE')}
                >
                  <IconBuilding size={16} color={offreForm.categorie === 'CLINIQUE' ? '#fff' : LUNA_COLORS.textSecondary} strokeWidth={2} />
                  <Text style={[styles.catBtnText, offreForm.categorie === 'CLINIQUE' && styles.catBtnTextActive]}>
                    Clinique
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.catBtn, offreForm.categorie === 'CABINET_MEDICAL' && styles.catBtnCabinet]}
                  onPress={() => setCategorieOffre('CABINET_MEDICAL')}
                >
                  <IconMedicalCross size={16} color={offreForm.categorie === 'CABINET_MEDICAL' ? '#fff' : LUNA_COLORS.textSecondary} strokeWidth={2} />
                  <Text style={[styles.catBtnText, offreForm.categorie === 'CABINET_MEDICAL' && styles.catBtnTextActive]}>
                    Cabinet
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Champs selon catégorie */}
            {offreForm.categorie !== 'CABINET_MEDICAL' ? (
              <View style={styles.rowFields}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>SMS gratuits</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(offreForm.smsGratuitsInclus ?? 0)}
                    onChangeText={(t) => setOffreForm({ ...offreForm, smsGratuitsInclus: parseInt(t, 10) || 0 })}
                  />
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Chambres max</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(offreForm.nombreChambresMax ?? 0)}
                    onChangeText={(t) => setOffreForm({ ...offreForm, nombreChambresMax: parseInt(t, 10) || 0 })}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.rowFields}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Patients max</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(offreForm.nombrePatientsMax ?? 0)}
                    onChangeText={(t) => setOffreForm({ ...offreForm, nombrePatientsMax: parseInt(t, 10) || 0 })}
                  />
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>RDV max / jour</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(offreForm.nombreRendezVousMax ?? 0)}
                    onChangeText={(t) => setOffreForm({ ...offreForm, nombreRendezVousMax: parseInt(t, 10) || 0 })}
                  />
                </View>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Personnel max</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(offreForm.nombrePersonnelMax ?? 0)}
                onChangeText={(t) => setOffreForm({ ...offreForm, nombrePersonnelMax: parseInt(t, 10) || 0 })}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setOffreModalVisible(false)}>
                <Text style={styles.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSave, savingOffre && styles.btnDisabled]}
                onPress={saveOffre}
                disabled={savingOffre}
                activeOpacity={0.75}
              >
                <Text style={styles.btnSaveText}>{savingOffre ? 'Enregistrement…' : 'Enregistrer'}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </Modal>
    </LunaScreen>
  );
}

/* ─── Sub-components ─── */
function StatCard({ label, value, icon, color }: any) {
  const Icon = resolveTablerIcon(icon);
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '1a' }]}>
        <Icon size={20} color={color} strokeWidth={1.8} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SubCard({ sub, initials, showDate }: any) {
  const label = sub.cliniqueNom ?? sub.medecinCabinetNom ?? 'Abonnement';
  const init = initials(label);
  const subtitle = sub.medecinCabinetNom && sub.cliniqueNom
    ? `Cabinet · ${sub.medecinCabinetNom}`
    : sub.medecinCabinetNom
      ? 'Cabinet médical'
      : 'Clinique';
  return (
    <View style={styles.subCard}>
      <View style={styles.subAvatar}>
        <Text style={styles.subAvatarText}>{init}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.subNom}>{label}</Text>
        <Text style={styles.subOffre}>{sub.offreNom}</Text>
        <Text style={styles.subType}>{subtitle}</Text>
        {showDate && (sub.datePremierPaiement || sub.dateDebut) && (
          <Text style={styles.subDate}>{sub.datePremierPaiement ?? sub.dateDebut} → {sub.dateFin}</Text>
        )}
      </View>
      <View style={styles.subMontantWrap}>
        <Text style={styles.subMontant}>{sub.montantPaye} DT</Text>
      </View>
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ✨ ScrollView — paddingBottom tab bar
  scrollContent: { paddingBottom: 80 },

  /* Header buttons */
  headerBtns: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  stripeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
  },
  stripeBtnText: { color: LUNA_COLORS.primary, fontSize: 13, fontWeight: '600' },
  // ✨ Bouton FAB — secondary pill
  addBtn: {
    width: 40, height: 40,
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.full,
    alignItems: 'center', justifyContent: 'center',
    ...(shadows.button as object),
  },

  /* Stats */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, padding: spacing.lg },
  statCard: {
    width: '47%',
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
    gap: spacing.sm, ...(shadows.sm as object),
  },
  statIconWrap: { width: 36, height: 36, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: LUNA_COLORS.textSecondary },

  /* Section */
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  // ✨ Titre de section — typography.sectionTitle
  sectionTitle: { ...typography.sectionTitle },
  sectionCount: {
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: 3,
    borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
  },
  sectionCountText: { fontSize: 12, color: LUNA_COLORS.textSecondary, fontWeight: '600' },

  /* Offre card */
  offreCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
    flexDirection: 'row', overflow: 'hidden', ...(shadows.sm as object),
  },
  offreAccent: { width: 4 },
  offreCardInner: { flex: 1, padding: spacing.lg },
  offreTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  offreNom: { fontSize: 14, fontWeight: '700', color: LUNA_COLORS.textPrimary, marginBottom: spacing.xs },
  offreMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  categorieBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  badgeClinique: { backgroundColor: LUNA_COLORS.infoLight, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle },
  badgeCabinet: { backgroundColor: LUNA_COLORS.warningLight, borderWidth: 1, borderColor: LUNA_COLORS.warningLight },
  categorieBadgeText: { fontSize: 10, fontWeight: '700' },
  offrePrix: { fontSize: 12, color: LUNA_COLORS.secondary, fontWeight: '600' },
  offreLimits: { fontSize: 11, color: LUNA_COLORS.textSecondary, marginBottom: spacing.md },

  /* Toggle */
  toggleTrack: {
    width: 40, height: 22, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(197, 220, 234, 0.6)',
    justifyContent: 'center', padding: 2,
  },
  toggleTrackOn: { backgroundColor: LUNA_COLORS.secondary },
  toggleThumb: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: LUNA_COLORS.textInverse,
    alignSelf: 'flex-start',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },

  /* Offre actions */
  offreActions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  actionBtnText: { fontSize: 11, fontWeight: '600' },
  actionEdit:   { backgroundColor: LUNA_COLORS.infoLight },
  actionStripe: { backgroundColor: 'rgba(99,91,255,0.08)' },
  actionDelete: { backgroundColor: LUNA_COLORS.errorLight },

  /* Empty */
  emptyBox: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.sm },
  emptyText: { color: LUNA_COLORS.textDisabled, fontSize: 13, textAlign: 'center', paddingVertical: spacing.sm },

  /* Sub card */
  subCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
    gap: spacing.md, ...(shadows.sm as object),
  },
  subAvatar: {
    width: 38, height: 38, borderRadius: borderRadius.md,
    backgroundColor: LUNA_COLORS.infoLight,
    alignItems: 'center', justifyContent: 'center',
  },
  subAvatarText: { fontSize: 12, fontWeight: '700', color: LUNA_COLORS.primary },
  subNom: { fontSize: 13, fontWeight: '600', color: LUNA_COLORS.textPrimary },
  subOffre: { fontSize: 11, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  subType: { fontSize: 10, color: LUNA_COLORS.textDisabled, marginTop: 1 },
  subDate: { fontSize: 10, color: LUNA_COLORS.textDisabled, marginTop: 1 },
  subMontantWrap: {
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 5,
    borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
  },
  subMontant: { fontSize: 13, fontWeight: '700', color: LUNA_COLORS.primary },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: LUNA_COLORS.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: LUNA_COLORS.surface,
    borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl, maxHeight: '90%',
    borderTopWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(197, 220, 234, 0.6)',
    alignSelf: 'center', marginBottom: spacing.xl,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  modalTitle: { fontSize: 17, fontWeight: '700', color: LUNA_COLORS.textPrimary },

  /* Stripe mode */
  stripeModeRow: { marginBottom: spacing.lg },
  modePillRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modePill: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.full, alignItems: 'center',
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
  },
  modePillActive: { backgroundColor: LUNA_COLORS.warning + '1a', borderColor: LUNA_COLORS.warning },
  modePillLiveActive: { backgroundColor: LUNA_COLORS.success + '1a', borderColor: LUNA_COLORS.success },
  modePillText: { fontSize: 13, fontWeight: '700', color: LUNA_COLORS.textSecondary },
  modePillTextActive: { color: LUNA_COLORS.textPrimary },

  /* Form */
  rowFields: { flexDirection: 'row', gap: spacing.md },
  fieldGroup: { marginBottom: spacing.md },
  fieldLabel: { ...typography.sectionTitle, marginBottom: spacing.sm, letterSpacing: 0.4 },
  // ✨ Inputs HeroUI — inputBg, borderInput, minHeight 52
  input: {
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md, padding: spacing.md,
    minHeight: 52,
    color: LUNA_COLORS.textPrimary, fontSize: 14,
    borderWidth: 1, borderColor: LUNA_COLORS.borderInput,
  },

  /* Catégorie buttons */
  catRow: { flexDirection: 'row', gap: spacing.md },
  catBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: spacing.md, borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
  },
  catBtnActive: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  catBtnCabinet: { backgroundColor: LUNA_COLORS.warning, borderColor: LUNA_COLORS.warning },
  catBtnText: { fontSize: 13, fontWeight: '600', color: LUNA_COLORS.textSecondary },
  catBtnTextActive: { color: LUNA_COLORS.textInverse },

  /* Modal actions */
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  btnCancel: {
    flex: 1, height: 48, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center',
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
  },
  btnCancelText: { fontSize: 14, fontWeight: '600', color: LUNA_COLORS.textSecondary },
  // ✨ Bouton primaire — secondary pill, hauteur 48
  btnSave: {
    flex: 2, height: 48, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center',
    backgroundColor: LUNA_COLORS.secondary,
    ...(shadows.button as object),
  },
  btnSaveText: { ...typography.button, fontSize: 14 },
  btnDisabled: { opacity: 0.55 },
});