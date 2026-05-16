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
import { apiGet, apiPost, apiPut, apiDelete } from '@/src/api/client';
import { CHAMBRES, SERVICES } from '@/src/api/endpoints';

const SW = Dimensions.get('window').width;

type TypeChambre = 'SIMPLE' | 'DOUBLE' | 'SUITE' | 'VIP' | 'SOINS_INTENSIFS' | 'REANIMATION' | 'URGENCE';
type StatutChambre = 'DISPONIBLE' | 'OCCUPEE' | 'EN_MAINTENANCE';

interface ServiceMedical { id: number; nom: string; }

interface Chambre {
  id: string;
  numero: string;
  type: TypeChambre;
  capacite: number;
  nombreLits?: number;
  statut?: StatutChambre;
  service?: { id: number; nom: string };
  equipements?: string[];
  patient?: { id: string; nom: string; prenom: string } | null;
}

const TYPE_CHIPS: { type: TypeChambre | 'TOUTES'; label: string; emoji: string }[] = [
  { type: 'TOUTES', label: 'Toutes', emoji: '🏠' },
  { type: 'SIMPLE', label: 'Simple', emoji: '🏠' },
  { type: 'DOUBLE', label: 'Double', emoji: '🛏️' },
  { type: 'SUITE', label: 'Suite', emoji: '⭐' },
  { type: 'VIP', label: 'VIP', emoji: '👑' },
  { type: 'SOINS_INTENSIFS', label: 'Soins intensifs', emoji: '💉' },
  { type: 'REANIMATION', label: 'Réanimation', emoji: '❤️' },
  { type: 'URGENCE', label: 'Urgence', emoji: '🚨' },
];

const createSchema = z.object({
  numero: z.string().min(1, 'Numéro requis'),
  type: z.enum(['SIMPLE', 'DOUBLE', 'SUITE', 'VIP', 'SOINS_INTENSIFS', 'REANIMATION', 'URGENCE']),
  capacite: z.string().min(1, 'Capacité requise'),
  nombreLits: z.string().optional(),
  serviceId: z.string().optional(),
});

const bulkSchema = z.object({
  prefixe: z.string().optional(),
  debut: z.string().min(1, 'Requis'),
  fin: z.string().min(1, 'Requis'),
  type: z.enum(['SIMPLE', 'DOUBLE', 'SUITE', 'VIP', 'SOINS_INTENSIFS', 'REANIMATION', 'URGENCE']),
  serviceId: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type BulkForm = z.infer<typeof bulkSchema>;
type ModalType = 'none' | 'create' | 'edit' | 'bulk' | 'details' | 'delete';

const COL_WIDTHS: Record<string, number> = {
  CHAMBRE: 120, SERVICE: 150, TYPE: 100, CAPACITE: 110, LITS: 90, EQUIPEMENTS: 150, STATUT: 130, ACTIONS: 110,
};

const statutCfg = (s?: StatutChambre) => {
  if (s === 'DISPONIBLE') return { bg: LUNA_COLORS.successLight, color: LUNA_COLORS.success, label: '✅ DISPONIBLE' };
  if (s === 'OCCUPEE') return { bg: LUNA_COLORS.errorLight, color: LUNA_COLORS.error, label: '🔴 OCCUPÉE' };
  return { bg: LUNA_COLORS.warningLight, color: LUNA_COLORS.warning, label: '🔧 EN MAINTENANCE' };
};

export default function ChambresScreen() {
  const { cliniqueId } = useAuthStore();
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [services, setServices] = useState<ServiceMedical[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('TOUS');
  const [filterType, setFilterType] = useState<TypeChambre | 'TOUTES'>('TOUTES');
  const [modal, setModal] = useState<ModalType>('none');
  const [selected, setSelected] = useState<Chambre | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { control: cc, handleSubmit: hsc, reset: rc, setValue: sv, formState: { errors: ce } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { numero: '', type: 'SIMPLE', capacite: '', nombreLits: '', serviceId: '' },
  });

  const { control: bc, handleSubmit: hsb, reset: rb, formState: { errors: be } } = useForm<BulkForm>({
    resolver: zodResolver(bulkSchema),
    defaultValues: { prefixe: '', debut: '', fin: '', type: 'SIMPLE', serviceId: '' },
  });

  const fetchAll = useCallback(async () => {
    if (!cliniqueId) return;
    try {
      const cid = String(cliniqueId);
      const [c, s] = await Promise.all([
        apiGet<Chambre[]>(CHAMBRES.BY_CLINIQUE(cid)).catch(() => []),
        apiGet<ServiceMedical[]>(SERVICES.BY_CLINIQUE(cid)).catch(() => []),
      ]);
      setChambres(Array.isArray(c) ? c : []);
      setServices(Array.isArray(s) ? s : []);
    } catch { /* ignore */ } finally { setLoading(false); setRefreshing(false); }
  }, [cliniqueId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const closeModal = () => { setModal('none'); setSelected(null); setSubmitError(null); };

  const openCreate = () => {
    rc({ numero: '', type: 'SIMPLE', capacite: '', nombreLits: '', serviceId: '' });
    setSelected(null);
    setSubmitError(null);
    setModal('create');
  };

  const openEdit = (item: Chambre) => {
    setSelected(item);
    rc({
      numero: item.numero,
      type: item.type,
      capacite: String(item.capacite),
      nombreLits: item.nombreLits != null ? String(item.nombreLits) : '',
      serviceId: item.service?.id ? String(item.service.id) : '',
    });
    setSubmitError(null);
    setModal('edit');
  };

  const onCreateSubmit = async (data: CreateForm) => {
    try {
      setSubmitting(true); setSubmitError(null);
      await apiPost(CHAMBRES.CREATE, {
        numero: data.numero,
        type: data.type,
        capacite: parseInt(data.capacite) || 1,
        nombreLits: data.nombreLits ? parseInt(data.nombreLits) : 1,
        serviceId: data.serviceId ? String(data.serviceId) : undefined,
        statut: 'DISPONIBLE',
        disponible: true,
      });
      await fetchAll(); closeModal();
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally { setSubmitting(false); }
  };

  const onEditSubmit = async (data: CreateForm) => {
    if (!selected) return;
    try {
      setSubmitting(true); setSubmitError(null);
      await apiPut(CHAMBRES.UPDATE(selected.id), {
        numero: data.numero,
        type: data.type,
        capacite: parseInt(data.capacite) || 1,
        nombreLits: data.nombreLits ? parseInt(data.nombreLits) : 1,
        serviceId: data.serviceId ? String(data.serviceId) : undefined,
        disponible: true,
      });
      await fetchAll(); closeModal();
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally { setSubmitting(false); }
  };

  const onBulkSubmit = async (data: BulkForm) => {
    try {
      setSubmitting(true); setSubmitError(null);
      const debut = parseInt(data.debut);
      const fin = parseInt(data.fin);
      await apiPost(CHAMBRES.CREATE_MULTIPLE, {
        prefixeNumero: data.prefixe || '',
        numeroDebut: debut,
        nombreChambres: fin - debut + 1,
        type: data.type,
        serviceId: data.serviceId ? String(data.serviceId) : undefined,
        statut: 'DISPONIBLE',
        disponible: true,
      });
      await fetchAll(); closeModal();
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      setSubmitting(true);
      await apiDelete(CHAMBRES.DELETE(selected.id));
      setChambres(prev => prev.filter(c => c.id !== selected.id));
      closeModal();
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally { setSubmitting(false); }
  };

  const filtered = chambres.filter(c => {
    const q = search.toLowerCase();
    const ms = filterStatut === 'TOUS' || c.statut === filterStatut;
    const mt = filterType === 'TOUTES' || c.type === filterType;
    const msvc = !filterService || String(c.service?.id) === filterService;
    return ms && mt && msvc && (c.numero.toLowerCase().includes(q) || (c.service?.nom ?? '').toLowerCase().includes(q));
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const typeCounts = (t: TypeChambre | 'TOUTES') =>
    t === 'TOUTES' ? chambres.length : chambres.filter(c => c.type === t).length;

  const statutCounts = (s: StatutChambre | 'TOUS') => {
    if (s === 'TOUS') return chambres.length;
    return chambres.filter(c => c.statut === s).length;
  };

  const COLS = ['CHAMBRE', 'SERVICE', 'TYPE', 'CAPACITE', 'LITS', 'EQUIPEMENTS', 'STATUT', 'ACTIONS'];

  const TypeSelect = ({ control, name }: { control: any; name: string }) => {
    const types: TypeChambre[] = ['SIMPLE', 'DOUBLE', 'SUITE', 'VIP', 'SOINS_INTENSIFS', 'REANIMATION', 'URGENCE'];
    return (
      <Controller control={control} name={name} render={({ field: { value, onChange } }) => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {types.map(t => (
            <TouchableOpacity key={t} style={[styles.typeChip, value === t && styles.typeChipActive]} onPress={() => onChange(t)}>
              <Text style={[styles.typeChipText, value === t && styles.typeChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )} />
    );
  };

  const SvcSelect = ({ control, name }: { control: any; name: string }) => (
    <Controller control={control} name={name} render={({ field: { value, onChange } }) => (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {services.map(s => (
          <TouchableOpacity key={s.id} style={[styles.typeChip, value === String(s.id) && styles.typeChipActive]}
            onPress={() => onChange(String(s.id))}>
            <Text style={[styles.typeChipText, value === String(s.id) && styles.typeChipTextActive]}>{s.nom}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    )} />
  );

  const isEdit = modal === 'edit';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Chambres</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.btnDark} onPress={() => { rb(); setSubmitError(null); setModal('bulk'); }}>
            <Text style={styles.btnDarkText}>Créer plusieurs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSec} onPress={openCreate}>
            <Ionicons name="add" size={15} color={LUNA_COLORS.textInverse} />
            <Text style={styles.btnSecText}>Nouvelle</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Ionicons name="bed-outline" size={24} color={LUNA_COLORS.secondary} />
          <Text style={styles.kpiValue}>{chambres.length}</Text>
          <Text style={styles.kpiLabel}>Total</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: LUNA_COLORS.success }]}>
          <Ionicons name="checkmark-circle-outline" size={24} color={LUNA_COLORS.success} />
          <Text style={[styles.kpiValue, { color: LUNA_COLORS.success }]}>{statutCounts('DISPONIBLE')}</Text>
          <Text style={styles.kpiLabel}>Dispo</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: LUNA_COLORS.error }]}>
          <Ionicons name="close-circle-outline" size={24} color={LUNA_COLORS.error} />
          <Text style={[styles.kpiValue, { color: LUNA_COLORS.error }]}>{statutCounts('OCCUPEE')}</Text>
          <Text style={styles.kpiLabel}>Occupées</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: LUNA_COLORS.warning }]}>
          <Ionicons name="construct-outline" size={24} color={LUNA_COLORS.warning} />
          <Text style={[styles.kpiValue, { color: LUNA_COLORS.warning }]}>{statutCounts('EN_MAINTENANCE')}</Text>
          <Text style={styles.kpiLabel}>Maint.</Text>
        </View>
      </View>

      {/* Type chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeChipsScroll} contentContainerStyle={styles.typeChipsContent}>
        {TYPE_CHIPS.map(({ type, label, emoji }) => (
          <TouchableOpacity key={type} style={[styles.typeChipLg, filterType === type && styles.typeChipLgActive]}
            onPress={() => setFilterType(type)}>
            <Text style={[styles.typeChipLgText, filterType === type && styles.typeChipLgTextActive]}>
              {emoji} {label} ({typeCounts(type)})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filtres 3 col */}
      <View style={styles.filtersRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={14} color={LUNA_COLORS.textSecondary} />
          <TextInput style={styles.searchInput} placeholder="Numéro ou service..." placeholderTextColor={LUNA_COLORS.textSecondary} value={search} onChangeText={setSearch} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 160 }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity style={[styles.filterChip, !filterService && styles.filterChipActive]} onPress={() => setFilterService('')}>
              <Text style={[styles.filterChipText, !filterService && styles.filterChipTextActive]}>Tous svcs</Text>
            </TouchableOpacity>
            {services.map(s => (
              <TouchableOpacity key={s.id} style={[styles.filterChip, filterService === String(s.id) && styles.filterChipActive]}
                onPress={() => setFilterService(String(s.id))}>
                <Text style={[styles.filterChipText, filterService === String(s.id) && styles.filterChipTextActive]} numberOfLines={1}>{s.nom.substring(0, 10)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {['TOUS', 'DISPONIBLE', 'OCCUPEE', 'EN_MAINTENANCE'].map(st => (
            <TouchableOpacity key={st} style={[styles.filterChip, filterStatut === st && styles.filterChipActive]} onPress={() => setFilterStatut(st)}>
              <Text style={[styles.filterChipText, filterStatut === st && styles.filterChipTextActive]}>{st === 'TOUS' ? 'Tous' : st.substring(0, 4)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Table */}
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={LUNA_COLORS.secondary} /></View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView horizontal style={{ flex: 1 }}>
            <View>
              <View style={styles.tableHeader}>
                {COLS.map(c => <View key={c} style={{ width: COL_WIDTHS[c] }}><Text style={styles.thText}>{c}</Text></View>)}
              </View>
              <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[LUNA_COLORS.secondary]} />}>
                {paginated.length === 0 ? (
                  <View style={styles.emptyRow}><Text style={styles.emptyText}>Aucune chambre trouvée</Text></View>
                ) : paginated.map((item, idx) => {
                  const sc = statutCfg(item.statut);
                  const eqs = item.equipements ?? [];
                  const canDelete = item.statut === 'DISPONIBLE';
                  return (
                    <View key={item.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                      {/* CHAMBRE */}
                      <View style={{ width: COL_WIDTHS['CHAMBRE'] }}>
                        <Text style={styles.chambreNum}>{item.numero}</Text>
                        <Text style={styles.chambreIdText}>ID: {item.id.slice(0, 8)}</Text>
                      </View>
                      {/* SERVICE */}
                      <View style={{ width: COL_WIDTHS['SERVICE'] }}>
                        <Text style={styles.cellBold} numberOfLines={2}>{item.service?.nom ?? '—'}</Text>
                      </View>
                      {/* TYPE */}
                      <View style={{ width: COL_WIDTHS['TYPE'] }}>
                        <Text style={styles.cellText}>{item.type}</Text>
                      </View>
                      {/* CAPACITE */}
                      <View style={{ width: COL_WIDTHS['CAPACITE'] }}>
                        <View style={styles.capaciteBar}>
                          <View style={[styles.capaciteFill, { width: `${Math.min(100, (item.capacite / 10) * 100)}%` as `${number}%` }]} />
                        </View>
                        <Text style={styles.capaciteText}>{item.capacite} personnes</Text>
                      </View>
                      {/* LITS */}
                      <View style={{ width: COL_WIDTHS['LITS'], flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="bed-outline" size={12} color={LUNA_COLORS.secondary} />
                        <Text style={[styles.cellText, { color: LUNA_COLORS.secondary }]}>{item.nombreLits ?? 0} lits</Text>
                      </View>
                      {/* EQUIPEMENTS */}
                      <View style={{ width: COL_WIDTHS['EQUIPEMENTS'], flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
                        {eqs.slice(0, 2).map((e, i) => (
                          <View key={i} style={styles.eqBadge}><Text style={styles.eqBadgeText}>{e}</Text></View>
                        ))}
                        {eqs.length > 2 && <View style={styles.eqBadge}><Text style={styles.eqBadgeText}>+{eqs.length - 2}</Text></View>}
                      </View>
                      {/* STATUT */}
                      <View style={{ width: COL_WIDTHS['STATUT'] }}>
                        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                          <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                        </View>
                      </View>
                      {/* ACTIONS */}
                      <View style={{ width: COL_WIDTHS['ACTIONS'], flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <TouchableOpacity style={[styles.actBtn, { backgroundColor: LUNA_COLORS.infoLight ?? '#E3F4F7' }]}
                          onPress={() => { setSelected(item); setModal('details'); }}>
                          <Ionicons name="eye-outline" size={14} color={LUNA_COLORS.info ?? LUNA_COLORS.secondary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actBtn, { backgroundColor: LUNA_COLORS.warningLight }]}
                          onPress={() => openEdit(item)}>
                          <Ionicons name="create-outline" size={14} color={LUNA_COLORS.warning} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actBtn, { backgroundColor: canDelete ? LUNA_COLORS.errorLight : '#F0F0F0' }]}
                          onPress={() => { if (canDelete) { setSelected(item); setModal('delete'); } }}
                          disabled={!canDelete}>
                          <Ionicons name="trash-outline" size={14} color={canDelete ? LUNA_COLORS.error : LUNA_COLORS.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </ScrollView>
          {/* Pagination */}
          <View style={styles.paginationRow}>
            <TouchableOpacity onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={[styles.pageBtn, page === 1 && { opacity: 0.3 }]}>
              <Text style={styles.pageBtnText}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.pageNum}>{page} / {totalPages}</Text>
            <TouchableOpacity onPress={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={[styles.pageBtn, page === totalPages && { opacity: 0.3 }]}>
              <Text style={styles.pageBtnText}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MODAL DETAILS */}
      <Modal visible={modal === 'details'} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.overlay} onPress={closeModal}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <View style={styles.mHeader}>
              <Ionicons name="bed-outline" size={22} color={LUNA_COLORS.textInverse} />
              <Text style={styles.mTitle}>Chambre {selected?.numero}</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={22} color={LUNA_COLORS.textInverse} /></TouchableOpacity>
            </View>
            <View style={styles.mBody}>
              {[['Service', selected?.service?.nom ?? '—'], ['Type', selected?.type ?? '—'], ['Capacité', `${selected?.capacite ?? 0} personnes`], ['Lits', `${selected?.nombreLits ?? 0} lits`]].map(([l, v]) => (
                <View key={l} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{l}</Text>
                  <Text style={styles.detailValue}>{v}</Text>
                </View>
              ))}
              {selected && (
                <View style={[styles.statusBadge, { backgroundColor: statutCfg(selected.statut).bg, marginTop: 8, alignSelf: 'flex-start' }]}>
                  <Text style={[styles.statusText, { color: statutCfg(selected.statut).color }]}>{statutCfg(selected.statut).label}</Text>
                </View>
              )}
              {selected?.patient && (
                <View style={[styles.patientBadge, { marginTop: 8 }]}>
                  <Ionicons name="person-outline" size={14} color={LUNA_COLORS.info ?? LUNA_COLORS.secondary} />
                  <Text style={styles.patientBadgeText}>Patient: {selected.patient.prenom} {selected.patient.nom}</Text>
                </View>
              )}
            </View>
            <View style={styles.mFooter}>
              <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                <Text style={styles.closeBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL CREATE / EDIT */}
      <Modal visible={modal === 'create' || modal === 'edit'} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.mHeader}>
              <Ionicons name={isEdit ? 'create-outline' : 'add-circle-outline'} size={22} color={LUNA_COLORS.textInverse} />
              <Text style={styles.mTitle}>{isEdit ? `Modifier ${selected?.numero}` : 'Nouvelle Chambre'}</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={22} color={LUNA_COLORS.textInverse} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.mBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fLabel}>Numéro *</Text>
              <Controller control={cc} name="numero" render={({ field: { onChange, value } }) => (
                <TextInput style={[styles.inp, ce.numero && styles.inpErr]} value={value} onChangeText={onChange} placeholder="Ex: 101" placeholderTextColor={LUNA_COLORS.textSecondary} />
              )} />
              {ce.numero && <Text style={styles.errTxt}>{ce.numero.message}</Text>}

              <Text style={styles.fLabel}>Type *</Text>
              <TypeSelect control={cc} name="type" />

              <View style={styles.row2}>
                <View style={styles.half}>
                  <Text style={styles.fLabel}>Capacité *</Text>
                  <Controller control={cc} name="capacite" render={({ field: { onChange, value } }) => (
                    <TextInput style={[styles.inp, ce.capacite && styles.inpErr]} value={value} onChangeText={onChange} keyboardType="number-pad" placeholder="1" placeholderTextColor={LUNA_COLORS.textSecondary} />
                  )} />
                </View>
                <View style={styles.half}>
                  <Text style={styles.fLabel}>Nombre lits</Text>
                  <Controller control={cc} name="nombreLits" render={({ field: { onChange, value } }) => (
                    <TextInput style={styles.inp} value={value} onChangeText={onChange} keyboardType="number-pad" placeholder="0" placeholderTextColor={LUNA_COLORS.textSecondary} />
                  )} />
                </View>
              </View>

              <Text style={styles.fLabel}>Service</Text>
              <SvcSelect control={cc} name="serviceId" />

              {submitError && <View style={styles.errBox}><Text style={styles.errBoxText}>{submitError}</Text></View>}
            </ScrollView>
            <View style={styles.mFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.5 }]} onPress={hsc(isEdit ? onEditSubmit : onCreateSubmit)} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={LUNA_COLORS.textInverse} /> : <Text style={styles.submitBtnText}>{isEdit ? 'Enregistrer' : 'Créer'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL BULK */}
      <Modal visible={modal === 'bulk'} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.mHeader}>
              <Ionicons name="copy-outline" size={22} color={LUNA_COLORS.textInverse} />
              <Text style={styles.mTitle}>Créer plusieurs chambres</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={22} color={LUNA_COLORS.textInverse} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.mBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fLabel}>Préfixe</Text>
              <Controller control={bc} name="prefixe" render={({ field: { onChange, value } }) => (
                <TextInput style={styles.inp} value={value} onChangeText={onChange} placeholder="Ex: CH" placeholderTextColor={LUNA_COLORS.textSecondary} />
              )} />
              <View style={styles.row2}>
                <View style={styles.half}>
                  <Text style={styles.fLabel}>Numéro début *</Text>
                  <Controller control={bc} name="debut" render={({ field: { onChange, value } }) => (
                    <TextInput style={[styles.inp, be.debut && styles.inpErr]} value={value} onChangeText={onChange} keyboardType="number-pad" placeholder="1" placeholderTextColor={LUNA_COLORS.textSecondary} />
                  )} />
                </View>
                <View style={styles.half}>
                  <Text style={styles.fLabel}>Numéro fin *</Text>
                  <Controller control={bc} name="fin" render={({ field: { onChange, value } }) => (
                    <TextInput style={[styles.inp, be.fin && styles.inpErr]} value={value} onChangeText={onChange} keyboardType="number-pad" placeholder="10" placeholderTextColor={LUNA_COLORS.textSecondary} />
                  )} />
                </View>
              </View>
              <Text style={styles.fLabel}>Type *</Text>
              <TypeSelect control={bc} name="type" />
              <Text style={styles.fLabel}>Service</Text>
              <SvcSelect control={bc} name="serviceId" />
              {submitError && <View style={styles.errBox}><Text style={styles.errBoxText}>{submitError}</Text></View>}
            </ScrollView>
            <View style={styles.mFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.5 }]} onPress={hsb(onBulkSubmit)} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={LUNA_COLORS.textInverse} /> : <Text style={styles.submitBtnText}>Créer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL DELETE */}
      <Modal visible={modal === 'delete'} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.overlay} onPress={closeModal}>
          <Pressable style={[styles.modalCard, { margin: 24 }]} onPress={e => e.stopPropagation()}>
            <View style={styles.mHeader}>
              <Ionicons name="warning-outline" size={22} color={LUNA_COLORS.textInverse} />
              <Text style={styles.mTitle}>Supprimer chambre</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={22} color={LUNA_COLORS.textInverse} /></TouchableOpacity>
            </View>
            <View style={[styles.mBody, { alignItems: 'center', gap: 12 }]}>
              <Ionicons name="warning-outline" size={48} color={LUNA_COLORS.warning} />
              <Text style={styles.deleteDesc}>Supprimer la chambre "{selected?.numero}" ?</Text>
            </View>
            <View style={styles.mFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.dangerBtn, submitting && { opacity: 0.5 }]} onPress={handleDelete} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={LUNA_COLORS.textInverse} /> : <Text style={styles.submitBtnText}>Supprimer</Text>}
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
  headerBar: { backgroundColor: LUNA_COLORS.dark, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: LUNA_COLORS.textInverse, fontSize: 18, fontWeight: '700' },
  btnDark: { backgroundColor: LUNA_COLORS.darkest, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  btnDarkText: { color: LUNA_COLORS.textInverse, fontWeight: '600', fontSize: 12 },
  btnSec: { backgroundColor: LUNA_COLORS.secondary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  btnSecText: { color: LUNA_COLORS.textInverse, fontWeight: '600', fontSize: 12 },
  kpiRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8, backgroundColor: LUNA_COLORS.surface },
  kpiCard: { flex: 1, backgroundColor: LUNA_COLORS.background, borderRadius: 10, padding: 10, alignItems: 'center', borderLeftWidth: 3, borderLeftColor: LUNA_COLORS.secondary },
  kpiValue: { fontSize: 18, fontWeight: '800', color: LUNA_COLORS.darkest, marginTop: 4 },
  kpiLabel: { fontSize: 10, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  typeChipsScroll: { maxHeight: 48, backgroundColor: LUNA_COLORS.surface },
  typeChipsContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 6, flexDirection: 'row' },
  typeChipLg: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: LUNA_COLORS.surface, borderWidth: 1, borderColor: LUNA_COLORS.borderDark ?? '#E0E0E0' },
  typeChipLgActive: { backgroundColor: LUNA_COLORS.secondary },
  typeChipLgText: { fontSize: 12, color: LUNA_COLORS.textPrimary },
  typeChipLgTextActive: { color: LUNA_COLORS.textInverse, fontWeight: '600' },
  filtersRow: { flexDirection: 'row', padding: 8, gap: 6, backgroundColor: LUNA_COLORS.surface, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.borderDark ?? '#E0E0E0', flexWrap: 'wrap' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: LUNA_COLORS.background, borderRadius: 8, paddingHorizontal: 10, gap: 6, minWidth: 150, flex: 1 },
  searchInput: { flex: 1, fontSize: 13, color: LUNA_COLORS.textPrimary, height: 36 },
  filterChip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: LUNA_COLORS.background, borderWidth: 1, borderColor: LUNA_COLORS.borderDark ?? '#E0E0E0' },
  filterChipActive: { backgroundColor: LUNA_COLORS.secondary },
  filterChipText: { fontSize: 11, color: LUNA_COLORS.textSecondary },
  filterChipTextActive: { color: LUNA_COLORS.textInverse, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tableHeader: { flexDirection: 'row', backgroundColor: LUNA_COLORS.secondary, paddingHorizontal: 12, paddingVertical: 10 },
  thText: { fontSize: 10, fontWeight: '600', color: LUNA_COLORS.textInverse },
  tableRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: LUNA_COLORS.surface, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.borderDark ?? '#E0E0E0', alignItems: 'center' },
  tableRowAlt: { backgroundColor: LUNA_COLORS.surfaceLight },
  emptyRow: { padding: 32, alignItems: 'center' },
  emptyText: { color: LUNA_COLORS.textSecondary },
  chambreNum: { fontSize: 15, fontWeight: '700', color: LUNA_COLORS.darkest },
  chambreIdText: { fontSize: 10, color: LUNA_COLORS.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  cellText: { fontSize: 12, color: LUNA_COLORS.textSecondary },
  cellBold: { fontSize: 12, fontWeight: '500', color: LUNA_COLORS.textPrimary },
  capaciteBar: { height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, marginBottom: 3 },
  capaciteFill: { height: 4, backgroundColor: LUNA_COLORS.secondary, borderRadius: 2 },
  capaciteText: { fontSize: 10, color: LUNA_COLORS.textSecondary },
  eqBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: `${LUNA_COLORS.secondary}26` },
  eqBadgeText: { fontSize: 10, color: LUNA_COLORS.secondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '700' },
  patientBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: LUNA_COLORS.infoLight ?? '#E3F4F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  patientBadgeText: { fontSize: 11, color: LUNA_COLORS.info ?? LUNA_COLORS.secondary },
  actBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  paginationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, padding: 10, backgroundColor: LUNA_COLORS.surface },
  pageBtn: { width: 32, height: 32, borderRadius: 6, backgroundColor: LUNA_COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  pageBtnText: { color: LUNA_COLORS.textInverse, fontWeight: '700' },
  pageNum: { fontSize: 13, fontWeight: '600', color: LUNA_COLORS.textPrimary },
  overlay: { flex: 1, backgroundColor: LUNA_COLORS.overlay, justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: LUNA_COLORS.surface, borderRadius: 16, overflow: 'hidden' },
  mHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: LUNA_COLORS.dark },
  mTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: LUNA_COLORS.textInverse },
  mBody: { padding: 16 },
  mFooter: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: LUNA_COLORS.borderDark ?? '#E0E0E0' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.borderDark ?? '#E0E0E0' },
  detailLabel: { fontSize: 12, color: LUNA_COLORS.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '600', color: LUNA_COLORS.textPrimary },
  deleteDesc: { fontSize: 14, color: LUNA_COLORS.textPrimary, textAlign: 'center' },
  fLabel: { fontSize: 12, fontWeight: '600', color: LUNA_COLORS.textPrimary, marginBottom: 4, marginTop: 8 },
  inp: { backgroundColor: LUNA_COLORS.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: LUNA_COLORS.textPrimary, borderWidth: 1, borderColor: LUNA_COLORS.borderDark ?? '#E0E0E0', marginBottom: 4 },
  inpErr: { borderColor: LUNA_COLORS.error },
  errTxt: { fontSize: 11, color: LUNA_COLORS.error, marginBottom: 6 },
  row2: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: LUNA_COLORS.surface, borderWidth: 1, borderColor: LUNA_COLORS.borderDark ?? '#E0E0E0', marginRight: 6 },
  typeChipActive: { backgroundColor: LUNA_COLORS.secondary },
  typeChipText: { fontSize: 12, color: LUNA_COLORS.textPrimary },
  typeChipTextActive: { color: LUNA_COLORS.textInverse },
  errBox: { backgroundColor: LUNA_COLORS.errorLight, borderRadius: 8, padding: 10, marginTop: 8 },
  errBoxText: { fontSize: 12, color: LUNA_COLORS.error },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: LUNA_COLORS.surface, borderWidth: 1, borderColor: LUNA_COLORS.borderDark ?? '#E0E0E0' },
  cancelBtnText: { fontSize: 14, color: LUNA_COLORS.darkest, fontWeight: '600' },
  submitBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: LUNA_COLORS.secondary },
  submitBtnText: { fontSize: 14, color: LUNA_COLORS.textInverse, fontWeight: '700' },
  dangerBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: LUNA_COLORS.error },
  closeBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: LUNA_COLORS.darkest },
  closeBtnText: { fontSize: 14, color: LUNA_COLORS.textInverse, fontWeight: '600' },
});
