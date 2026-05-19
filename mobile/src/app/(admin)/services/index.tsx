// @ts-nocheck — admin services
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, KeyboardAvoidingView,
  Platform, Pressable, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  LunaAccessHeader,
  LunaActionButton,
  LunaConfirmModal,
  LunaDetailsModal,
  LunaFormModal,
  LunaScreen,
  LunaSuccessModal,
} from '@/src/components/common';
import { adminTableStyles as tbl } from '@/src/theme/adminTable';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/auth.store';
import { apiGet, apiPost, apiPut, apiDelete } from '@/src/api/client';
import { SERVICES } from '@/src/api/endpoints';
import { lunaModalStyles as ms } from '@/src/theme/lunaModal';
import { isServiceActif, serviceMatchesStatutFilter } from '@/src/utils/serviceStatut';

const SW = Dimensions.get('window').width;

interface ServiceMedical {
  id: number;
  nom: string;
  description?: string;
  actif?: boolean;
  statut?: 'ACTIF' | 'INACTIF';
  nombreChambres?: number;
  nombreLits?: number;
}

const createSchema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  description: z.string().optional(),
  statut: z.enum(['ACTIF', 'INACTIF']),
});
type CreateForm = z.infer<typeof createSchema>;

type ModalType = 'none' | 'create' | 'edit' | 'details' | 'delete';

const shadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  android: { elevation: 3 },
  default: {},
});

const COL_WIDTHS: Record<string, number> = {
  SERVICE: 180, DESCRIPTION: 200, CHAMBRES: 100, LITS: 100, STATUT: 120, ACTIONS: 132,
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
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setSuccessVisible(true);
  };

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateForm>({
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

  const openCreate = () => {
    reset({ nom: '', description: '', statut: 'ACTIF' });
    setSelected(null);
    setSubmitError(null);
    setModal('create');
  };

  const openEdit = (s: ServiceMedical) => {
    setSelected(s);
    reset({
      nom: s.nom,
      description: s.description ?? '',
      statut: isServiceActif(s) ? 'ACTIF' : 'INACTIF',
    });
    setSubmitError(null);
    setModal('edit');
  };

  const openDetails = (s: ServiceMedical) => {
    setSelected(s);
    setModal('details');
  };

  const openDelete = (s: ServiceMedical) => {
    setSelected(s);
    setModal('delete');
  };
  const closeModal = () => { setModal('none'); setSelected(null); setSubmitError(null); };

  const onCreateSubmit = async (data: CreateForm) => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      await apiPost(SERVICES.CREATE, {
        nom: data.nom,
        description: data.description,
        cliniqueId: Number(cliniqueId),
        actif: data.statut === 'ACTIF',
      });
      await fetchServices();
      closeModal();
      showSuccess('Service ajouté avec succès');
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const onEditSubmit = async (data: CreateForm) => {
    if (!selected) return;
    try {
      setSubmitting(true);
      setSubmitError(null);
      await apiPut(SERVICES.UPDATE(selected.id), {
        nom: data.nom,
        description: data.description,
        cliniqueId: Number(cliniqueId),
        actif: data.statut === 'ACTIF',
      });
      await fetchServices();
      closeModal();
      showSuccess('Service modifié avec succès');
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      setSubmitting(true);
      await apiDelete(`/api/services/${selected.id}`);
      setServices(prev => prev.filter(s => s.id !== selected.id));
      closeModal();
      showSuccess('Service supprimé avec succès');
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally { setSubmitting(false); }
  };

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    const ms = serviceMatchesStatutFilter(s, filterStatut);
    return (
      ms &&
      (s.nom.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q))
    );
  });

  // KPIs
  const actifs = services.filter((s) => isServiceActif(s)).length;
  const inactifs = services.filter((s) => !isServiceActif(s)).length;
  const totalChambres = services.reduce((a, s) => a + (s.nombreChambres ?? 0), 0);
  const totalLits = services.reduce((a, s) => a + (s.nombreLits ?? 0), 0);

  const COLS = ['SERVICE', 'DESCRIPTION', 'CHAMBRES', 'LITS', 'STATUT', 'ACTIONS'];

  return (
    <LunaScreen edges={[]}>
      <LunaAccessHeader
        pageTitle="Services médicaux"
        pageSubtitle="Gestion des services de votre clinique"
        right={
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={22} color={LUNA_COLORS.tertiary} />
          </TouchableOpacity>
        }
      />

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
            <View style={tbl.tableHeader}>
              {COLS.map(c => (
                <View key={c} style={{ width: COL_WIDTHS[c] }}>
                  <Text style={tbl.thText}>{c}</Text>
                </View>
              ))}
            </View>
            <ScrollView
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[LUNA_COLORS.secondary]} />}
            >
              {filtered.length === 0 ? (
                <View style={tbl.emptyRow}><Text style={tbl.emptyText}>Aucun service trouvé</Text></View>
              ) : filtered.map((item, idx) => {
                const isActif = isServiceActif(item);
                return (
                  <View key={item.id} style={[tbl.tableRow, idx % 2 === 1 && tbl.tableRowAlt]}>
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
                    <View style={{ width: COL_WIDTHS['ACTIONS'] }}>
                      <View style={tbl.actionsRow}>
                        <LunaActionButton icon="eye-outline" onPress={() => openDetails(item)} />
                        <LunaActionButton icon="create-outline" onPress={() => openEdit(item)} />
                        <LunaActionButton icon="trash-outline" onPress={() => openDelete(item)} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      )}

      <LunaDetailsModal
        visible={modal === 'details'}
        title={selected?.nom ?? 'Service'}
        icon="medical-outline"
        onClose={closeModal}
      >
        <Text style={ms.detailLabel}>Description</Text>
        <Text style={ms.detailValue}>{selected?.description ?? '—'}</Text>
        <Text style={ms.detailLabel}>Chambres / Lits</Text>
        <Text style={ms.detailValue}>
          {selected?.nombreChambres ?? 0} chambres · {selected?.nombreLits ?? 0} lits
        </Text>
        <Text style={ms.detailLabel}>Statut</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                selected && isServiceActif(selected)
                  ? LUNA_COLORS.successLight
                  : LUNA_COLORS.errorLight,
              alignSelf: 'flex-start',
              marginTop: 4,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  selected && isServiceActif(selected) ? LUNA_COLORS.success : LUNA_COLORS.error,
              },
            ]}
          >
            {selected && isServiceActif(selected) ? '✅ ACTIF' : '❌ INACTIF'}
          </Text>
        </View>
      </LunaDetailsModal>

      <LunaFormModal
        visible={modal === 'create' || modal === 'edit'}
        title={modal === 'edit' ? `Modifier ${selected?.nom ?? ''}` : 'Nouveau service médical'}
        icon={modal === 'edit' ? 'create-outline' : 'add-circle-outline'}
        submitLabel={modal === 'edit' ? 'Enregistrer' : 'Créer'}
        onClose={closeModal}
        onSubmit={handleSubmit(modal === 'edit' ? onEditSubmit : onCreateSubmit)}
        submitting={submitting}
        submitError={submitError}
      >
        <Text style={ms.fieldLabel}>Nom du service *</Text>
        <Controller
          control={control}
          name="nom"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[ms.input, errors.nom && styles.inputErr]}
              value={value}
              onChangeText={onChange}
              placeholder="Ex: Cardiologie"
              placeholderTextColor={LUNA_COLORS.textSecondary}
            />
          )}
        />
        {errors.nom ? <Text style={styles.errText}>{errors.nom.message}</Text> : null}

        <Text style={ms.fieldLabel}>Description</Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[ms.input, { height: 80, textAlignVertical: 'top' }]}
              value={value}
              onChangeText={onChange}
              placeholder="Description du service..."
              placeholderTextColor={LUNA_COLORS.textSecondary}
              multiline
            />
          )}
        />

        <Text style={ms.fieldLabel}>Statut</Text>
        <Controller
          control={control}
          name="statut"
          render={({ field: { value, onChange } }) => (
            <View style={styles.row2}>
              {(['ACTIF', 'INACTIF'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.specChip, value === st && styles.specChipActive]}
                  onPress={() => onChange(st)}
                >
                  <Text style={[styles.specChipText, value === st && styles.specChipTextActive]}>
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      </LunaFormModal>

      <LunaConfirmModal
        visible={modal === 'delete'}
        title="Confirmer la suppression"
        message={`Voulez-vous vraiment supprimer « ${selected?.nom ?? ''} » ?`}
        confirmLabel="Supprimer"
        onClose={closeModal}
        onConfirm={handleDelete}
        submitting={submitting}
        error={submitError}
      />

      <LunaSuccessModal
        visible={successVisible}
        message={successMessage}
        onClose={() => setSuccessVisible(false)}
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: LUNA_COLORS.background },
  headerBar: { backgroundColor: LUNA_COLORS.dark, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: LUNA_COLORS.textInverse, fontSize: 18, fontWeight: '700' },
  headerSub: { color: LUNA_COLORS.secondary, fontSize: 12, marginTop: 2 },
  addBtn: { backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle },
  addBtnText: { color: LUNA_COLORS.textInverse, fontWeight: '600', fontSize: 12 },
  kpiRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: LUNA_COLORS.surface },
  kpiCard: { flex: 1, alignItems: 'center', borderBottomWidth: 3, paddingBottom: 8, gap: 2 },
  kpiValue: { fontSize: 20, fontWeight: '800' },
  kpiLabel: { fontSize: 9, color: LUNA_COLORS.textSecondary, textAlign: 'center' },
  // ✨ Filtres — séparateur subtil
  filtersRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: LUNA_COLORS.surface, borderBottomWidth: 1, borderBottomColor: 'rgba(197, 220, 234, 0.6)' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: LUNA_COLORS.inputBg, borderRadius: borderRadius.md, paddingHorizontal: 10, gap: 6, borderWidth: 1, borderColor: LUNA_COLORS.borderInput },
  // ✨ Input HeroUI — inputBg, minHeight 52
  searchInput: { flex: 1, fontSize: 13, color: LUNA_COLORS.textPrimary, minHeight: 52 },
  filterBtns: { flexDirection: 'row', gap: 6 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: LUNA_COLORS.background, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle },
  filterChipActive: { backgroundColor: LUNA_COLORS.secondary },
  filterChipText: { fontSize: 11, color: LUNA_COLORS.textSecondary },
  filterChipTextActive: { color: LUNA_COLORS.textInverse, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  serviceIcon: { width: 40, height: 40, borderRadius: borderRadius.md, backgroundColor: LUNA_COLORS.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  serviceName: { fontSize: 13, fontWeight: '600', color: LUNA_COLORS.darkest, flex: 1 },
  descText: { fontSize: 11, color: LUNA_COLORS.textSecondary },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: LUNA_COLORS.surfaceLight, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  countText: { fontSize: 11, color: LUNA_COLORS.secondary, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '700' },
  actBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  overlay: { flex: 1, backgroundColor: LUNA_COLORS.overlay, justifyContent: 'center', padding: 16 },
  // ✨ Modale — borderSubtle + coins lg
  modalBox: { backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: LUNA_COLORS.primary },
  modalTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: LUNA_COLORS.textInverse },
  modalBody: { padding: 16 },
  modalFooter: { padding: 16 },
  modalFooterRow: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(197, 220, 234, 0.6)' },
  detailLabel: { fontSize: 11, fontWeight: '600', color: LUNA_COLORS.textSecondary, marginTop: 12 },
  detailValue: { fontSize: 14, color: LUNA_COLORS.textPrimary, marginTop: 4 },
  detailRow: { flexDirection: 'row', gap: 16 },
  detailHalf: { flex: 1 },
  deleteDesc: { fontSize: 14, color: LUNA_COLORS.textPrimary, textAlign: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: LUNA_COLORS.textPrimary, marginBottom: 4, marginTop: 8 },
  // ✨ Input HeroUI — inputBg, minHeight 52
  input: { backgroundColor: LUNA_COLORS.inputBg, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 14, color: LUNA_COLORS.textPrimary, borderWidth: 1, borderColor: LUNA_COLORS.borderInput, marginBottom: 4, minHeight: 52 },
  inputErr: { borderColor: LUNA_COLORS.error },
  errText: { fontSize: 11, color: LUNA_COLORS.error, marginBottom: 6 },
  row2: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  specChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.full, backgroundColor: LUNA_COLORS.surface, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle },
  specChipActive: { backgroundColor: LUNA_COLORS.secondary },
  specChipText: { fontSize: 13, color: LUNA_COLORS.textPrimary },
  specChipTextActive: { color: LUNA_COLORS.textInverse, fontWeight: '600' },
  errBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: LUNA_COLORS.errorLight, borderRadius: 8, padding: 10, marginTop: 8 },
  errBoxText: { flex: 1, fontSize: 12, color: LUNA_COLORS.error },
  cancelBtn: { flex: 1, minHeight: 48, paddingVertical: spacing.md, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: LUNA_COLORS.surface, borderWidth: 1.5, borderColor: LUNA_COLORS.secondary },
  cancelBtnText: { fontSize: 14, color: LUNA_COLORS.secondary, fontWeight: '600' },
  submitBtn: { flex: 1, minHeight: 48, paddingVertical: spacing.md, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: LUNA_COLORS.secondary },
  submitBtnText: { fontSize: 14, color: LUNA_COLORS.textInverse, fontWeight: '700' },
  dangerBtn: { flex: 1, minHeight: 48, paddingVertical: spacing.md, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: LUNA_COLORS.error },
  closeBtn: { flex: 1, minHeight: 48, paddingVertical: spacing.md, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: LUNA_COLORS.primary },
  closeBtnText: { fontSize: 14, color: LUNA_COLORS.textInverse, fontWeight: '600' },
});
