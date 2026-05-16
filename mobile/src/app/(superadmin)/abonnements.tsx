// app/(superadmin)/abonnements.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, View,
  Modal, TextInput, ScrollView, TouchableOpacity, Switch
} from 'react-native';
import { LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { Ionicons } from '@expo/vector-icons';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/src/api/client';
import { BILLING } from '@/src/api/endpoints';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';
import type { OffreAbonnement, AbonnementCliniqueSummary, StripeConfig } from '@/src/types/superadmin.types';

export default function AbonnementsScreen() {
  // Offres
  const [offres, setOffres] = useState<OffreAbonnement[]>([]);
  // Abonnements super admin
  const [abonnementsActifs, setAbonnementsActifs] = useState<AbonnementCliniqueSummary[]>([]);
  const [abonnementsPayes, setAbonnementsPayes] = useState<AbonnementCliniqueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modale Stripe
  const [stripeModalVisible, setStripeModalVisible] = useState(false);
  const [stripeConfig, setStripeConfig] = useState<StripeConfig | null>(null);
  const [cfgMode, setCfgMode] = useState<'TEST' | 'LIVE'>('TEST');
  const [cfgPublishable, setCfgPublishable] = useState('');
  const [cfgSecret, setCfgSecret] = useState('');
  const [cfgWebhook, setCfgWebhook] = useState('');
  const [savingStripe, setSavingStripe] = useState(false);

  // Modale Offre (création/modification)
  const [offreModalVisible, setOffreModalVisible] = useState(false);
  const [editingOffreId, setEditingOffreId] = useState<string | null>(null);
  const [offreForm, setOffreForm] = useState<Partial<OffreAbonnement>>({
    nom: '', description: '', prixMensuel: 0, prixAnnuel: 0, dureeMois: 12,
    categorie: 'CLINIQUE', smsGratuitsInclus: 0, nombreChambresMax: 0,
    nombrePersonnelMax: 0, nombrePatientsMax: 0, nombreRendezVousMax: 0,
    periodeEssaiJours: 0
  });
  const [savingOffre, setSavingOffre] = useState(false);

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [offresData, actifsData, payesData] = await Promise.all([
        apiGet<OffreAbonnement[]>(BILLING.OFFRES),
        apiGet<AbonnementCliniqueSummary[]>('/api/billing/abonnements/actifs'),
        apiGet<AbonnementCliniqueSummary[]>('/api/billing/abonnements/payes')
      ]);
      setOffres(Array.isArray(offresData) ? offresData : []);
      setAbonnementsActifs(Array.isArray(actifsData) ? actifsData : []);
      setAbonnementsPayes(Array.isArray(payesData) ? payesData : []);
    } catch (error) { console.error(error); } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadStripeConfig = async () => {
    try {
      const cfg = await apiGet<StripeConfig>(BILLING.STRIPE_CONFIG);
      setStripeConfig(cfg);
      if (cfg?.mode) setCfgMode(cfg.mode);
    } catch (error) { console.error(error); }
  };

  // Gestion des offres
  const toggleActif = async (offre: OffreAbonnement) => {
    try {
      await apiPatch(BILLING.UPDATE_OFFRE(offre.id), { actif: !offre.actif });
      loadAll(true);
    } catch (error) { Alert.alert('Erreur', 'Impossible de modifier l\'offre'); }
  };

  const deleteOffre = (offre: OffreAbonnement) => {
    Alert.alert('Supprimer', `Supprimer l'offre "${offre.nom}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await apiDelete(BILLING.DELETE_OFFRE(offre.id));
          loadAll(true);
        } catch { Alert.alert('Erreur', 'Suppression impossible'); }
      }}
    ]);
  };

  const setCategorieOffre = (categorie: 'CLINIQUE' | 'CABINET_MEDICAL') => {
    if (categorie === 'CABINET_MEDICAL') {
      setOffreForm((prev) => ({
        ...prev,
        categorie,
        smsGratuitsInclus: 0,
        nombreChambresMax: 0,
      }));
    } else {
      setOffreForm((prev) => ({
        ...prev,
        categorie,
        nombrePatientsMax: 0,
        nombreRendezVousMax: 0,
      }));
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
        nombreRendezVousMax: offre.nombreRendezVousMax, periodeEssaiJours: offre.periodeEssaiJours
      });
    } else {
      setEditingOffreId(null);
      setOffreForm({
        nom: '', description: '', prixMensuel: 0, prixAnnuel: 0, dureeMois: 12,
        categorie: 'CLINIQUE', smsGratuitsInclus: 0, nombreChambresMax: 0,
        nombrePersonnelMax: 0, nombrePatientsMax: 0, nombreRendezVousMax: 0,
        periodeEssaiJours: 0
      });
    }
    setOffreModalVisible(true);
  };

  const buildOffrePayload = (): Partial<OffreAbonnement> => {
    const isClinique = offreForm.categorie !== 'CABINET_MEDICAL';
    const duree = Math.min(36, Math.max(1, offreForm.dureeMois ?? 12));
    return {
      nom: offreForm.nom?.trim(),
      description: offreForm.description?.trim() || undefined,
      prixMensuel: Math.max(0, offreForm.prixMensuel ?? 0),
      prixAnnuel: Math.max(0, offreForm.prixAnnuel ?? 0),
      dureeMois: duree,
      categorie: offreForm.categorie ?? 'CLINIQUE',
      periodeEssaiJours: Math.max(0, offreForm.periodeEssaiJours ?? 0),
      smsGratuitsInclus: isClinique ? Math.max(0, offreForm.smsGratuitsInclus ?? 0) : 0,
      nombreChambresMax: isClinique ? Math.max(0, offreForm.nombreChambresMax ?? 0) : 0,
      nombrePersonnelMax: Math.max(0, offreForm.nombrePersonnelMax ?? 0),
      nombrePatientsMax: isClinique ? 0 : Math.max(0, offreForm.nombrePatientsMax ?? 0),
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
    } finally { setSavingOffre(false); }
  };

  const syncStripeProduct = async (offre: OffreAbonnement) => {
    try {
      const updated = await apiPost<OffreAbonnement>(BILLING.SYNC_STRIPE(offre.id), {});
      setOffres(prev => prev.map(o => o.id === updated.id ? updated : o));
      Alert.alert('Succès', 'Produit Stripe synchronisé');
    } catch { Alert.alert('Erreur', 'Synchronisation échouée'); }
  };

  // Stripe config
  const saveStripeConfig = async () => {
    setSavingStripe(true);
    try {
      await apiPost(BILLING.STRIPE_CONFIG, {
        modeFacturation: cfgMode,
        publishableKey: cfgPublishable || undefined,
        secretKey: cfgSecret || undefined,
        webhookSecret: cfgWebhook || undefined,
      });
      await loadStripeConfig();
      setStripeModalVisible(false);
      Alert.alert('Succès', 'Configuration Stripe enregistrée');
    } catch { Alert.alert('Erreur', 'Sauvegarde impossible'); } finally { setSavingStripe(false); }
  };

  const openStripeModal = async () => {
    await loadStripeConfig();
    setCfgPublishable('');
    setCfgSecret('');
    setCfgWebhook('');
    setStripeModalVisible(true);
  };

  if (loading) {
    return (
      <LunaScreen edges={[]}>
        <LunaHeroHeader title="Abonnements" subtitle="Chargement…" showBack={false} />
        <View style={styles.center}>
        <ActivityIndicator color={LUNA_COLORS.primary} size="large" />
        </View>
      </LunaScreen>
    );
  }

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title="Abonnements"
        subtitle={`${offres.length} offre(s)`}
        showBack={false}
        right={
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerBtn} onPress={openStripeModal}>
              <Ionicons name="logo-stripe" size={20} color="#fff" />
              <Text style={styles.headerBtnText}>Stripe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerBtn, styles.primaryBtn]} onPress={() => openOffreModal()}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        }
      />
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(true); }} />}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Total offres" value={offres.length} icon="layers-outline" />
          <StatCard label="Offres actives" value={offres.filter(o => o.actif).length} icon="checkmark-circle-outline" />
          <StatCard label="Abonnements actifs" value={abonnementsActifs.length} icon="medical-outline" />
          <StatCard label="Abonnements payés" value={abonnementsPayes.length} icon="cash-outline" />
        </View>

        {/* Tableau des offres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offres d'abonnement</Text>
          {offres.map(offre => (
            <View key={offre.id} style={styles.offreCard}>
              <View style={styles.offreHeader}>
                <Text style={styles.offreNom}>{offre.nom}</Text>
                <TouchableOpacity onPress={() => toggleActif(offre)}>
                  <Ionicons name={offre.actif ? "toggle" : "toggle-outline"} size={28} color={offre.actif ? LUNA_COLORS.primary : '#aaa'} />
                </TouchableOpacity>
              </View>
              <Text style={styles.offrePrix}>{offre.prixMensuel} DT/mois · {offre.dureeMois} mois</Text>
              <Text style={styles.offreLimits}>
                {offre.categorie === 'CABINET_MEDICAL'
                  ? `${offre.nombrePatientsMax ?? 0} patients · ${offre.nombrePersonnelMax ?? 0} employés`
                  : `${offre.smsGratuitsInclus ?? 0} SMS · ${offre.nombreChambresMax ?? 0} chambres · ${offre.nombrePersonnelMax ?? 0} personnels`}
              </Text>
              <View style={styles.offreActions}>
                <TouchableOpacity onPress={() => openOffreModal(offre)}><Ionicons name="pencil" size={20} color={LUNA_COLORS.primary} /></TouchableOpacity>
                <TouchableOpacity onPress={() => syncStripeProduct(offre)}><Ionicons name="logo-stripe" size={20} color={LUNA_COLORS.secondary} /></TouchableOpacity>
                <TouchableOpacity onPress={() => deleteOffre(offre)}><Ionicons name="trash" size={20} color={LUNA_COLORS.error} /></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Abonnements actifs (cliniques) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abonnements actifs (cliniques)</Text>
          {abonnementsActifs.map(sub => (
            <View key={sub.id} style={styles.subCard}>
              <Text style={styles.subClinique}>{sub.cliniqueNom}</Text>
              <Text style={styles.subOffre}>{sub.offreNom} - {sub.montantPaye} DT</Text>
              <Text style={styles.subDate}>{sub.dateDebut} → {sub.dateFin}</Text>
            </View>
          ))}
        </View>

        {/* Abonnements payés */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abonnements payés</Text>
          {abonnementsPayes.map(sub => (
            <View key={sub.id} style={styles.subCard}>
              <Text style={styles.subClinique}>{sub.cliniqueNom}</Text>
              <Text style={styles.subOffre}>{sub.offreNom} - {sub.montantPaye} DT</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal Stripe */}
      <Modal visible={stripeModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configuration Stripe</Text>
            <View style={styles.modalField}>
              <Text>Mode</Text>
              <Switch value={cfgMode === 'TEST'} onValueChange={val => setCfgMode(val ? 'TEST' : 'LIVE')} />
            </View>
            <TextInput style={styles.input} placeholder="Publishable Key" value={cfgPublishable} onChangeText={setCfgPublishable} />
            <TextInput style={styles.input} placeholder="Secret Key" secureTextEntry value={cfgSecret} onChangeText={setCfgSecret} />
            <TextInput style={styles.input} placeholder="Webhook Secret" secureTextEntry value={cfgWebhook} onChangeText={setCfgWebhook} />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setStripeModalVisible(false)}><Text>Annuler</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveStripeConfig} disabled={savingStripe}><Text style={styles.saveBtn}>{savingStripe ? '...' : 'Enregistrer'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Offre (simplifiée, adapter selon besoins) */}
      <Modal visible={offreModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingOffreId ? 'Modifier offre' : 'Nouvelle offre'}</Text>
            <TextInput style={styles.input} placeholder="Nom" value={offreForm.nom} onChangeText={t => setOffreForm({...offreForm, nom: t})} />
            <TextInput style={styles.input} placeholder="Description" value={offreForm.description} onChangeText={t => setOffreForm({...offreForm, description: t})} />
            <TextInput style={styles.input} placeholder="Prix mensuel" keyboardType="numeric" value={String(offreForm.prixMensuel)} onChangeText={t => setOffreForm({...offreForm, prixMensuel: parseFloat(t) || 0})} />
            <TextInput style={styles.input} placeholder="Prix annuel" keyboardType="numeric" value={String(offreForm.prixAnnuel)} onChangeText={t => setOffreForm({...offreForm, prixAnnuel: parseFloat(t) || 0})} />
            <TextInput style={styles.input} placeholder="Durée (mois)" keyboardType="numeric" value={String(offreForm.dureeMois)} onChangeText={t => setOffreForm({...offreForm, dureeMois: parseInt(t, 10) || 12})} />
            <Text style={styles.fieldLabel}>Catégorie</Text>
            <View style={styles.catRow}>
              <TouchableOpacity
                style={[styles.catBtn, offreForm.categorie === 'CLINIQUE' && styles.catBtnActive]}
                onPress={() => setCategorieOffre('CLINIQUE')}
              >
                <Text style={styles.catBtnText}>Clinique</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.catBtn, offreForm.categorie === 'CABINET_MEDICAL' && styles.catBtnActive]}
                onPress={() => setCategorieOffre('CABINET_MEDICAL')}
              >
                <Text style={styles.catBtnText}>Cabinet</Text>
              </TouchableOpacity>
            </View>
            {offreForm.categorie !== 'CABINET_MEDICAL' ? (
              <>
                <TextInput style={styles.input} placeholder="SMS gratuits inclus (quota)" keyboardType="numeric" value={String(offreForm.smsGratuitsInclus ?? 0)} onChangeText={t => setOffreForm({ ...offreForm, smsGratuitsInclus: parseInt(t, 10) || 0 })} />
                <TextInput style={styles.input} placeholder="Chambres max" keyboardType="numeric" value={String(offreForm.nombreChambresMax ?? 0)} onChangeText={t => setOffreForm({ ...offreForm, nombreChambresMax: parseInt(t, 10) || 0 })} />
              </>
            ) : (
              <>
                <TextInput style={styles.input} placeholder="Patients max" keyboardType="numeric" value={String(offreForm.nombrePatientsMax ?? 0)} onChangeText={t => setOffreForm({ ...offreForm, nombrePatientsMax: parseInt(t, 10) || 0 })} />
                <TextInput style={styles.input} placeholder="RDV max" keyboardType="numeric" value={String(offreForm.nombreRendezVousMax ?? 0)} onChangeText={t => setOffreForm({ ...offreForm, nombreRendezVousMax: parseInt(t, 10) || 0 })} />
              </>
            )}
            <TextInput style={styles.input} placeholder="Personnel max" keyboardType="numeric" value={String(offreForm.nombrePersonnelMax ?? 0)} onChangeText={t => setOffreForm({ ...offreForm, nombrePersonnelMax: parseInt(t, 10) || 0 })} />
            <TextInput style={styles.input} placeholder="Période essai (jours)" keyboardType="numeric" value={String(offreForm.periodeEssaiJours ?? 0)} onChangeText={t => setOffreForm({ ...offreForm, periodeEssaiJours: parseInt(t, 10) || 0 })} />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setOffreModalVisible(false)}><Text>Annuler</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveOffre} disabled={savingOffre}><Text style={styles.saveBtn}>{savingOffre ? '...' : 'Enregistrer'}</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </LunaScreen>
  );
}

// Composants statiques
function StatCard({ label, value, icon }: any) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color={LUNA_COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LUNA_COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: LUNA_COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#fff' },
  headerButtons: { flexDirection: 'row', gap: 8 },
  headerBtn: { flexDirection: 'row', backgroundColor: LUNA_COLORS.surface, padding: 8, borderRadius: borderRadius.md, alignItems: 'center', gap: 4 },
  primaryBtn: { backgroundColor: LUNA_COLORS.primary },
  headerBtnText: { color: '#fff', fontSize: fontSize.sm },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: 12, marginBottom: spacing.lg },
  statCard: { backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', width: '45%' },
  statValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#fff' },
  statLabel: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  section: { marginBottom: spacing.lg, paddingHorizontal: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#fff', marginBottom: spacing.md },
  offreCard: { backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  offreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  offreNom: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#fff' },
  offrePrix: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginVertical: 4 },
  offreLimits: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginBottom: 4 },
  fieldLabel: { color: LUNA_COLORS.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs },
  catRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  catBtn: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: LUNA_COLORS.background, alignItems: 'center' },
  catBtnActive: { backgroundColor: LUNA_COLORS.primary },
  catBtnText: { color: '#fff', fontWeight: fontWeight.medium },
  offreActions: { flexDirection: 'row', gap: 16, marginTop: spacing.sm },
  subCard: { backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  subClinique: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#fff' },
  subOffre: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  subDate: { fontSize: fontSize.xs, color: '#aaa', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg, padding: spacing.lg, maxHeight: '80%' },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#fff', marginBottom: spacing.md },
  modalField: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  input: { backgroundColor: LUNA_COLORS.background, borderRadius: borderRadius.md, padding: spacing.sm, color: '#fff', marginBottom: spacing.md },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  saveBtn: { color: LUNA_COLORS.primary, fontWeight: fontWeight.bold },
});