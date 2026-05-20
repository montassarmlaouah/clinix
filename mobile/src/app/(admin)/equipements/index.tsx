// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert, FlatList, Modal, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/src/api/client';
import { Badge, EmptyState, LunaHeroHeader, LunaStatCard, LunaSuccessModal } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

type Statut = 'DISPONIBLE' | 'EN_PANNE' | 'EN_MAINTENANCE' | 'UTILISE';
type Categorie = 'LITS_MOBILIER' | 'DIAGNOSTIC' | 'CHIRURGIE' | 'MONITORING' | 'IMAGERIE' | 'LABORATOIRE' | 'AUTRE';

interface Equipement {
  id: number; nom: string; code?: string; categorie?: Categorie;
  statut?: Statut; quantite?: number; notes?: string;
  chambre?: { id: number; numero: string };
}

const CATS: Categorie[] = ['LITS_MOBILIER', 'DIAGNOSTIC', 'CHIRURGIE', 'MONITORING', 'IMAGERIE', 'LABORATOIRE', 'AUTRE'];
const CAT_LABELS: Record<string, string> = {
  LITS_MOBILIER: 'Lits & Mobilier', DIAGNOSTIC: 'Diagnostic', CHIRURGIE: 'Chirurgie',
  MONITORING: 'Monitoring', IMAGERIE: 'Imagerie', LABORATOIRE: 'Laboratoire', AUTRE: 'Autre',
};

const STATUT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  DISPONIBLE:    { label: 'Disponible',  color: LUNA_COLORS.success,  bg: LUNA_COLORS.successLight },
  EN_PANNE:      { label: 'En panne',    color: LUNA_COLORS.error,    bg: LUNA_COLORS.errorLight },
  EN_MAINTENANCE:{ label: 'Maintenance', color: '#9C27B0',            bg: '#F3E5F5' },
  UTILISE:       { label: 'Utilisé',     color: LUNA_COLORS.warning,  bg: LUNA_COLORS.warningLight },
};

function genCode() { return 'EQ-' + Math.random().toString(36).substring(2, 10).toUpperCase(); }

export default function EquipementsScreen() {
  const { cliniqueId } = useAuthStore();
  const [list, setList]           = useState<Equipement[]>([]);
  const [chambres, setChambres]   = useState<{ id: number; numero: string }[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery]         = useState('');
  const [filterCat, setFilterCat] = useState<Categorie | 'TOUTES'>('TOUTES');
  const [selected, setSelected]   = useState<Equipement | null>(null);
  const [modal, setModal]         = useState<'none' | 'detail' | 'add' | 'delete'>('none');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);

  // form add
  const [fNom, setFNom]     = useState('');
  const [fCode, setFCode]   = useState(genCode());
  const [fCat, setFCat]     = useState<Categorie>('AUTRE');
  const [fQte, setFQte]     = useState('1');
  const [fNotes, setFNotes] = useState('');
  const [fErr, setFErr]     = useState('');

  const load = useCallback(async (silent = false) => {
    if (!cliniqueId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const [eq, ch] = await Promise.all([
        apiGet(`/api/equipements/clinique/${cliniqueId}`).catch(() => []),
        apiGet(`/api/chambres/clinique/${cliniqueId}`).catch(() => []),
      ]);
      setList(Array.isArray(eq) ? eq : []);
      setChambres(Array.isArray(ch) ? ch : []);
    } catch { setList([]); } finally { setLoading(false); setRefreshing(false); }
  }, [cliniqueId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const filtered = useMemo(() => {
    let r = list;
    if (filterCat !== 'TOUTES') r = r.filter(e => e.categorie === filterCat);
    const q = query.toLowerCase();
    if (q) r = r.filter(e => e.nom.toLowerCase().includes(q) || (e.code ?? '').toLowerCase().includes(q));
    return r;
  }, [list, filterCat, query]);

  const stats = useMemo(() => ({
    total: list.length,
    pannes: list.filter(e => e.statut === 'EN_PANNE').length,
    maint:  list.filter(e => e.statut === 'EN_MAINTENANCE').length,
    dispo:  list.filter(e => e.statut === 'DISPONIBLE').length,
  }), [list]);

  async function handleAdd() {
    if (!fNom.trim()) { setFErr('Nom requis.'); return; }
    setSubmitting(true); setFErr('');
    try {
      await apiPost('/api/equipements', { nom: fNom.trim(), code: fCode || genCode(), categorie: fCat, quantite: parseInt(fQte) || 1, notes: fNotes || undefined, cliniqueId: Number(cliniqueId) });
      await load(true);
      setModal('none');
      setSuccessMsg('Équipement ajouté.');
      setSuccessVisible(true);
    } catch (e: any) { setFErr(e?.message ?? 'Erreur'); } finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await apiDelete(`/api/equipements/${selected.id}`);
      await load(true);
      setModal('none');
      setSuccessMsg('Équipement supprimé.');
      setSuccessVisible(true);
    } catch { Alert.alert('Erreur', 'Impossible de supprimer.'); } finally { setSubmitting(false); }
  }

  async function handleReparer(id: number) {
    await apiPatch(`/api/equipements/${id}/statut/DISPONIBLE`, {}).catch(() => {});
    await load(true);
    setModal('none');
    setSuccessMsg('Équipement remis en service.'); setSuccessVisible(true);
  }

  async function handleMaintenance(id: number) {
    await apiPatch(`/api/equipements/${id}/statut/EN_MAINTENANCE`, {}).catch(() => {});
    await load(true);
    setSuccessMsg('Mise en maintenance.'); setSuccessVisible(true);
  }

  function openAdd() { setFNom(''); setFCode(genCode()); setFCat('AUTRE'); setFQte('1'); setFNotes(''); setFErr(''); setModal('add'); }
  function closeModal() { setModal('none'); setSelected(null); }

  return (
    <SafeAreaView style={styles.safe}>
      <LunaHeroHeader title="Équipements" subtitle={`${stats.total} équipement(s) · ${stats.pannes} en panne`} showBack={false} />

      {loading ? <ActivityIndicator size="large" color={LUNA_COLORS.secondary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />}
          ListHeaderComponent={
            <>
              {/* KPIs */}
              <View style={styles.statsGrid}>
                <View style={styles.statsRow}>
                  <LunaStatCard label="Total" value={stats.total} icon="server-outline" color={LUNA_COLORS.secondary} style={styles.statCard} />
                  <LunaStatCard label="Disponibles" value={stats.dispo} icon="checkmark-circle-outline" color={LUNA_COLORS.success} style={styles.statCard} />
                </View>
                <View style={styles.statsRow}>
                  <LunaStatCard label="En panne" value={stats.pannes} icon="warning-outline" color={LUNA_COLORS.error} style={styles.statCard} />
                  <LunaStatCard label="Maintenance" value={stats.maint} icon="construct-outline" color="#9C27B0" style={styles.statCard} />
                </View>
              </View>

              {/* Filtre catégorie */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {(['TOUTES', ...CATS] as const).map(c => {
                  const on = filterCat === c;
                  return (
                    <Pressable key={c} style={[styles.chip, on && styles.chipOn]} onPress={() => setFilterCat(c)}>
                      <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{c === 'TOUTES' ? 'Toutes' : CAT_LABELS[c]}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Recherche + ajouter */}
              <View style={styles.filters}>
                <TextInput
                  style={styles.search}
                  placeholder="Nom ou code équipement…"
                  placeholderTextColor={LUNA_COLORS.textDisabled}
                  value={query} onChangeText={setQuery}
                />
                <Pressable style={styles.addBtn} onPress={openAdd}>
                  <Ionicons name="add-outline" size={20} color={LUNA_COLORS.textInverse} />
                  <Text style={styles.addBtnTxt}>Ajouter</Text>
                </Pressable>
              </View>
            </>
          }
          renderItem={({ item }) => {
            const sc = STATUT_CFG[item.statut ?? 'DISPONIBLE'];
            return (
              <Pressable style={styles.card} onPress={() => { setSelected(item); setModal('detail'); }}>
                <View style={styles.avatar}>
                  <Ionicons name="construct-outline" size={22} color={LUNA_COLORS.secondary} />
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.name} numberOfLines={1}>{item.nom}</Text>
                    <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.badgeTxt, { color: sc.color }]}>{sc.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>{item.code ?? '—'}</Text>
                  <Text style={styles.meta}>{CAT_LABELS[item.categorie ?? ''] ?? item.categorie ?? '—'}</Text>
                  {item.chambre?.numero ? <Text style={styles.meta}>Chambre {item.chambre.numero}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textDisabled} />
              </Pressable>
            );
          }}
          ListEmptyComponent={!loading ? <EmptyState icon="construct-outline" title="Aucun équipement" subtitle="Ajoutez un équipement avec le bouton ci-dessus." /> : null}
        />
      )}

      {/* Modal détail */}
      <Modal visible={modal === 'detail'} animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modal}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>{selected?.nom ?? 'Équipement'}</Text>
            <Pressable onPress={closeModal} hitSlop={8}><Ionicons name="close" size={24} color={LUNA_COLORS.dark} /></Pressable>
          </View>
          {selected ? (
            <ScrollView contentContainerStyle={styles.modalBody}>
              {[
                ['Code', selected.code ?? '—'],
                ['Catégorie', CAT_LABELS[selected.categorie ?? ''] ?? selected.categorie ?? '—'],
                ['Quantité', String(selected.quantite ?? 1)],
                ['Chambre', selected.chambre?.numero ?? '—'],
                ['Notes', selected.notes ?? '—'],
              ].map(([l, v]) => (
                <View key={l} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{l}</Text>
                  <Text style={styles.detailValue}>{v}</Text>
                </View>
              ))}
              {(() => { const sc = STATUT_CFG[selected.statut ?? 'DISPONIBLE']; return (
                <View style={[styles.badge, { backgroundColor: sc.bg, marginTop: 8, alignSelf: 'flex-start' }]}>
                  <Text style={[styles.badgeTxt, { color: sc.color }]}>{sc.label}</Text>
                </View>
              ); })()}

              {/* Actions */}
              {selected.statut === 'EN_PANNE' || selected.statut === 'EN_MAINTENANCE' ? (
                <Pressable style={styles.successBtn} onPress={() => handleReparer(selected.id)}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.successBtnTxt}>Marquer disponible</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.warnBtn} onPress={() => handleMaintenance(selected.id)}>
                  <Ionicons name="construct-outline" size={18} color="#fff" />
                  <Text style={styles.successBtnTxt}>Mettre en maintenance</Text>
                </Pressable>
              )}
              <Pressable style={styles.dangerBtn} disabled={submitting} onPress={() => { closeModal(); setSelected(selected); setModal('delete'); }}>
                <Ionicons name="trash-outline" size={18} color={LUNA_COLORS.error} />
                <Text style={styles.dangerTxt}>Supprimer</Text>
              </Pressable>
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      {/* Modal Ajouter */}
      <Modal visible={modal === 'add'} animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modal}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>Ajouter un équipement</Text>
            <Pressable onPress={closeModal} hitSlop={8}><Ionicons name="close" size={24} color={LUNA_COLORS.dark} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fLabel}>Nom *</Text>
            <TextInput style={styles.inp} value={fNom} onChangeText={setFNom} placeholder="Nom de l'équipement" placeholderTextColor={LUNA_COLORS.textDisabled} />

            <Text style={styles.fLabel}>Code</Text>
            <TextInput style={styles.inp} value={fCode} onChangeText={setFCode} placeholder="EQ-XXXXXXXX" placeholderTextColor={LUNA_COLORS.textDisabled} />

            <Text style={styles.fLabel}>Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CATS.map(c => (
                <Pressable key={c} style={[styles.chip, fCat === c && styles.chipOn]} onPress={() => setFCat(c)}>
                  <Text style={[styles.chipTxt, fCat === c && styles.chipTxtOn]}>{CAT_LABELS[c]}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.fLabel}>Quantité</Text>
            <TextInput style={styles.inp} value={fQte} onChangeText={setFQte} keyboardType="numeric" placeholder="1" placeholderTextColor={LUNA_COLORS.textDisabled} />

            <Text style={styles.fLabel}>Notes</Text>
            <TextInput style={[styles.inp, { height: 72, textAlignVertical: 'top' }]} value={fNotes} onChangeText={setFNotes} multiline placeholder="Observations..." placeholderTextColor={LUNA_COLORS.textDisabled} />

            {fErr ? <Text style={styles.errTxt}>{fErr}</Text> : null}

            <Pressable style={[styles.addBtn, { marginTop: 16, justifyContent: 'center' }, submitting && { opacity: 0.6 }]} onPress={handleAdd} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addBtnTxt}>Ajouter l&apos;équipement</Text>}
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Supprimer */}
      <Modal visible={modal === 'delete'} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.overlay} onPress={closeModal}>
          <Pressable style={styles.deleteCard} onPress={e => e.stopPropagation()}>
            <Ionicons name="warning-outline" size={40} color={LUNA_COLORS.warning} />
            <Text style={styles.deleteTitle}>Supprimer</Text>
            <Text style={styles.deleteDesc}>Supprimer « {selected?.nom} » ?</Text>
            <View style={styles.deleteActions}>
              <Pressable style={styles.cancelBtn} onPress={closeModal}><Text style={styles.cancelTxt}>Annuler</Text></Pressable>
              <Pressable style={[styles.dangerBtn2, submitting && { opacity: 0.6 }]} onPress={handleDelete} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.dangerTxt2}>Supprimer</Text>}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <LunaSuccessModal visible={successVisible} message={successMsg} onClose={() => setSuccessVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: LUNA_COLORS.background },
  statsGrid:  { paddingHorizontal: spacing.lg, gap: spacing.sm, marginVertical: spacing.md },
  statsRow:   { flexDirection: 'row', gap: spacing.sm },
  statCard:   { flex: 1, minWidth: 0 },
  chips:      { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm, alignItems: 'center' },
  chip:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: LUNA_COLORS.surface, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle, marginRight: spacing.sm },
  chipOn:     { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  chipTxt:    { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  chipTxtOn:  { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  filters:    { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  search:     { backgroundColor: LUNA_COLORS.inputBg, borderRadius: borderRadius.lg, minHeight: 52, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: LUNA_COLORS.borderInput, fontSize: fontSize.base, color: LUNA_COLORS.textPrimary },
  addBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: LUNA_COLORS.secondary, borderRadius: borderRadius.lg, paddingVertical: spacing.md, minHeight: 52 },
  addBtnTxt:  { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  list:       { paddingHorizontal: spacing.lg, paddingBottom: 80 },
  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.md, ...(shadows.sm as object) },
  avatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: LUNA_COLORS.secondaryLight, alignItems: 'center', justifyContent: 'center' },
  cardBody:   { flex: 1 },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  name:       { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta:       { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  badgeTxt:   { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  modal:      { flex: 1, backgroundColor: LUNA_COLORS.background, paddingTop: spacing.xxxl },
  modalHead:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingBottom: spacing.md },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  modalBody:  { padding: spacing.xxl, paddingBottom: 80 },
  detailRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.borderSubtle },
  detailLabel:{ fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  detailValue:{ fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.darkest, textAlign: 'right', flex: 1, marginLeft: 8 },
  successBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, padding: spacing.lg, borderRadius: borderRadius.lg, backgroundColor: LUNA_COLORS.success },
  successBtnTxt: { color: '#fff', fontWeight: fontWeight.semibold, fontSize: fontSize.base },
  warnBtn:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, padding: spacing.lg, borderRadius: borderRadius.lg, backgroundColor: '#9C27B0' },
  dangerBtn:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: LUNA_COLORS.error, backgroundColor: LUNA_COLORS.errorLight },
  dangerTxt:  { fontSize: fontSize.base, color: LUNA_COLORS.error, fontWeight: fontWeight.semibold },
  fLabel:     { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.textSecondary, marginBottom: 4, marginTop: spacing.md },
  inp:        { backgroundColor: LUNA_COLORS.inputBg, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, borderWidth: 1, borderColor: LUNA_COLORS.borderInput, minHeight: 52 },
  errTxt:     { fontSize: fontSize.sm, color: LUNA_COLORS.error, marginTop: 4 },
  overlay:    { flex: 1, backgroundColor: 'rgba(1,28,64,0.55)', justifyContent: 'center', padding: spacing.xl },
  deleteCard: { backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.xl, padding: spacing.xxl, alignItems: 'center', gap: spacing.md },
  deleteTitle:{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  deleteDesc: { fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, textAlign: 'center' },
  deleteActions: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  cancelBtn:  { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle, backgroundColor: LUNA_COLORS.surface },
  cancelTxt:  { fontSize: fontSize.base, color: LUNA_COLORS.darkest, fontWeight: fontWeight.medium },
  dangerBtn2: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', backgroundColor: LUNA_COLORS.error },
  dangerTxt2: { fontSize: fontSize.base, color: '#fff', fontWeight: fontWeight.bold },
});
