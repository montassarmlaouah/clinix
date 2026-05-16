// @ts-nocheck — admin services
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, KeyboardAvoidingView,
  Platform, Pressable, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { LUNA_COLORS } from '@/src/theme/colors';
import { useAuthStore } from '@/src/store/auth.store';
import { apiGet, apiPost, apiDelete } from '@/src/api/client';

const SW = Dimensions.get('window').width;

interface ServiceMedical {
  id: number; nom: string; description?: string;
  statut?: 'ACTIF' | 'INACTIF'; nombreChambres?: number; nombreLits?: number;
}

const createSchema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  description: z.string().optional(),
  statut: z.enum(['ACTIF', 'INACTIF']),
});
type CreateForm = z.infer<typeof createSchema>;

type ModalType = 'none' | 'create' | 'details' | 'delete';

const shadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  android: { elevation: 3 },
  default: {},
});

const COL_WIDTHS: Record<string, number> = {
  SERVICE: 180, DESCRIPTION: 200, CHAMBRES: 100, LITS: 100, STATUT: 120, ACTIONS: 110,
};

export default function ServicesScreen() {
  const { cliniqueId } = useAuthStore();
  const [services, setServices] = useState<ServiceMedical[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<'TOUS' | 'ACTIF' | 'INACTIF'>('TOUS');
  const [modal, setModal] = useState<ModalType>('none');
  const [selected, setSelected] = useState<ServiceMedical | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { nom: '', description: '', statut: 'ACTIF' },
  });

  const fetchServices = useCallback(async () => {
    if (!cliniqueId) return;
    try {
      const data = await apiGet<ServiceMedical[]>(`/api/services/clinique/${cliniqueId}`);
      setServices(Array.isArray(data) ? data : []);
    } catch { setServices([]); } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => { fetchServices(); }, [fetchServices]);
  const onRefresh = () => { setRefreshing(true); fetchServices(); };

  const openCreate = () => { reset(); setSubmitError(null); setModal('create'); };
  const openDetails = (s: ServiceMedical) => { setSelected(s); setModal('details'); };
  const openDelete = (s: ServiceMedical) => { setSelected(s); setModal('delete'); };
  const closeModal = () => { setModal('none'); setSelected(null); setSubmitError(null); };

  const onCreateSubmit = async (data: CreateForm) => {
    try {
      setSubmitting(true); setSubmitError(null);
      await apiPost('/api/services', { ...data, cliniqueId: Number(cliniqueId) });
      await fetchServices(); closeModal();
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      setSubmitting(true);
      await apiDelete(`/api/services/${selected.id}`);
      setServices(prev => prev.filter(s => s.id !== selected.id));
      closeModal();
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally { setSubmitting(false); }
  };

  const filtered = services.filter(s => {
    const q = search.toLowerCase();
    const ms = filterStatut === 'TOUS' || s.statut === filterStatut;
    return ms && (s.nom.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q));
  });

  // KPIs
  const actifs = services.filter(s => s.statut === 'ACTIF').length;
  const inactifs = services.filter(s => s.statut === 'INACTIF').length;
  const totalChambres = services.reduce((a, s) => a + (s.nombreChambres ?? 0), 0);
  const totalLits = services.reduce((a, s) => a + (s.nombreLits ?? 0), 0);

  const COLS = ['SERVICE', 'DESCRIPTION', 'CHAMBRES', 'LITS', 'STATUT', 'ACTIONS'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>Services Médicaux</Text>
          <Text style={styles.headerSub}>Gestion des services de votre clinique</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={16} color={LUNA_COLORS.textInverse} />
          <Text style={styles.addBtnText}>Ajouter service</Text>
        </TouchableOpacity>
      </View>

      {/* KPI row */}
      <View style={styles.kpiRow}>
        {[
          { label: 'Actifs', value: actifs, color: LUNA_COLORS.success, icon: 'checkmark-circle-outline' },
          { label: 'Inactifs', value: inactifs, color: LUNA_COLORS.error, icon: 'close-circle-outline' },
          { label: 'Chambres', value: totalChambres, color: LUNA_COLORS.info ?? LUNA_COLORS.secondary, icon: 'bed-outline' },
          { label: 'Lits', value: totalLits, color: LUNA_COLORS.purple ?? '#9C27B0', icon: 'resize-outline' },
        ].map(k => (
          <View key={k.label} style={[styles.kpiCard, { borderBottomColor: k.color }]}>
            <Ionicons name={k.icon as any} size={18} color={k.color} />
            <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
            <Text style={styles.kpiLabel}>{k.label}</Text>
          </View>
        ))}
      </View>

      {/* Filtres */}
      <View style={styles.filtersRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={14} color={LUNA_COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nom du service..."
            placeholderTextColor={LUNA_COLORS.textSecondary}
            value={search} onChangeText={setSearch}
          />
        </View>
        <View style={styles.filterBtns}>
          {(['TOUS', 'ACTIF', 'INACTIF'] as const).map(f => (
            <TouchableOpacity key={f} style={[styles.filterChip, filterStatut === f && styles.filterChipActive]}
              onPress={() => setFilterStatut(f)}>
              <Text style={[styles.filterChipText, filterStatut === f && styles.filterChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Table */}
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={LUNA_COLORS.secondary} /></View>
      ) : (
        <ScrollView horizontal style={{ flex: 1 }}>
          <View>
            <View style={styles.tableHeader}>
              {COLS.map(c => (
                <View key={c} style={{ width: COL_WIDTHS[c] }}>
                  <Text style={styles.thText}>{c}</Text>
                </View>
              ))}
            </View>
            <ScrollView
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[LUNA_COLORS.secondary]} />}
            >
              {filtered.length === 0 ? (
                <View style={styles.emptyRow}><Text style={styles.emptyText}>Aucun service trouvé</Text></View>
              ) : filtered.map((item, idx) => {
                const isActif = item.statut === 'ACTIF';
                return (
                  <View key={item.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                    {/* SERVICE */}
                    <View style={{ width: COL_WIDTHS['SERVICE'], flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={styles.serviceIcon}>
                        <Ionicons name="business-outline" size={18} color={LUNA_COLORS.secondary} />
                      </View>
                      <Text style={styles.serviceName} numberOfLines={2}>{item.nom}</Text>
                    </View>
                    {/* DESCRIPTION */}
                    <View style={{ width: COL_WIDTHS['DESCRIPTION'] }}>
                      <Text style={styles.descText} numberOfLines={2}>{(item.description ?? '—').substring(0, 80)}</Text>
                    </View>
                    {/* CHAMBRES */}
                    <View style={{ width: COL_WIDTHS['CHAMBRES'], alignItems: 'center' }}>
                      <View style={styles.countBadge}>
                        <Ionicons name="bed-outline" size={11} color={LUNA_COLORS.secondary} />
                        <Text style={styles.countText}>{item.nombreChambres ?? 0}</Text>
                      </View>
                    </View>
                    {/* LITS */}
                    <View style={{ width: COL_WIDTHS['LITS'], alignItems: 'center' }}>
                      <View style={[styles.countBadge, { backgroundColor: LUNA_COLORS.purpleLight ?? '#F3E5F5' }]}>
                        <Ionicons name="resize-outline" size={11} color={LUNA_COLORS.purple ?? '#9C27B0'} />
                        <Text style={[styles.countText, { color: LUNA_COLORS.purple ?? '#9C27B0' }]}>{item.nombreLits ?? 0}</Text>
                      </View>
                    </View>
                    {/* STATUT */}
                    <View style={{ width: COL_WIDTHS['STATUT'] }}>
                      <View style={[styles.statusBadge, { backgroundColor: isActif ? LUNA_COLORS.successLight : LUNA_COLORS.errorLight }]}>
                        <Text style={[styles.statusText, { color: isActif ? LUNA_COLORS.success : LUNA_COLORS.error }]}>
                          {isActif ? '✅ ACTIF' : '❌ INACTIF'}
                        </Text>
                      </View>
                    </View>
                    {/* ACTIONS */}
                    <View style={{ width: COL_WIDTHS['ACTIONS'], flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <TouchableOpacity style={[styles.actBtn, { backgroundColor: LUNA_COLORS.infoLight ?? '#E3F4F7' }]} onPress={() => openDetails(item)}>
                        <Ionicons name="eye-outline" size={14} color={LUNA_COLORS.info ?? LUNA_COLORS.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actBtn, { backgroundColor: LUNA_COLORS.warningLight }]}>
                        <Ionicons name="create-outline" size={14} color={LUNA_COLORS.warning} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actBtn, { backgroundColor: LUNA_COLORS.errorLight }]} onPress={() => openDelete(item)}>
                        <Ionicons name="trash-outline" size={14} color={LUNA_COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      )}

      {/* MODAL DETAILS */}
      <Modal visible={modal === 'details'} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.overlay} onPress={closeModal}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Ionicons name="medical-outline" size={22} color={LUNA_COLORS.textInverse} />
              <Text style={styles.modalTitle} numberOfLines={1}>{selected?.nom}</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={22} color={LUNA_COLORS.textInverse} /></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{selected?.description ?? '—'}</Text>
              <View style={styles.detailRow}>
                <View style={styles.detailHalf}>
                  <Text style={styles.detailLabel}>Chambres</Text>
                  <Text style={styles.detailValue}>{selected?.nombreChambres ?? 0}</Text>
                </View>
                <View style={styles.detailHalf}>
                  <Text style={styles.detailLabel}>Lits</Text>
                  <Text style={styles.detailValue}>{selected?.nombreLits ?? 0}</Text>
                </View>
              </View>
              <Text style={styles.detailLabel}>Statut</Text>
              <View style={[styles.statusBadge, { backgroundColor: selected?.statut === 'ACTIF' ? LUNA_COLORS.successLight : LUNA_COLORS.errorLight, alignSelf: 'flex-start', marginTop: 4 }]}>
                <Text style={[styles.statusText, { color: selected?.statut === 'ACTIF' ? LUNA_COLORS.success : LUNA_COLORS.error }]}>
                  {selected?.statut === 'ACTIF' ? '✅ ACTIF' : '❌ INACTIF'}
                </Text>
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                <Text style={styles.closeBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL CREATE */}
      <Modal visible={modal === 'create'} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalBox, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="add-circle-outline" size={22} color={LUNA_COLORS.textInverse} />
              <Text style={styles.modalTitle}>Nouveau Service Médical</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={22} color={LUNA_COLORS.textInverse} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Nom du service *</Text>
              <Controller control={control} name="nom" render={({ field: { onChange, value } }) => (
                <TextInput style={[styles.input, errors.nom && styles.inputErr]} value={value} onChangeText={onChange} placeholder="Ex: Cardiologie" placeholderTextColor={LUNA_COLORS.textSecondary} />
              )} />
              {errors.nom && <Text style={styles.errText}>{errors.nom.message}</Text>}

              <Text style={styles.fieldLabel}>Description</Text>
              <Controller control={control} name="description" render={({ field: { onChange, value } }) => (
                <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={value} onChangeText={onChange}
                  placeholder="Description du service..." placeholderTextColor={LUNA_COLORS.textSecondary} multiline />
              )} />

              <Text style={styles.fieldLabel}>Statut</Text>
              <Controller control={control} name="statut" render={({ field: { value } }) => (
                <View style={styles.row2}>
                  {(['ACTIF', 'INACTIF'] as const).map(s => (
                    <TouchableOpacity key={s} style={[styles.specChip, value === s && styles.specChipActive]}
                      onPress={() => (control as any)._formValues.statut = s}>
                      <Text style={[styles.specChipText, value === s && styles.specChipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )} />

              {submitError && (
                <View style={styles.errBox}>
                  <Ionicons name="alert-circle-outline" size={14} color={LUNA_COLORS.error} />
                  <Text style={styles.errBoxText}>{submitError}</Text>
                </View>
              )}
            </ScrollView>
            <View style={styles.modalFooterRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.5 }]}
                onPress={handleSubmit(onCreateSubmit)} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={LUNA_COLORS.textInverse} />
                  : <Text style={styles.submitBtnText}>Créer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL DELETE */}
      <Modal visible={modal === 'delete'} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.overlay} onPress={closeModal}>
          <Pressable style={[styles.modalBox, { margin: 24 }]} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning-outline" size={22} color={LUNA_COLORS.textInverse} />
              <Text style={styles.modalTitle}>Confirmer la suppression</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={22} color={LUNA_COLORS.textInverse} /></TouchableOpacity>
            </View>
            <View style={[styles.modalBody, { alignItems: 'center', gap: 12 }]}>
              <Ionicons name="warning-outline" size={48} color={LUNA_COLORS.warning} />
              <Text style={styles.deleteDesc}>Voulez-vous vraiment supprimer "{selected?.nom}" ?</Text>
              {submitError && <Text style={[styles.errText, { textAlign: 'center' }]}>{submitError}</Text>}
            </View>
            <View style={styles.modalFooterRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dangerBtn, submitting && { opacity: 0.5 }]}
                onPress={handleDelete} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={LUNA_COLORS.textInverse} />
                  : <Text style={styles.submitBtnText}>Supprimer</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: LUNA_COLORS.background },
  headerBar: { backgroundColor: LUNA_COLORS.dark, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: LUNA_COLORS.textInverse, fontSize: 18, fontWeight: '700' },
  headerSub: { color: LUNA_COLORS.secondary, fontSize: 12, marginTop: 2 },
  addBtn: { backgroundColor: LUNA_COLORS.secondary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: LUNA_COLORS.textInverse, fontWeight: '600', fontSize: 12 },
  kpiRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: LUNA_COLORS.surface },
  kpiCard: { flex: 1, alignItems: 'center', borderBottomWidth: 3, paddingBottom: 8, gap: 2 },
  kpiValue: { fontSize: 20, fontWeight: '800' },
  kpiLabel: { fontSize: 9, color: LUNA_COLORS.textSecondary, textAlign: 'center' },
  filtersRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: LUNA_COLORS.surface, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.borderDark ?? '#E0E0E0' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: LUNA_COLORS.background, borderRadius: 8, paddingHorizontal: 10, gap: 6 },
  searchInput: { flex: 1, fontSize: 13, color: LUNA_COLORS.textPrimary, height: 36 },
  filterBtns: { flexDirection: 'row', gap: 6 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: LUNA_COLORS.background, borderWidth: 1, borderColor: LUNA_COLORS.borderDark ?? '#E0E0E0' },
  filterChipActive: { backgroundColor: LUNA_COLORS.secondary },
  filterChipText: { fontSize: 11, color: LUNA_COLORS.textSecondary },
  filterChipTextActive: { color: LUNA_COLORS.textInverse, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tableHeader: { flexDirection: 'row', backgroundColor: LUNA_COLORS.secondary, paddingHorizontal: 12, paddingVertical: 10 },
  thText: { fontSize: 11, fontWeight: '600', color: LUNA_COLORS.textInverse },
  tableRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: LUNA_COLORS.surface, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.borderDark ?? '#E0E0E0', alignItems: 'center' },
  tableRowAlt: { backgroundColor: LUNA_COLORS.surfaceLight },
  emptyRow: { padding: 32, alignItems: 'center' },
  emptyText: { color: LUNA_COLORS.textSecondary },
  serviceIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: LUNA_COLORS.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  serviceName: { fontSize: 13, fontWeight: '600', color: LUNA_COLORS.darkest, flex: 1 },
  descText: { fontSize: 11, color: LUNA_COLORS.textSecondary },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: LUNA_COLORS.surfaceLight, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  countText: { fontSize: 11, color: LUNA_COLORS.secondary, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '700' },
  actBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  overlay: { flex: 1, backgroundColor: LUNA_COLORS.overlay, justifyContent: 'center', padding: 16 },
  modalBox: { backgroundColor: LUNA_COLORS.surface, borderRadius: 16, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: LUNA_COLORS.dark },
  modalTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: LUNA_COLORS.textInverse },
  modalBody: { padding: 16 },
  modalFooter: { padding: 16 },
  modalFooterRow: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: LUNA_COLORS.borderDark ?? '#E0E0E0' },
  detailLabel: { fontSize: 11, fontWeight: '600', color: LUNA_COLORS.textSecondary, marginTop: 12 },
  detailValue: { fontSize: 14, color: LUNA_COLORS.textPrimary, marginTop: 4 },
  detailRow: { flexDirection: 'row', gap: 16 },
  detailHalf: { flex: 1 },
  deleteDesc: { fontSize: 14, color: LUNA_COLORS.textPrimary, textAlign: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: LUNA_COLORS.textPrimary, marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: LUNA_COLORS.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: LUNA_COLORS.textPrimary, borderWidth: 1, borderColor: LUNA_COLORS.borderDark ?? '#E0E0E0', marginBottom: 4 },
  inputErr: { borderColor: LUNA_COLORS.error },
  errText: { fontSize: 11, color: LUNA_COLORS.error, marginBottom: 6 },
  row2: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  specChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: LUNA_COLORS.surface, borderWidth: 1, borderColor: LUNA_COLORS.borderDark ?? '#E0E0E0' },
  specChipActive: { backgroundColor: LUNA_COLORS.secondary },
  specChipText: { fontSize: 13, color: LUNA_COLORS.textPrimary },
  specChipTextActive: { color: LUNA_COLORS.textInverse, fontWeight: '600' },
  errBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: LUNA_COLORS.errorLight, borderRadius: 8, padding: 10, marginTop: 8 },
  errBoxText: { flex: 1, fontSize: 12, color: LUNA_COLORS.error },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: LUNA_COLORS.surface, borderWidth: 1, borderColor: LUNA_COLORS.borderDark ?? '#E0E0E0' },
  cancelBtnText: { fontSize: 14, color: LUNA_COLORS.darkest, fontWeight: '600' },
  submitBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: LUNA_COLORS.secondary },
  submitBtnText: { fontSize: 14, color: LUNA_COLORS.textInverse, fontWeight: '700' },
  dangerBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: LUNA_COLORS.error },
  closeBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: LUNA_COLORS.darkest },
  closeBtnText: { fontSize: 14, color: LUNA_COLORS.textInverse, fontWeight: '600' },
});
