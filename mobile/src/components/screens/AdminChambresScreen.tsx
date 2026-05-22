import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';

import { apiDelete, apiGet, apiPost, apiPut } from '@/src/api/client';
import { CHAMBRES, EQUIPEMENTS, SERVICES } from '@/src/api/endpoints';
import { LunaDetailsModal } from '@/src/components/common/LunaDetailsModal';
import { lunaModalStyles as ms } from '@/src/theme/lunaModal';
import {
  LunaAccessHeader,
  LunaActionButton,
  LunaScreen,
  LunaStatCard,
  LunaSuccessModal,
} from '@/src/components/common';
import { adminTableStyles as tbl } from '@/src/theme/adminTable';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

const K = 1;
const s = (n: number): number => Math.round(n * K);

const COL: Record<string, number> = {
  CHAMBRE: 92,
  SERVICE: 150,
  TYPE: 82,
  CAPACITE: 100,
  LITS: 68,
  STATUT: 110,
  ACTIONS: 132,
};
const COLS = ['CHAMBRE', 'SERVICE', 'TYPE', 'CAPACITÉ', 'LITS', 'STATUT', 'ACTIONS'] as const;

type IonIcon = ComponentProps<typeof Ionicons>['name'];
type TypeChambre = 'SIMPLE' | 'DOUBLE' | 'SUITE' | 'REANIMATION' | 'URGENCE';
interface ServiceMedical {
  id: number;
  nom: string;
}

interface EquipementMed {
  id: string;
  nom: string;
  code?: string;
}

interface Chambre {
  id: string;
  numero: string;
  type: TypeChambre;
  capacite: number;
  nombreLits?: number;
  disponible?: boolean;
  service?: { id: number; nom: string };
  patient?: { id: string; nom: string; prenom: string } | null;
  materielIds?: string[];
  equipements?: string[];
}

const TYPE_TABS: {
  type: TypeChambre | 'TOUTES';
  label: string;
  icon: IonIcon;
}[] = [
  { type: 'TOUTES', label: 'Toutes', icon: 'layers-outline' },
  { type: 'SIMPLE', label: 'Simple', icon: 'home-outline' },
  { type: 'DOUBLE', label: 'Double', icon: 'bed-outline' },
  { type: 'SUITE', label: 'Suite', icon: 'star-outline' },
  { type: 'REANIMATION', label: 'Réanimation', icon: 'pulse-outline' },
  { type: 'URGENCE', label: 'Urgence', icon: 'medkit-outline' },
];

const TYPE_LABELS: Record<string, string> = {
  SIMPLE: 'Simple',
  DOUBLE: 'Double',
  SUITE: 'Suite',
  REANIMATION: 'Réanimation',
  URGENCE: 'Urgence',
};

const FORM_TYPES: TypeChambre[] = [
  'SIMPLE',
  'DOUBLE',
  'SUITE',
  'REANIMATION',
  'URGENCE',
];

const createSchema = z.object({
  numero: z.string().min(1, 'Numéro requis'),
  type: z.enum(['SIMPLE', 'DOUBLE', 'SUITE', 'REANIMATION', 'URGENCE']),
  capacite: z.string().min(1, 'Capacité requise'),
  nombreLits: z.string().optional(),
  serviceId: z.string().optional(),
});

const bulkSchema = z.object({
  prefixe: z.string().optional(),
  debut: z.string().min(1, 'Requis'),
  fin: z.string().min(1, 'Requis'),
  type: z.enum(['SIMPLE', 'DOUBLE', 'SUITE', 'REANIMATION', 'URGENCE']),
  serviceId: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type BulkForm = z.infer<typeof bulkSchema>;
type ModalType = 'none' | 'create' | 'edit' | 'bulk' | 'details' | 'delete' | 'pickService' | 'pickStatut';

/** Même logique que le web : `disponible` (boolean API). */
function isChambreDisponible(chambre: Chambre): boolean {
  return chambre.disponible !== false;
}

function occupationRate(chambre: Chambre): number {
  return isChambreDisponible(chambre) ? 0 : 100;
}

function statutConfigFromChambre(chambre: Chambre) {
  if (isChambreDisponible(chambre)) {
    return {
      bg: LUNA_COLORS.successLight,
      color: LUNA_COLORS.success,
      label: 'DISPONIBLE',
      icon: 'checkmark-circle' as IonIcon,
    };
  }
  return {
    bg: LUNA_COLORS.errorLight,
    color: LUNA_COLORS.error,
    label: 'OCCUPÉE',
    icon: 'close-circle' as IonIcon,
  };
}

export function AdminChambresScreen(): React.JSX.Element {
  const cliniqueId = useAuthStore((st) => st.cliniqueId);
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [services, setServices] = useState<ServiceMedical[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [filterType, setFilterType] = useState<TypeChambre | 'TOUTES'>('TOUTES');
  const [modal, setModal] = useState<ModalType>('none');
  const [selected, setSelected] = useState<Chambre | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [equipementsList, setEquipementsList] = useState<EquipementMed[]>([]);
  const [selectedMaterielIds, setSelectedMaterielIds] = useState<string[]>([]);

  function showSuccess(message: string) {
    setSuccessMessage(message);
    setSuccessVisible(true);
  }

  const {
    control: cc,
    handleSubmit: hsc,
    reset: rc,
    formState: { errors: ce },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { numero: '', type: 'SIMPLE', capacite: '1', nombreLits: '1', serviceId: '' },
  });

  const {
    control: bc,
    handleSubmit: hsb,
    reset: rb,
    formState: { errors: be },
  } = useForm<BulkForm>({
    resolver: zodResolver(bulkSchema),
    defaultValues: { prefixe: '', debut: '', fin: '', type: 'SIMPLE', serviceId: '' },
  });

  const fetchAll = useCallback(async () => {
    if (!cliniqueId) {
      setLoading(false);
      return;
    }
    try {
      const cid = String(cliniqueId);
      const [c, svc, eq] = await Promise.all([
        apiGet<Chambre[]>(CHAMBRES.BY_CLINIQUE(cid)).catch(() => []),
        apiGet<ServiceMedical[]>(SERVICES.BY_CLINIQUE(cid)).catch(() => []),
        apiGet<{ id: string | number; nom: string; code?: string }[]>(EQUIPEMENTS.BY_CLINIQUE(cid)).catch(
          () => [],
        ),
      ]);
      setChambres(Array.isArray(c) ? c : []);
      setServices(Array.isArray(svc) ? svc : []);
      setEquipementsList(
        Array.isArray(eq)
          ? eq.map((e) => ({ id: String(e.id), nom: e.nom, code: e.code }))
          : [],
      );
    } catch {
      setChambres([]);
      setServices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useFocusEffect(
    useCallback(() => {
      void fetchAll();
    }, [fetchAll]),
  );

  const closeModal = () => {
    setModal('none');
    setSelected(null);
    setSubmitError(null);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return chambres.filter((c) => {
      const matchSearch =
        !q ||
        c.numero.toLowerCase().includes(q) ||
        (c.service?.nom ?? '').toLowerCase().includes(q);
      const matchType = filterType === 'TOUTES' || c.type === filterType;
      const matchService = !filterService || String(c.service?.id) === filterService;
      let matchStatut = true;
      if (filterStatut === 'disponible') matchStatut = isChambreDisponible(c);
      if (filterStatut === 'occupee') matchStatut = !isChambreDisponible(c);
      return matchSearch && matchType && matchService && matchStatut;
    });
  }, [chambres, search, filterType, filterService, filterStatut]);

  const typeCount = (t: TypeChambre | 'TOUTES') =>
    t === 'TOUTES' ? chambres.length : chambres.filter((c) => c.type === t).length;

  const filterServiceLabel =
    services.find((x) => String(x.id) === filterService)?.nom ?? 'Tous les services';

  const filterStatutLabel =
    filterStatut === 'disponible'
      ? 'Disponible'
      : filterStatut === 'occupee'
        ? 'Occupée'
        : 'Tous les statuts';

  function openCreate() {
    rc({ numero: '', type: 'SIMPLE', capacite: '1', nombreLits: '1', serviceId: '' });
    setSelected(null);
    setSelectedMaterielIds([]);
    setSubmitError(null);
    setModal('create');
  }

  function openEdit(item: Chambre) {
    setSelected(item);
    rc({
      numero: item.numero,
      type: item.type,
      capacite: String(item.capacite),
      nombreLits: item.nombreLits != null ? String(item.nombreLits) : '1',
      serviceId: item.service?.id ? String(item.service.id) : '',
    });
    setSelectedMaterielIds(item.materielIds ?? []);
    setSubmitError(null);
    setModal('edit');
  }

  function toggleMateriel(id: string) {
    setSelectedMaterielIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function onCreateSubmit(data: CreateForm) {
    try {
      setSubmitting(true);
      setSubmitError(null);
      await apiPost(CHAMBRES.CREATE, {
        numero: data.numero,
        type: data.type,
        capacite: parseInt(data.capacite, 10) || 1,
        nombreLits: data.nombreLits ? parseInt(data.nombreLits, 10) : 1,
        serviceId: data.serviceId || undefined,
        disponible: true,
        materielIds: selectedMaterielIds,
        equipements: [],
      });
      await fetchAll();
      closeModal();
      showSuccess('Chambre créée avec succès');
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  async function onEditSubmit(data: CreateForm) {
    if (!selected) return;
    try {
      setSubmitting(true);
      setSubmitError(null);
      await apiPut(CHAMBRES.UPDATE(selected.id), {
        numero: data.numero,
        type: data.type,
        capacite: parseInt(data.capacite, 10) || 1,
        nombreLits: data.nombreLits ? parseInt(data.nombreLits, 10) : 1,
        serviceId: data.serviceId || undefined,
        disponible: selected.disponible !== false,
        materielIds: selectedMaterielIds,
        equipements: selected.equipements ?? [],
      });
      await fetchAll();
      closeModal();
      showSuccess('Chambre modifiée avec succès');
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  async function onBulkSubmit(data: BulkForm) {
    try {
      setSubmitting(true);
      setSubmitError(null);
      const debut = parseInt(data.debut, 10);
      const fin = parseInt(data.fin, 10);
      const res = await apiPost<{ nombreCree?: number }>(CHAMBRES.CREATE_MULTIPLE, {
        prefixeNumero: data.prefixe || '',
        numeroDebut: debut,
        nombreChambres: fin - debut + 1,
        type: data.type,
        serviceId: data.serviceId || undefined,
        disponible: true,
        materielIds: selectedMaterielIds,
        equipements: [],
      });
      await fetchAll();
      closeModal();
      const n = res?.nombreCree ?? fin - debut + 1;
      showSuccess(`${n} chambre(s) créée(s) avec succès`);
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    try {
      setSubmitting(true);
      await apiDelete(CHAMBRES.DELETE(selected.id));
      await fetchAll();
      closeModal();
      showSuccess('Chambre supprimée avec succès');
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  const listHeader = (
    <>
      <View style={styles.actionsRow}>
        <Pressable
          style={styles.btnSecondary}
          onPress={() => {
            rb();
            setSelectedMaterielIds([]);
            setSubmitError(null);
            setModal('bulk');
          }}
        >
          <Ionicons name="layers-outline" size={s(18)} color={LUNA_COLORS.darkest} />
          <Text style={styles.btnSecondaryTxt}>Créer plusieurs chambres</Text>
        </Pressable>
        <Pressable style={styles.btnPrimary} onPress={openCreate}>
          <Ionicons name="add-circle-outline" size={s(20)} color={LUNA_COLORS.textInverse} />
          <Text style={styles.btnPrimaryTxt}>Nouvelle chambre</Text>
        </Pressable>
      </View>

      <View style={styles.statWrap}>
        <LunaStatCard
          label="Total Chambres"
          value={chambres.length}
          icon="bed-outline"
          color={LUNA_COLORS.secondary}
          style={styles.statCard}
        />
      </View>

      <View style={styles.filtersCard}>
        <Text style={styles.filterLabel}>RECHERCHER</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={s(20)} color={LUNA_COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Numéro ou service..."
            placeholderTextColor={LUNA_COLORS.textDisabled}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Text style={styles.filterLabel}>SERVICE</Text>
        <Pressable style={styles.selectBox} onPress={() => setModal('pickService')}>
          <Text style={styles.selectTxt} numberOfLines={1}>
            {filterServiceLabel}
          </Text>
          <Ionicons name="chevron-down" size={s(18)} color={LUNA_COLORS.textSecondary} />
        </Pressable>

        <Text style={styles.filterLabel}>STATUT</Text>
        <Pressable style={styles.selectBox} onPress={() => setModal('pickStatut')}>
          <Text style={styles.selectTxt} numberOfLines={1}>
            {filterStatutLabel}
          </Text>
          <Ionicons name="chevron-down" size={s(18)} color={LUNA_COLORS.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeTabs}
      >
        {TYPE_TABS.map(({ type, label, icon }) => {
          const on = filterType === type;
          return (
            <Pressable
              key={type}
              style={[styles.typeTab, on && styles.typeTabOn]}
              onPress={() => setFilterType(type)}
            >
              <Ionicons
                name={icon}
                size={s(16)}
                color={on ? LUNA_COLORS.textInverse : LUNA_COLORS.textSecondary}
              />
              <Text style={[styles.typeTabTxt, on && styles.typeTabTxtOn]}>
                {label} ({typeCount(type)})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.resultHint}>
        {filtered.length} chambre(s) affichée(s)
      </Text>
    </>
  );

  const isEdit = modal === 'edit';

  return (
    <LunaScreen edges={[]}>
      <LunaAccessHeader
        pageTitle="Gestion des Chambres"
        pageSubtitle="Inventaire, affectation à l'entrée et sortie du patient"
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.flatList}
          ListHeaderComponent={listHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void fetchAll(); }}
              colors={[LUNA_COLORS.secondary]}
            />
          }
          renderItem={({ item }) => {
            const sc = statutConfigFromChambre(item);
            return (
              <Pressable
                style={styles.chambreCard}
                onPress={() => { setSelected(item); setModal('details'); }}
              >
                <View style={[styles.chambreIconBox, { backgroundColor: sc.bg }]}>
                  <Ionicons name="bed-outline" size={22} color={sc.color} />
                </View>
                <View style={styles.chambreCardBody}>
                  <View style={styles.chambreCardTop}>
                    <Text style={styles.chambreNumero}>Chambre {item.numero}</Text>
                    <View style={[styles.chambreStatut, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.chambreStatutTxt, { color: sc.color }]}>{sc.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.chambreMeta}>
                    {TYPE_LABELS[item.type] ?? item.type}
                    {item.service?.nom ? ` · ${item.service.nom}` : ''}
                  </Text>
                  <Text style={styles.chambreMeta}>
                    Capacité : {item.capacite} · Lits : {item.nombreLits ?? '—'}
                  </Text>
                  {item.patient ? (
                    <Text style={[styles.chambreMeta, { color: LUNA_COLORS.error }]}>
                      Patient : {item.patient.prenom} {item.patient.nom}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.chambreActions}>
                  <Pressable hitSlop={8} onPress={() => openEdit(item)}>
                    <Ionicons name="create-outline" size={20} color={LUNA_COLORS.secondary} />
                  </Pressable>
                  {isChambreDisponible(item) ? (
                    <Pressable hitSlop={8} onPress={() => { setSelected(item); setModal('delete'); }}>
                      <Ionicons name="trash-outline" size={20} color={LUNA_COLORS.error} />
                    </Pressable>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.chambreEmpty}>
              <Ionicons name="bed-outline" size={48} color={LUNA_COLORS.textDisabled} />
              <Text style={styles.chambreEmptyTxt}>Aucune chambre trouvée</Text>
            </View>
          }
        />
      )}

      <LunaSuccessModal
        visible={successVisible}
        message={successMessage}
        onClose={() => setSuccessVisible(false)}
      />

      <PickerModal
        visible={modal === 'pickService'}
        title="Service"
        options={[
          { value: '', label: 'Tous les services' },
          ...services.map((svc) => ({ value: String(svc.id), label: svc.nom })),
        ]}
        onSelect={(v) => {
          setFilterService(v);
          setModal('none');
        }}
        onClose={() => setModal('none')}
      />

      <PickerModal
        visible={modal === 'pickStatut'}
        title="Statut"
        options={[
          { value: '', label: 'Tous les statuts' },
          { value: 'disponible', label: 'Disponible' },
          { value: 'occupee', label: 'Occupée' },
        ]}
        onSelect={(v) => {
          setFilterStatut(v);
          setModal('none');
        }}
        onClose={() => setModal('none')}
      />

      <FormModal
        visible={modal === 'create' || modal === 'edit'}
        title={isEdit ? `Modifier ${selected?.numero}` : 'Nouvelle chambre'}
        icon={isEdit ? 'create-outline' : 'add-circle-outline'}
        onClose={closeModal}
        onSubmit={hsc(isEdit ? onEditSubmit : onCreateSubmit)}
        submitting={submitting}
        submitError={submitError}
        submitLabel={isEdit ? 'Enregistrer' : 'Créer'}
      >
        <FieldLabel text="Numéro *" />
        <Controller
          control={cc}
          name="numero"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.inp, ce.numero && styles.inpErr]}
              value={value}
              onChangeText={onChange}
              placeholder="Ex : B1"
              placeholderTextColor={LUNA_COLORS.textDisabled}
            />
          )}
        />
        {ce.numero ? <Text style={styles.errTxt}>{ce.numero.message}</Text> : null}

        <FieldLabel text="Type *" />
        <TypePicker control={cc} name="type" />

        <View style={styles.row2}>
          <View style={styles.half}>
            <FieldLabel text="Capacité *" />
            <Controller
              control={cc}
              name="capacite"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.inp}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="number-pad"
                  placeholder="1"
                />
              )}
            />
          </View>
          <View style={styles.half}>
            <FieldLabel text="Nombre de lits" />
            <Controller
              control={cc}
              name="nombreLits"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.inp}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="number-pad"
                  placeholder="1"
                />
              )}
            />
          </View>
        </View>

        <FieldLabel text="Service" />
        <ServicePicker control={cc} name="serviceId" services={services} />

        <EquipementPicker
          equipements={equipementsList}
          selectedIds={selectedMaterielIds}
          onToggle={toggleMateriel}
        />
      </FormModal>

      <FormModal
        visible={modal === 'bulk'}
        title="Créer plusieurs chambres"
        icon="layers-outline"
        onClose={closeModal}
        onSubmit={hsb(onBulkSubmit)}
        submitting={submitting}
        submitError={submitError}
        submitLabel="Créer"
      >
        <FieldLabel text="Préfixe" />
        <Controller
          control={bc}
          name="prefixe"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.inp} value={value} onChangeText={onChange} placeholder="Ex : B" />
          )}
        />
        <View style={styles.row2}>
          <View style={styles.half}>
            <FieldLabel text="Numéro début *" />
            <Controller
              control={bc}
              name="debut"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.inp, be.debut && styles.inpErr]}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="number-pad"
                />
              )}
            />
          </View>
          <View style={styles.half}>
            <FieldLabel text="Numéro fin *" />
            <Controller
              control={bc}
              name="fin"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.inp, be.fin && styles.inpErr]}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="number-pad"
                />
              )}
            />
          </View>
        </View>
        <FieldLabel text="Type *" />
        <TypePicker control={bc} name="type" />
        <FieldLabel text="Service" />
        <ServicePicker control={bc} name="serviceId" services={services} />

        <EquipementPicker
          equipements={equipementsList}
          selectedIds={selectedMaterielIds}
          onToggle={toggleMateriel}
        />
      </FormModal>

      <ChambreDetailsModal chambre={selected} visible={modal === 'details'} onClose={closeModal} equipements={equipementsList} />

      <ConfirmModal
        visible={modal === 'delete'}
        title="Supprimer la chambre"
        message={`Supprimer la chambre « ${selected?.numero} » ?`}
        onClose={closeModal}
        onConfirm={() => void handleDelete()}
        submitting={submitting}
        error={submitError}
      />
    </LunaScreen>
  );
}

function ChambreTableRow({
  item,
  alt,
  onView,
  onEdit,
  onDelete,
}: {
  item: Chambre;
  alt: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}): React.JSX.Element {
  const st = statutConfigFromChambre(item);
  const occ = occupationRate(item);
  const canDelete = isChambreDisponible(item);
  const typeLabel = TYPE_LABELS[item.type] ?? item.type;

  return (
    <View style={[tbl.tableRow, alt && tbl.tableRowAlt]}>
      <View style={{ width: COL.CHAMBRE }}>
        <Text style={tbl.chambreNum}>{item.numero}</Text>
        <Text style={tbl.chambreId}>ID: {item.id.slice(0, 8)}</Text>
      </View>
      <View style={{ width: COL.SERVICE }}>
        <Text style={tbl.cellText} numberOfLines={2}>
          {item.service?.nom ?? 'N/A'}
        </Text>
      </View>
      <View style={{ width: COL.TYPE }}>
        <View style={tbl.typeBadge}>
          <Text style={tbl.typeBadgeTxt}>{typeLabel}</Text>
        </View>
      </View>
      <View style={{ width: COL.CAPACITE }}>
        <View style={tbl.capBar}>
          <View style={[tbl.capFill, { width: `${occ}%` }]} />
        </View>
        <Text style={tbl.cellMuted}>{item.capacite} personnes</Text>
      </View>
      <View style={{ width: COL.LITS, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Ionicons name="bed-outline" size={14} color={LUNA_COLORS.secondary} />
        <Text style={tbl.cellText}>{item.nombreLits ?? 0}</Text>
      </View>
      <View style={{ width: COL.STATUT }}>
        <View style={[tbl.statusBadge, { backgroundColor: st.bg }]}>
          <Ionicons name={st.icon} size={12} color={st.color} />
          <Text style={[tbl.statusTxt, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>
      <View style={{ width: COL.ACTIONS }}>
        <View style={tbl.actionsRow}>
          <LunaActionButton icon="eye-outline" onPress={onView} />
          <LunaActionButton icon="create-outline" onPress={onEdit} />
          <LunaActionButton icon="trash-outline" onPress={onDelete} disabled={!canDelete} />
        </View>
      </View>
    </View>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fLabel}>{text}</Text>;
}

function EquipementPicker({
  equipements,
  selectedIds,
  onToggle,
}: {
  equipements: EquipementMed[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <View style={styles.eqSection}>
      <Text style={styles.fLabel}>Matériel médical à lier</Text>
      {equipements.length === 0 ? (
        <Text style={styles.eqEmpty}>Aucun équipement disponible à lier.</Text>
      ) : (
        <ScrollView style={styles.eqList} nestedScrollEnabled>
          {equipements.map((eq) => {
            const on = selectedIds.includes(eq.id);
            return (
              <Pressable
                key={eq.id}
                style={[styles.eqCard, on && styles.eqCardOn]}
                onPress={() => onToggle(eq.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.eqCode}>{eq.code ?? eq.nom}</Text>
                  {eq.code && eq.nom ? (
                    <Text style={styles.eqName} numberOfLines={1}>
                      {eq.nom}
                    </Text>
                  ) : null}
                </View>
                <Ionicons
                  name={on ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={on ? LUNA_COLORS.success : LUNA_COLORS.textDisabled}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      {selectedIds.length > 0 ? (
        <Text style={styles.eqHint}>{selectedIds.length} équipement(s) sélectionné(s)</Text>
      ) : null}
    </View>
  );
}

function TypePicker({ control, name }: { control: any; name: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {FORM_TYPES.map((t) => (
            <Pressable
              key={t}
              style={[styles.chip, value === t && styles.chipOn]}
              onPress={() => onChange(t)}
            >
              <Text style={[styles.chipTxt, value === t && styles.chipTxtOn]}>
                {TYPE_LABELS[t] ?? t}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    />
  );
}

function ServicePicker({
  control,
  name,
  services,
}: {
  control: any;
  name: string;
  services: ServiceMedical[];
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <Pressable
            style={[styles.chip, !value && styles.chipOn]}
            onPress={() => onChange('')}
          >
            <Text style={[styles.chipTxt, !value && styles.chipTxtOn]}>Aucun</Text>
          </Pressable>
          {services.map((svc) => (
            <Pressable
              key={svc.id}
              style={[styles.chip, value === String(svc.id) && styles.chipOn]}
              onPress={() => onChange(String(svc.id))}
            >
              <Text
                style={[styles.chipTxt, value === String(svc.id) && styles.chipTxtOn]}
                numberOfLines={1}
              >
                {svc.nom}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    />
  );
}

function PickerModal({
  visible,
  title,
  options,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { value: string; label: string }[];
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.pickerSheet}>
        <Text style={styles.pickerTitle}>{title}</Text>
        <ScrollView>
          {options.map((opt) => (
            <Pressable key={opt.value || 'all'} style={styles.pickerRow} onPress={() => onSelect(opt.value)}>
              <Text style={styles.pickerRowTxt}>{opt.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function FormModal({
  visible,
  title,
  icon,
  children,
  onClose,
  onSubmit,
  submitting,
  submitError,
  submitLabel,
}: {
  visible: boolean;
  title: string;
  icon: IonIcon;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
  submitLabel: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          <View style={styles.mHeader}>
            <Ionicons name={icon} size={s(22)} color={LUNA_COLORS.tertiary} />
            <Text style={styles.mTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={s(24)} color={LUNA_COLORS.tertiary} />
            </Pressable>
          </View>
          <ScrollView style={styles.mBody} keyboardShouldPersistTaps="handled">
            {children}
            {submitError ? (
              <View style={styles.errBox}>
                <Text style={styles.errBoxTxt}>{submitError}</Text>
              </View>
            ) : null}
          </ScrollView>
          <View style={styles.mFooter}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnTxt}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, submitting && { opacity: 0.5 }]}
              onPress={onSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={LUNA_COLORS.textInverse} />
              ) : (
                <Text style={styles.submitBtnTxt}>{submitLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ChambreDetailsModal({
  chambre,
  visible,
  onClose,
  equipements,
}: {
  chambre: Chambre | null;
  visible: boolean;
  onClose: () => void;
  equipements: EquipementMed[];
}) {
  if (!chambre) return <></>;
  const st = statutConfigFromChambre(chambre);
  const eqLabels =
    chambre.materielIds?.map((id) => {
      const e = equipements.find((x) => x.id === id);
      return e ? (e.code ? `${e.code} – ${e.nom}` : e.nom) : id.slice(0, 8);
    }) ?? [];

  return (
    <LunaDetailsModal visible={visible} title={`Chambre ${chambre.numero}`} icon="bed-outline" onClose={onClose}>
      <Text style={ms.detailLabel}>Service</Text>
      <Text style={ms.detailValue}>{chambre.service?.nom ?? '—'}</Text>
      <Text style={ms.detailLabel}>Type</Text>
      <Text style={ms.detailValue}>{TYPE_LABELS[chambre.type] ?? chambre.type}</Text>
      <Text style={ms.detailLabel}>Capacité / Lits</Text>
      <Text style={ms.detailValue}>
        {chambre.capacite} personnes · {chambre.nombreLits ?? 0} lits
      </Text>
      <Text style={ms.detailLabel}>Équipements liés</Text>
      <Text style={ms.detailValue}>
        {eqLabels.length > 0 ? eqLabels.join(', ') : 'Aucun'}
      </Text>
      <View style={[styles.statusBadge, { backgroundColor: st.bg, marginTop: spacing.md, alignSelf: 'flex-start' }]}>
        <Ionicons name={st.icon} size={s(14)} color={st.color} />
        <Text style={[styles.statusTxt, { color: st.color }]}>{st.label}</Text>
      </View>
    </LunaDetailsModal>
  );
}

function ConfirmModal({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  submitting,
  error,
}: {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.mHeader}>
            <Ionicons name="warning-outline" size={s(22)} color={LUNA_COLORS.tertiary} />
            <Text style={styles.mTitle}>{title}</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={s(24)} color={LUNA_COLORS.tertiary} />
            </Pressable>
          </View>
          <View style={[styles.mBody, { alignItems: 'center' }]}>
            <Text style={styles.deleteMsg}>{message}</Text>
            {error ? <Text style={styles.errTxt}>{error}</Text> : null}
          </View>
          <View style={styles.mFooter}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnTxt}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[styles.dangerBtn, submitting && { opacity: 0.5 }]}
              onPress={onConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={LUNA_COLORS.textInverse} />
              ) : (
                <Text style={styles.submitBtnTxt}>Supprimer</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pageIntro: { paddingHorizontal: s(spacing.lg), paddingTop: s(spacing.md) },
  pageTitle: {
    fontSize: s(fontSize.xl),
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
  },
  pageSubtitle: {
    fontSize: s(fontSize.sm),
    color: LUNA_COLORS.textSecondary,
    marginTop: s(spacing.xs),
    lineHeight: s(20),
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(spacing.sm),
    paddingHorizontal: s(spacing.lg),
    paddingVertical: s(spacing.md),
  },
  btnSecondary: {
    flex: 1,
    minWidth: s(140),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(spacing.sm),
    backgroundColor: LUNA_COLORS.surface, // ✨ surface blanche
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    borderRadius: borderRadius.lg,
    paddingVertical: s(spacing.md),
    paddingHorizontal: s(spacing.md),
    ...(shadows.sm as object),
  },
  btnSecondaryTxt: {
    fontSize: s(fontSize.sm),
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.darkest,
  },
  btnPrimary: {
    flex: 1,
    minWidth: s(140),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(spacing.sm),
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.lg, // ✨ coins 16px
    paddingVertical: s(spacing.md),
    paddingHorizontal: s(spacing.md),
    minHeight: s(52),
    ...(shadows.button as object),
  },
  btnPrimaryTxt: {
    fontSize: s(fontSize.sm),
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
  },
  statWrap: { paddingHorizontal: s(spacing.lg), marginBottom: s(spacing.md) },
  statCard: { width: '100%' as const },
  filtersCard: {
    marginHorizontal: s(spacing.lg),
    marginBottom: s(spacing.md),
    padding: s(spacing.lg),
    backgroundColor: LUNA_COLORS.surface, // ✨ carte filtres
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    gap: s(spacing.sm),
    ...(shadows.sm as object),
  },
  filterLabel: {
    ...typography.sectionTitle, // ✨ titre section (aligné adminTable)
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.sm),
    backgroundColor: LUNA_COLORS.inputBg, // ✨ fond input HeroUI
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    paddingHorizontal: s(spacing.md),
    minHeight: s(52),
  },
  searchInput: {
    flex: 1,
    fontSize: s(fontSize.base),
    color: LUNA_COLORS.textPrimary,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    paddingHorizontal: s(spacing.md),
    minHeight: s(52),
  },
  selectTxt: { flex: 1, fontSize: s(fontSize.base), color: LUNA_COLORS.textPrimary },
  typeTabs: {
    paddingHorizontal: s(spacing.lg),
    paddingBottom: s(spacing.md),
    gap: s(spacing.sm),
    flexDirection: 'row',
  },
  typeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.xs),
    paddingHorizontal: s(spacing.md),
    paddingVertical: s(spacing.sm),
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
  },
  typeTabOn: { backgroundColor: LUNA_COLORS.darkest, borderColor: LUNA_COLORS.darkest },
  typeTabTxt: { fontSize: s(fontSize.sm), color: LUNA_COLORS.textPrimary },
  typeTabTxtOn: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  resultHint: {
    fontSize: s(fontSize.sm),
    color: LUNA_COLORS.textSecondary,
    paddingHorizontal: s(spacing.lg),
    marginBottom: s(spacing.sm),
  },
  list: { paddingHorizontal: s(spacing.lg), paddingBottom: 80 }, // ✨ espace tab bar
  card: {
    backgroundColor: LUNA_COLORS.surface, // ✨ surface blanche (carte mobile)
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: s(spacing.lg),
    marginBottom: s(spacing.md),
    ...(shadows.sm as object),
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: s(spacing.sm),
  },
  chambreCell: { flex: 1 },
  chambreNum: { fontSize: s(fontSize.lg), fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  chambreId: {
    fontSize: s(fontSize.xs),
    color: LUNA_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  serviceName: {
    fontSize: s(fontSize.base),
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.secondary,
    marginBottom: s(spacing.sm),
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: s(spacing.md),
    paddingVertical: s(4),
    borderRadius: borderRadius.full, // ✨ aligné adminTable typeBadge
    backgroundColor: LUNA_COLORS.surfaceLight,
    marginBottom: s(spacing.sm),
  },
  typeBadgeTxt: { fontSize: s(fontSize.sm), color: LUNA_COLORS.textPrimary, fontWeight: fontWeight.medium },
  capRow: { marginBottom: s(spacing.sm) },
  capBar: {
    height: s(6),
    backgroundColor: LUNA_COLORS.borderDark,
    borderRadius: s(3),
    overflow: 'hidden',
    marginBottom: s(4),
  },
  capFill: { height: '100%', backgroundColor: LUNA_COLORS.secondary },
  capHint: { fontSize: s(fontSize.xs), color: LUNA_COLORS.textSecondary },
  litsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.xs),
    marginBottom: s(spacing.md),
  },
  litsTxt: { fontSize: s(fontSize.sm), color: LUNA_COLORS.secondary, fontWeight: fontWeight.medium },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    paddingHorizontal: s(spacing.sm),
    paddingVertical: s(4),
    borderRadius: borderRadius.full, // ✨ aligné adminTable statusBadge
  },
  statusTxt: { fontSize: s(fontSize.xs), fontWeight: fontWeight.bold },
  cardActions: { flexDirection: 'row', gap: s(spacing.sm), marginTop: s(spacing.sm) },
  actBtn: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actView: { backgroundColor: LUNA_COLORS.infoLight },
  actEdit: { backgroundColor: LUNA_COLORS.warningLight },
  actDel: { backgroundColor: LUNA_COLORS.errorLight },
  actDisabled: { backgroundColor: LUNA_COLORS.surfaceLight },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: s(48), gap: s(spacing.md) },
  emptyTxt: { fontSize: s(fontSize.base), color: LUNA_COLORS.textSecondary },
  overlay: {
    flex: 1,
    backgroundColor: LUNA_COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: LUNA_COLORS.surface, // ✨ modal surface
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: LUNA_COLORS.borderSubtle,
    maxHeight: '92%',
    ...(shadows.lg as object),
  },
  mHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.md),
    padding: s(spacing.lg),
    backgroundColor: LUNA_COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(84, 172, 191, 0.45)',
  },
  mTitle: { flex: 1, fontSize: s(fontSize.lg), fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  mBody: { padding: s(spacing.lg), maxHeight: s(400) },
  mFooter: {
    flexDirection: 'row',
    gap: s(spacing.md),
    padding: s(spacing.lg),
    borderTopWidth: 1,
    borderTopColor: LUNA_COLORS.primary,
    backgroundColor: LUNA_COLORS.surfaceLight,
  },
  pickerSheet: {
    backgroundColor: LUNA_COLORS.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    maxHeight: '50%',
    padding: s(spacing.lg),
    ...(shadows.lg as object),
  },
  pickerTitle: {
    fontSize: s(fontSize.lg),
    fontWeight: fontWeight.bold,
    marginBottom: s(spacing.md),
    color: LUNA_COLORS.darkest,
  },
  pickerRow: {
    paddingVertical: s(spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.borderDark,
  },
  pickerRowTxt: { fontSize: s(fontSize.base), color: LUNA_COLORS.textPrimary },
  fLabel: {
    ...typography.sectionTitle,
    marginBottom: s(spacing.xs),
    marginTop: s(spacing.sm),
  },
  inp: {
    backgroundColor: LUNA_COLORS.inputBg, // ✨ fond input HeroUI
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    paddingHorizontal: s(spacing.md),
    paddingVertical: s(spacing.md),
    fontSize: s(fontSize.base),
    color: LUNA_COLORS.textPrimary,
    minHeight: s(52),
  },
  inpErr: { borderColor: LUNA_COLORS.error },
  errTxt: { fontSize: s(fontSize.xs), color: LUNA_COLORS.error, marginTop: 4 },
  row2: { flexDirection: 'row', gap: s(spacing.md) },
  half: { flex: 1 },
  chipScroll: { marginBottom: s(spacing.sm) },
  chip: {
    paddingHorizontal: s(spacing.md),
    paddingVertical: s(spacing.sm),
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.inputBg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    marginRight: s(spacing.sm),
  },
  chipOn: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  chipTxt: { fontSize: s(fontSize.sm), color: LUNA_COLORS.textPrimary },
  chipTxtOn: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  eqSection: { marginTop: s(spacing.md) },
  eqEmpty: { fontSize: s(fontSize.sm), color: LUNA_COLORS.textSecondary, marginTop: s(spacing.xs) },
  eqList: { maxHeight: s(160), marginTop: s(spacing.sm) },
  eqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(spacing.md),
    marginBottom: s(spacing.sm),
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    backgroundColor: LUNA_COLORS.surface,
  },
  eqCardOn: {
    borderColor: LUNA_COLORS.success,
    backgroundColor: LUNA_COLORS.successLight, // ✨ successLight
  },
  eqCode: { fontSize: s(fontSize.sm), fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  eqName: { fontSize: s(fontSize.xs), color: LUNA_COLORS.textSecondary },
  eqHint: { fontSize: s(fontSize.xs), color: LUNA_COLORS.tertiary, marginTop: s(spacing.xs) },
  errBox: {
    backgroundColor: LUNA_COLORS.errorLight, // ✨ errorLight
    borderRadius: borderRadius.lg,
    padding: s(spacing.md),
    marginTop: s(spacing.md),
  },
  errBoxTxt: { fontSize: s(fontSize.sm), color: LUNA_COLORS.error },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(spacing.md),
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    minHeight: s(52),
  },
  cancelBtnTxt: { fontSize: s(fontSize.base), fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  submitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(spacing.md),
    borderRadius: borderRadius.lg,
    backgroundColor: LUNA_COLORS.secondary,
    minHeight: s(52),
  },
  submitBtnTxt: { fontSize: s(fontSize.base), fontWeight: fontWeight.bold, color: LUNA_COLORS.textInverse },
  dangerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(spacing.md),
    borderRadius: borderRadius.lg,
    backgroundColor: LUNA_COLORS.error,
    minHeight: s(52),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: s(spacing.sm),
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.borderDark,
  },
  detailLabel: { fontSize: s(fontSize.sm), color: LUNA_COLORS.textSecondary },
  detailValue: { fontSize: s(fontSize.base), fontWeight: fontWeight.semibold, color: LUNA_COLORS.textPrimary },
  deleteMsg: { fontSize: s(fontSize.base), color: LUNA_COLORS.textPrimary, textAlign: 'center' },

  // ── Cards FlatList ────────────────────────────────────────────────────────
  flatList: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  chambreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...(shadows.sm as object),
  },
  chambreIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chambreCardBody: { flex: 1 },
  chambreCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chambreNumero: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  chambreStatut: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.full },
  chambreStatutTxt: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  chambreMeta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  chambreActions: { gap: spacing.sm, alignItems: 'center' },
  chambreEmpty: { alignItems: 'center', padding: spacing.xxxl, gap: spacing.md },
  chambreEmptyTxt: { fontSize: fontSize.base, color: LUNA_COLORS.textSecondary },
});
