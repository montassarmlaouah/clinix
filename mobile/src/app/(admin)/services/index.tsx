// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Modal, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiDelete, apiGet, apiPost, apiPut } from '@/src/api/client';
import { EmptyState, LunaHeroHeader, LunaStatCard, LunaSuccessModal } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Service {
  id: number; nom: string; description?: string;
  actif?: boolean; statut?: string;
  nombreChambres?: number; nombreLits?: number;
}

function isActif(s: Service): boolean {
  return s.actif === true || s.statut === 'ACTIF';
}

export default function ServicesScreen() {
  const { cliniqueId } = useAuthStore();
  const [list, setList]       = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery]     = useState('');
  const [filter, setFilter]   = useState<'TOUS' | 'ACTIF' | 'INACTIF'>('TOUS');
  const [selected, setSelected] = useState<Service | null>(null);
  const [modal, setModal]     = useState<'none' | 'detail' | 'add' | 'edit' | 'delete'>('none');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [fErr, setFErr]       = useState('');

  // form
  const [fNom, setFNom]           = useState('');
  const [fDesc, setFDesc]         = useState('');
  const [fStatut, setFStatut]     = useState<'ACTIF' | 'INACTIF'>('ACTIF');

  const load = useCallback(async (silent = false) => {
    if (!cliniqueId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const data = await apiGet(`/api/services/clinique/${cliniqueId}`).catch(() => []);
      setList(Array.isArray(data) ? data : []);
    } catch { setList([]); } finally { setLoading(false); setRefreshing(false); }
  }, [cliniqueId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const filtered = useMemo(() => {
    let r = list;
    if (filter === 'ACTIF')   r = r.filter(s => isActif(s));
    if (filter === 'INACTIF') r = r.filter(s => !isActif(s));
    const q = query.toLowerCase();
    if (q) r = r.filter(s => s.nom.toLowerCase().includes(q));
    return r;
  }, [list, filter, query]);

  const stats = useMemo(() => ({
    total:   list.length,
    actifs:  list.filter(s => isActif(s)).length,
    chambres:list.reduce((a, s) => a + (s.nombreChambres ?? 0), 0),
    lits:    list.reduce((a, s) => a + (s.nombreLits ?? 0), 0),
  }), [list]);

  function openAdd()  { setFNom(''); setFDesc(''); setFStatut('ACTIF'); setFErr(''); setSelected(null); setModal('add'); }
  function openEdit(s: Service) { setFNom(s.nom); setFDesc(s.description ?? ''); setFStatut(isActif(s) ? 'ACTIF' : 'INACTIF'); setFErr(''); setSelected(s); setModal('edit'); }
  function closeModal() { setModal('none'); setSelected(null); }

  async function handleSave() {
    if (!fNom.trim()) { setFErr('Nom requis.'); return; }
    setSubmitting(true); setFErr('');
    try {
      const payload = { nom: fNom.trim(), description: fDesc || undefined, cliniqueId: Number(cliniqueId), actif: fStatut === 'ACTIF' };
      if (modal === 'edit' && selected) {
        await apiPut(`/api/services/${selected.id}`, payload);
      } else {
        await apiPost('/api/services', payload);
      }
      await load(true);
      closeModal();
      setSuccessMsg(modal === 'edit' ? 'Service modifié.' : 'Service créé.'); setSuccessVisible(true);
    } catch (e: any) { setFErr(e?.message ?? 'Erreur'); } finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await apiDelete(`/api/services/${selected.id}`);
      await load(true);
      closeModal();
      setSuccessMsg('Service supprimé.'); setSuccessVisible(true);
    } catch { setFErr('Impossible de supprimer.'); } finally { setSubmitting(false); }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LunaHeroHeader title="Services médicaux" subtitle={`${stats.total} service(s) · ${stats.actifs} actif(s)`} showBack={false} />

      {loading ? <ActivityIndicator size="large" color={LUNA_COLORS.secondary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />}
          ListHeaderComponent={
            <>
              <View style={styles.statsGrid}>
                <View style={styles.statsRow}>
                  <LunaStatCard label="Total" value={stats.total} icon="business-outline" color={LUNA_COLORS.secondary} style={styles.statCard} />
                  <LunaStatCard label="Actifs" value={stats.actifs} icon="checkmark-circle-outline" color={LUNA_COLORS.success} style={styles.statCard} />
                </View>
                <View style={styles.statsRow}>
                  <LunaStatCard label="Chambres" value={stats.chambres} icon="bed-outline" color={LUNA_COLORS.info ?? LUNA_COLORS.secondary} style={styles.statCard} />
                  <LunaStatCard label="Lits" value={stats.lits} icon="resize-outline" color="#9C27B0" style={styles.statCard} />
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {(['TOUS', 'ACTIF', 'INACTIF'] as const).map(f => (
                  <Pressable key={f} style={[styles.chip, filter === f && styles.chipOn]} onPress={() => setFilter(f)}>
                    <Text style={[styles.chipTxt, filter === f && styles.chipTxtOn]}>{f}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.filters}>
                <TextInput style={styles.search} placeholder="Nom du service…" placeholderTextColor={LUNA_COLORS.textDisabled} value={query} onChangeText={setQuery} />
                <Pressable style={styles.addBtn} onPress={openAdd}>
                  <Ionicons name="add-outline" size={20} color={LUNA_COLORS.textInverse} />
                  <Text style={styles.addBtnTxt}>Ajouter</Text>
                </Pressable>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => { setSelected(item); setModal('detail'); }}>
              <View style={styles.avatar}>
                <Ionicons name="business-outline" size={22} color={LUNA_COLORS.secondary} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.name} numberOfLines={1}>{item.nom}</Text>
                  <View style={[styles.badge, { backgroundColor: isActif(item) ? LUNA_COLORS.successLight : LUNA_COLORS.errorLight }]}>
                    <Text style={[styles.badgeTxt, { color: isActif(item) ? LUNA_COLORS.success : LUNA_COLORS.error }]}>
                      {isActif(item) ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>
                </View>
                {item.description ? <Text style={styles.meta} numberOfLines={1}>{item.description}</Text> : null}
                <Text style={styles.meta}>{item.nombreChambres ?? 0} chambre(s) · {item.nombreLits ?? 0} lit(s)</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textDisabled} />
            </Pressable>
          )}
          ListEmptyComponent={!loading ? <EmptyState icon="business-outline" title="Aucun service" subtitle="Créez un service avec le bouton ci-dessus." /> : null}
        />
      )}

      {/* Modal détail */}
      <Modal visible={modal === 'detail'} animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modal}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>{selected?.nom}</Text>
            <Pressable onPress={closeModal} hitSlop={8}><Ionicons name="close" size={24} color={LUNA_COLORS.dark} /></Pressable>
          </View>
          {selected ? (
            <ScrollView contentContainerStyle={styles.modalBody}>
              {[
                ['Description', selected.description ?? '—'],
                ['Chambres', String(selected.nombreChambres ?? 0)],
                ['Lits', String(selected.nombreLits ?? 0)],
                ['Statut', isActif(selected) ? 'Actif' : 'Inactif'],
              ].map(([l, v]) => (
                <View key={l} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{l}</Text>
                  <Text style={styles.detailValue}>{v}</Text>
                </View>
              ))}
              <Pressable style={styles.editBtn} onPress={() => openEdit(selected)}>
                <Ionicons name="create-outline" size={18} color={LUNA_COLORS.secondary} />
                <Text style={styles.editBtnTxt}>Modifier</Text>
              </Pressable>
              <Pressable style={styles.dangerBtn} onPress={() => setModal('delete')}>
                <Ionicons name="trash-outline" size={18} color={LUNA_COLORS.error} />
                <Text style={styles.dangerTxt}>Supprimer</Text>
              </Pressable>
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      {/* Modal add/edit */}
      <Modal visible={modal === 'add' || modal === 'edit'} animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modal}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>{modal === 'edit' ? `Modifier ${selected?.nom ?? ''}` : 'Nouveau service'}</Text>
            <Pressable onPress={closeModal} hitSlop={8}><Ionicons name="close" size={24} color={LUNA_COLORS.dark} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fLabel}>Nom *</Text>
            <TextInput style={styles.inp} value={fNom} onChangeText={setFNom} placeholder="Ex : Cardiologie" placeholderTextColor={LUNA_COLORS.textDisabled} />

            <Text style={styles.fLabel}>Description</Text>
            <TextInput style={[styles.inp, { height: 80, textAlignVertical: 'top' }]} value={fDesc} onChangeText={setFDesc} multiline placeholder="Description..." placeholderTextColor={LUNA_COLORS.textDisabled} />

            <Text style={styles.fLabel}>Statut</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {(['ACTIF', 'INACTIF'] as const).map(s => (
                <Pressable key={s} style={[styles.chip, fStatut === s && styles.chipOn]} onPress={() => setFStatut(s)}>
                  <Text style={[styles.chipTxt, fStatut === s && styles.chipTxtOn]}>{s}</Text>
                </Pressable>
              ))}
            </View>

            {fErr ? <Text style={styles.errTxt}>{fErr}</Text> : null}
            <Pressable style={[styles.addBtn, { marginTop: 16, justifyContent: 'center' }, submitting && { opacity: 0.6 }]} onPress={handleSave} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addBtnTxt}>{modal === 'edit' ? 'Enregistrer' : 'Créer le service'}</Text>}
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal delete */}
      <Modal visible={modal === 'delete'} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.overlay} onPress={closeModal}>
          <Pressable style={styles.deleteCard} onPress={e => e.stopPropagation()}>
            <Ionicons name="warning-outline" size={40} color={LUNA_COLORS.warning} />
            <Text style={styles.deleteTitle}>Supprimer</Text>
            <Text style={styles.deleteDesc}>Supprimer « {selected?.nom} » ?</Text>
            {fErr ? <Text style={styles.errTxt}>{fErr}</Text> : null}
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
  safe:     { flex: 1, backgroundColor: LUNA_COLORS.background },
  statsGrid:{ paddingHorizontal: spacing.lg, gap: spacing.sm, marginVertical: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, minWidth: 0 },
  chips:    { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm, alignItems: 'center' },
  chip:     { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: LUNA_COLORS.surface, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle, marginRight: spacing.sm },
  chipOn:   { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  chipTxt:  { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  chipTxtOn:{ color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  filters:  { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  search:   { backgroundColor: LUNA_COLORS.inputBg, borderRadius: borderRadius.lg, minHeight: 52, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: LUNA_COLORS.borderInput, fontSize: fontSize.base, color: LUNA_COLORS.textPrimary },
  addBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: LUNA_COLORS.secondary, borderRadius: borderRadius.lg, paddingVertical: spacing.md, minHeight: 52 },
  addBtnTxt:{ color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  list:     { paddingHorizontal: spacing.lg, paddingBottom: 80 },
  card:     { flexDirection: 'row', alignItems: 'center', backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.md, ...(shadows.sm as object) },
  avatar:   { width: 44, height: 44, borderRadius: 22, backgroundColor: LUNA_COLORS.secondaryLight, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  cardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  name:     { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta:     { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  badgeTxt: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  modal:    { flex: 1, backgroundColor: LUNA_COLORS.background, paddingTop: spacing.xxxl },
  modalHead:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingBottom: spacing.md },
  modalTitle:{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  modalBody:{ padding: spacing.xxl, paddingBottom: 80 },
  detailRow:{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.borderSubtle },
  detailLabel:{ fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  detailValue:{ fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.darkest, textAlign: 'right', flex: 1, marginLeft: 8 },
  editBtn:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: LUNA_COLORS.secondary, backgroundColor: LUNA_COLORS.secondaryLight },
  editBtnTxt:{ fontSize: fontSize.base, color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold },
  dangerBtn:{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: LUNA_COLORS.error, backgroundColor: LUNA_COLORS.errorLight },
  dangerTxt:{ fontSize: fontSize.base, color: LUNA_COLORS.error, fontWeight: fontWeight.semibold },
  fLabel:   { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.textSecondary, marginBottom: 4, marginTop: spacing.md },
  inp:      { backgroundColor: LUNA_COLORS.inputBg, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, borderWidth: 1, borderColor: LUNA_COLORS.borderInput, minHeight: 52 },
  errTxt:   { fontSize: fontSize.sm, color: LUNA_COLORS.error, marginTop: 4 },
  overlay:  { flex: 1, backgroundColor: 'rgba(1,28,64,0.55)', justifyContent: 'center', padding: spacing.xl },
  deleteCard:{ backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.xl, padding: spacing.xxl, alignItems: 'center', gap: spacing.md },
  deleteTitle:{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  deleteDesc:{ fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, textAlign: 'center' },
  deleteActions:{ flexDirection: 'row', gap: spacing.md, width: '100%' },
  cancelBtn:{ flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle, backgroundColor: LUNA_COLORS.surface },
  cancelTxt:{ fontSize: fontSize.base, color: LUNA_COLORS.darkest, fontWeight: fontWeight.medium },
  dangerBtn2:{ flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', backgroundColor: LUNA_COLORS.error },
  dangerTxt2:{ fontSize: fontSize.base, color: '#fff', fontWeight: fontWeight.bold },
});
