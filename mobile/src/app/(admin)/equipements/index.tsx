// @ts-nocheck — admin equipements
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, KeyboardAvoidingView,
  Platform, Pressable, Dimensions,
} from 'react-native';
import {
  LunaAccessHeader,
  LunaActionButton,
  LunaDetailsModal,
  LunaScreen,
  LunaSuccessModal,
} from '@/src/components/common';
import { lunaModalStyles as ms } from '@/src/theme/lunaModal';
import { adminTableStyles as tbl } from '@/src/theme/adminTable';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/auth.store';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/src/api/client';

type StatutEquipement = 'DISPONIBLE'|'EN_PANNE'|'EN_MAINTENANCE'|'UTILISE';
type CategorieEquipement = 'LITS_MOBILIER'|'DIAGNOSTIC'|'CHIRURGIE'|'MONITORING'|'AUTRE';

interface Equipement {
  id: number; nom: string; code: string; categorie: CategorieEquipement;
  statut: StatutEquipement; quantite?: number;
  chambre?: { id: number; numero: string };
  notes?: string; cliniqueId?: number;
}
interface PanneItem extends Equipement { descriptionPanne?: string; }
interface Chambre { id: number; numero: string; }

const CATEGORIES: CategorieEquipement[] = ['LITS_MOBILIER','DIAGNOSTIC','CHIRURGIE','MONITORING','AUTRE'];

const addSchema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  code: z.string().optional(),
  categorie: z.enum(['LITS_MOBILIER','DIAGNOSTIC','CHIRURGIE','MONITORING','AUTRE']),
  quantite: z.string().optional(),
  chambreId: z.string().optional(),
  notes: z.string().optional(),
});
const panneSchema = z.object({
  description: z.string().min(5, 'Description requise'),
  chambreId: z.string().optional(),
});
type AddForm = z.infer<typeof addSchema>;
type PanneForm = z.infer<typeof panneSchema>;

type ModalType = 'none'|'add'|'details'|'panne'|'delete';

const statutCfg = (s: StatutEquipement) => ({
  DISPONIBLE: { bg: LUNA_COLORS.successLight, color: LUNA_COLORS.success, label: '✅ DISPONIBLE' },
  EN_PANNE: { bg: LUNA_COLORS.errorLight, color: LUNA_COLORS.error, label: '⚠️ EN PANNE' },
  EN_MAINTENANCE: { bg: LUNA_COLORS.purpleLight??'#F3E5F5', color: LUNA_COLORS.purple??'#9C27B0', label: '🔧 MAINTENANCE' },
  UTILISE: { bg: LUNA_COLORS.warningLight, color: LUNA_COLORS.warning, label: '🔄 UTILISÉ' },
}[s]);

const genCode = () => 'EQ-' + Math.random().toString(36).substring(2,10).toUpperCase();

const COL_EQ: Record<string,number> = { EQ: 180, CATEGORIE: 130, QUANTITE: 90, STOCK: 120, ACTIONS: 180 };
const COL_PANNE: Record<string,number> = { EQ: 160, CATEGORIE: 120, LOCALISATION: 130, ETAT: 110, NOTES: 150, ACTIONS: 84 };

export default function EquipementsScreen() {
  const { cliniqueId } = useAuthStore();
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [pannes, setPannes] = useState<PanneItem[]>([]);
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<ModalType>('none');
  const [selected, setSelected] = useState<Equipement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setSuccessVisible(true);
  };

  const { control: ac, handleSubmit: has, reset: ra, setValue: sva, formState: { errors: ae } } = useForm<AddForm>({
    resolver: zodResolver(addSchema),
    defaultValues: { nom: '', code: genCode(), categorie: 'AUTRE', quantite: '1', chambreId: '', notes: '' },
  });
  const { control: pc, handleSubmit: hps, reset: rp, formState: { errors: pe } } = useForm<PanneForm>({
    resolver: zodResolver(panneSchema),
    defaultValues: { description: '', chambreId: '' },
  });

  const fetchAll = useCallback(async () => {
    if (!cliniqueId) return;
    try {
const [eq, ch] = await Promise.all([
        apiGet<Equipement[]>(`/api/equipements/clinique/${cliniqueId}`).catch(() => []),
        apiGet<Chambre[]>(`/api/chambres/clinique/${cliniqueId}`).catch(() => []),
      ]);
      const eqArr = Array.isArray(eq) ? eq : [];
      setEquipements(eqArr);
      setPannes(eqArr.filter(e => e.statut === 'EN_PANNE'));
      setChambres(Array.isArray(ch) ? ch : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [cliniqueId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const closeModal = () => { setModal('none'); setSelected(null); setSubmitError(null); };

  const onAddSubmit = async (data: AddForm) => {
    try {
      setSubmitting(true); setSubmitError(null);
      await apiPost('/api/equipements', {
        nom: data.nom, code: data.code || genCode(), categorie: data.categorie,
        quantite: data.quantite ? parseInt(data.quantite) : 1,
        chambreId: data.chambreId ? Number(data.chambreId) : undefined,
        notes: data.notes || undefined, cliniqueId: Number(cliniqueId),
      });
      await fetchAll();
      closeModal();
      showSuccess('Équipement ajouté avec succès');
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally { setSubmitting(false); }
  };

  const onPanneSubmit = async (data: PanneForm) => {
    if (!selected) return;
    try {
      setSubmitting(true); setSubmitError(null);
await apiPost(`/api/equipements/${selected.id}/traiter-panne`, {
        repairNotes: data.description,
      });
      await fetchAll();
      closeModal();
      showSuccess('Panne signalée avec succès');
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally { setSubmitting(false); }
  };

  const handleReparer = async (id: number) => {
    try {
      await apiPatch(`/api/equipements/${id}/statut/DISPONIBLE`, {});
      await fetchAll();
      showSuccess('Équipement remis en service');
    } catch {
      /* ignore */
    }
  };

  const handleMaintenance = async (id: number) => {
    try {
      await apiPatch(`/api/equipements/${id}/statut/EN_MAINTENANCE`, {});
      await fetchAll();
      showSuccess('Maintenance planifiée avec succès');
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      setSubmitting(true);
      await apiDelete(`/api/equipements/${selected.id}`);
      await fetchAll();
      closeModal();
      showSuccess('Équipement supprimé avec succès');
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally { setSubmitting(false); }
  };

  // KPI
  const total = equipements.length;
  const nbPannes = pannes.length;
  const nbMaint = equipements.filter(e => e.statut === 'EN_MAINTENANCE').length;
  const nbUtilises = equipements.filter(e => e.chambre).length;

  const CatSelect = ({ ctrl, name }: { ctrl: any; name: string }) => (
    <Controller control={ctrl} name={name} render={({ field: { value, onChange } }) => (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} style={[styles.typeChip, value === c && styles.typeChipActive]} onPress={() => onChange(c)}>
            <Text style={[styles.typeChipText, value === c && styles.typeChipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    )} />
  );

  return (
    <LunaScreen edges={[]}>
      <LunaAccessHeader
        pageTitle="Gestion des équipements"
        pageSubtitle={`${total} équipement(s) · ${nbPannes} en panne`}
      />

      {/* 4 KPI cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll} contentContainerStyle={styles.kpiContent}>
        {[
          { label: 'Total équipements', value: total, barColor: LUNA_COLORS.secondary, bgColor: `${LUNA_COLORS.secondary}26`, icon: 'server-outline', color: LUNA_COLORS.secondary },
          { label: 'En panne', value: nbPannes, barColor: LUNA_COLORS.error, bgColor: LUNA_COLORS.errorLight, icon: 'alert-outline', color: LUNA_COLORS.error },
          { label: 'En maintenance', value: nbMaint, barColor: LUNA_COLORS.purple??'#9C27B0', bgColor: LUNA_COLORS.purpleLight??'#F3E5F5', icon: 'construct-outline', color: LUNA_COLORS.purple??'#9C27B0' },
          { label: 'Utilisés en chambres', value: nbUtilises, barColor: LUNA_COLORS.warning, bgColor: LUNA_COLORS.warningLight, icon: 'bed-outline', color: LUNA_COLORS.warning },
        ].map(k => (
          <View key={k.label} style={[styles.kpiCard, { borderLeftColor: k.barColor }]}>
            <View style={[styles.kpiIconBox, { backgroundColor: k.bgColor }]}>
              <Ionicons name={k.icon as any} size={18} color={k.color} />
            </View>
            <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
            <Text style={styles.kpiLabel}>{k.label}</Text>
          </View>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={LUNA_COLORS.secondary} /></View>
      ) : (
        <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[LUNA_COLORS.secondary]} />}>

          {/* Section PANNES */}
          {pannes.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="warning-outline" size={16} color={LUNA_COLORS.textInverse} />
                <Text style={styles.sectionTitle}>Équipements en Panne ({pannes.length})</Text>
              </View>
              <ScrollView horizontal>
                <View>
                  <View style={tbl.tableHeader}>
                    {['ÉQUIPEMENT','CATÉGORIE','LOCALISATION','ÉTAT','NOTES','ACTIONS'].map((c, i) => (
                      <View key={c} style={{ width: [COL_PANNE.EQ, COL_PANNE.CATEGORIE, COL_PANNE.LOCALISATION, COL_PANNE.ETAT, COL_PANNE.NOTES, COL_PANNE.ACTIONS][i] }}>
                        <Text style={tbl.thText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                  {pannes.map((p, idx) => (
                    <View key={p.id} style={[tbl.tableRow, idx % 2 === 1 && tbl.tableRowAlt]}>
                      <View style={{ width: COL_PANNE.EQ }}>
                        <Text style={styles.eqName}>{p.nom}</Text>
                        <Text style={styles.eqCode}>{p.code}</Text>
                      </View>
                      <View style={{ width: COL_PANNE.CATEGORIE }}>
                        <View style={styles.catBadge}><Text style={styles.catText}>{p.categorie}</Text></View>
                      </View>
                      <View style={{ width: COL_PANNE.LOCALISATION }}>
                        <Text style={styles.cellText}>{p.chambre?.numero ?? '—'}</Text>
                      </View>
                      <View style={{ width: COL_PANNE.ETAT }}>
                        <View style={[styles.statusBadge, { backgroundColor: LUNA_COLORS.errorLight }]}>
                          <Text style={[styles.statusText, { color: LUNA_COLORS.error }]}>⚠️ EN PANNE</Text>
                        </View>
                      </View>
                      <View style={{ width: COL_PANNE.NOTES }}>
                        <Text style={styles.cellText} numberOfLines={2}>{p.notes ?? '—'}</Text>
                      </View>
                      <View style={{ width: COL_PANNE.ACTIONS }}>
                        <View style={tbl.actionsRow}>
                          <LunaActionButton icon="hammer-outline" onPress={() => handleReparer(p.id)} />
                          <LunaActionButton
                            icon="eye-outline"
                            onPress={() => {
                              setSelected(p);
                              setModal('details');
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Add button */}
          <TouchableOpacity style={styles.addBtnFloat} onPress={() => { ra({ nom: '', code: genCode(), categorie: 'AUTRE', quantite: '1', chambreId: '', notes: '' }); setSubmitError(null); setModal('add'); }}>
            <Ionicons name="add" size={16} color={LUNA_COLORS.textInverse} />
            <Text style={styles.addBtnText}>Ajouter un équipement</Text>
          </TouchableOpacity>

          {/* Section équipements complets */}
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { backgroundColor: LUNA_COLORS.tertiary??LUNA_COLORS.dark }]}>
              <Ionicons name="list-outline" size={16} color={LUNA_COLORS.textInverse} />
              <Text style={styles.sectionTitle}>Tous les Équipements ({equipements.length})</Text>
            </View>
            <ScrollView horizontal>
              <View>
                <View style={tbl.tableHeader}>
                  {['ÉQUIPEMENT','CATÉGORIE','QUANTITÉ','STATUT STOCK','ACTIONS'].map((c, i) => (
                    <View key={c} style={{ width: [COL_EQ.EQ, COL_EQ.CATEGORIE, COL_EQ.QUANTITE, COL_EQ.STOCK, COL_EQ.ACTIONS][i] }}>
                      <Text style={tbl.thText}>{c}</Text>
                    </View>
                  ))}
                </View>
                {equipements.length === 0 ? (
                  <View style={tbl.emptyRow}><Text style={tbl.emptyText}>Aucun équipement</Text></View>
                ) : equipements.map((item, idx) => {
                  const sc = statutCfg(item.statut);
                  return (
                    <View key={item.id} style={[tbl.tableRow, idx % 2 === 1 && tbl.tableRowAlt]}>
                      {/* EQ */}
                      <View style={{ width: COL_EQ.EQ, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={styles.eqIconBox}>
                          <Ionicons name="construct-outline" size={14} color={LUNA_COLORS.secondary} />
                        </View>
                        <View>
                          <Text style={styles.eqName} numberOfLines={1}>{item.nom}</Text>
                          <Text style={styles.eqCode}>{item.code}</Text>
                        </View>
                      </View>
                      {/* CATEGORIE */}
                      <View style={{ width: COL_EQ.CATEGORIE }}>
                        <View style={styles.catBadge}><Text style={styles.catText}>{item.categorie}</Text></View>
                      </View>
                      {/* QUANTITE */}
                      <View style={{ width: COL_EQ.QUANTITE, alignItems: 'center' }}>
                        <Text style={styles.qtyText}>{item.quantite ?? 1}</Text>
                      </View>
                      {/* STATUT */}
                      <View style={{ width: COL_EQ.STOCK }}>
                        {sc && <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}><Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text></View>}
                      </View>
                      {/* ACTIONS 5 buttons */}
                      <View style={{ width: COL_EQ.ACTIONS }}>
                        <View style={tbl.actionsRow}>
                          <LunaActionButton
                            icon="eye-outline"
                            onPress={() => {
                              setSelected(item);
                              setModal('details');
                            }}
                          />
                          <LunaActionButton
                            icon="alert-circle-outline"
                            onPress={() => {
                              setSelected(item);
                              rp();
                              setSubmitError(null);
                              setModal('panne');
                            }}
                          />
                          <LunaActionButton
                            icon="construct-outline"
                            onPress={() => handleMaintenance(item.id)}
                          />
                          <LunaActionButton
                            icon="trash-outline"
                            onPress={() => {
                              setSelected(item);
                              setModal('delete');
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      )}

      <LunaDetailsModal
        visible={modal === 'details'}
        title={selected?.nom ?? 'Équipement'}
        icon="construct-outline"
        onClose={closeModal}
      >
        <Text style={ms.detailLabel}>Code</Text>
        <Text style={ms.detailValue}>{selected?.code ?? '—'}</Text>
        <Text style={ms.detailLabel}>Catégorie</Text>
        <Text style={ms.detailValue}>{selected?.categorie ?? '—'}</Text>
        <Text style={ms.detailLabel}>Quantité / Chambre</Text>
        <Text style={ms.detailValue}>
          {selected?.quantite ?? 1} · {selected?.chambre?.numero ?? '—'}
        </Text>
        <Text style={ms.detailLabel}>Notes</Text>
        <Text style={ms.detailValue}>{selected?.notes ?? '—'}</Text>
        {selected && (() => {
          const sc = statutCfg(selected.statut);
          return sc ? (
            <View style={[styles.statusBadge, { backgroundColor: sc.bg, alignSelf: 'flex-start', marginTop: 8 }]}>
              <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
            </View>
          ) : null;
        })()}
      </LunaDetailsModal>

      {/* MODAL SIGNALER PANNE */}
      <Modal visible={modal === 'panne'} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.mHeader}>
              <Ionicons name="warning-outline" size={22} color={LUNA_COLORS.error} />
              <Text style={styles.mTitle}>Signaler une Panne</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={22} color={LUNA_COLORS.tertiary} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.mBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fLabel}>Équipement</Text>
              <Text style={styles.readonlyField}>{selected?.nom}</Text>

              <Text style={styles.fLabel}>Description du problème *</Text>
              <Controller control={pc} name="description" render={({ field: { onChange, value } }) => (
                <TextInput style={[styles.inp, { height: 80, textAlignVertical: 'top' }, pe.description && styles.inpErr]}
                  value={value} onChangeText={onChange} multiline placeholder="Décrivez la panne..." placeholderTextColor={LUNA_COLORS.textSecondary} />
              )} />
              {pe.description && <Text style={styles.errTxt}>{pe.description.message}</Text>}

              <Text style={styles.fLabel}>Chambre concernée</Text>
              <Controller control={pc} name="chambreId" render={({ field: { value, onChange } }) => (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  <TouchableOpacity style={[styles.typeChip, !value && styles.typeChipActive]} onPress={() => onChange('')}>
                    <Text style={[styles.typeChipText, !value && styles.typeChipTextActive]}>Aucune</Text>
                  </TouchableOpacity>
                  {chambres.map(c => (
                    <TouchableOpacity key={c.id} style={[styles.typeChip, value === String(c.id) && styles.typeChipActive]}
                      onPress={() => onChange(String(c.id))}>
                      <Text style={[styles.typeChipText, value === String(c.id) && styles.typeChipTextActive]}>{c.numero}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )} />
              {submitError && <View style={styles.errBox}><Text style={styles.errBoxText}>{submitError}</Text></View>}
            </ScrollView>
            <View style={styles.mFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.dangerBtn, submitting && { opacity: 0.5 }]} onPress={hps(onPanneSubmit)} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={LUNA_COLORS.textInverse} /> : <Text style={styles.submitBtnText}>Signaler</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL ADD */}
      <Modal visible={modal === 'add'} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.mHeader}>
              <Ionicons name="add-circle-outline" size={22} color={LUNA_COLORS.tertiary} />
              <Text style={styles.mTitle}>Ajouter un Équipement</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={22} color={LUNA_COLORS.tertiary} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.mBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fLabel}>Nom *</Text>
              <Controller control={ac} name="nom" render={({ field: { onChange, value } }) => (
                <TextInput style={[styles.inp, ae.nom && styles.inpErr]} value={value} onChangeText={onChange} placeholder="Nom de l'équipement" placeholderTextColor={LUNA_COLORS.textSecondary} />
              )} />
              {ae.nom && <Text style={styles.errTxt}>{ae.nom.message}</Text>}

              <Text style={styles.fLabel}>Code (auto-généré)</Text>
              <Controller control={ac} name="code" render={({ field: { onChange, value } }) => (
                <TextInput style={styles.inp} value={value} onChangeText={onChange} placeholder="EQ-XXXXXXXX" placeholderTextColor={LUNA_COLORS.textSecondary} />
              )} />

              <Text style={styles.fLabel}>Catégorie *</Text>
              <CatSelect ctrl={ac} name="categorie" />

              <View style={styles.row2}>
                <View style={styles.half}>
                  <Text style={styles.fLabel}>Quantité</Text>
                  <Controller control={ac} name="quantite" render={({ field: { onChange, value } }) => (
                    <TextInput style={styles.inp} value={value} onChangeText={onChange} keyboardType="number-pad" placeholder="1" placeholderTextColor={LUNA_COLORS.textSecondary} />
                  )} />
                </View>
                <View style={styles.half}>
                  <Text style={styles.fLabel}>Chambre</Text>
                  <Controller control={ac} name="chambreId" render={({ field: { value, onChange } }) => (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 44 }}>
                      {[{ id: '', numero: 'Aucune' }, ...chambres].map(c => (
                        <TouchableOpacity key={String(c.id)} style={[styles.typeChip, value === String(c.id) && styles.typeChipActive]}
                          onPress={() => onChange(String(c.id))}>
                          <Text style={[styles.typeChipText, value === String(c.id) && styles.typeChipTextActive]}>{c.numero}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )} />
                </View>
              </View>

              <Text style={styles.fLabel}>Notes</Text>
              <Controller control={ac} name="notes" render={({ field: { onChange, value } }) => (
                <TextInput style={[styles.inp, { height: 60, textAlignVertical: 'top' }]} value={value} onChangeText={onChange}
                  multiline placeholder="Observations..." placeholderTextColor={LUNA_COLORS.textSecondary} />
              )} />
              {submitError && <View style={styles.errBox}><Text style={styles.errBoxText}>{submitError}</Text></View>}
            </ScrollView>
            <View style={styles.mFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.5 }]} onPress={has(onAddSubmit)} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={LUNA_COLORS.textInverse} /> : <Text style={styles.submitBtnText}>Ajouter</Text>}
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
              <Ionicons name="warning-outline" size={22} color={LUNA_COLORS.error} />
              <Text style={styles.mTitle}>Supprimer équipement</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={22} color={LUNA_COLORS.tertiary} /></TouchableOpacity>
            </View>
            <View style={[styles.mBody, { alignItems: 'center', gap: 12 }]}>
              <Ionicons name="warning-outline" size={48} color={LUNA_COLORS.warning} />
              <Text style={styles.deleteDesc}>Supprimer "{selected?.nom}" ?</Text>
              {submitError && <Text style={styles.errTxt}>{submitError}</Text>}
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
  headerBar: { backgroundColor: LUNA_COLORS.dark, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: LUNA_COLORS.textInverse, fontSize: 16, fontWeight: '700', flex: 1 },
  kpiScroll: { backgroundColor: LUNA_COLORS.surface, maxHeight: 110 },
  kpiContent: { padding: 12, gap: 10, flexDirection: 'row' },
  kpiCard: { width: 130, borderLeftWidth: 4, borderRadius: borderRadius.lg, backgroundColor: LUNA_COLORS.surface, padding: 12, gap: 4, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle, ...(shadows.sm as object) },
  kpiIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  kpiValue: { fontSize: 22, fontWeight: '800' },
  kpiLabel: { fontSize: 10, color: LUNA_COLORS.textSecondary, lineHeight: 13 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  // ✨ Carte tableau — borderSubtle + shadow sm
  section: { margin: 12, marginBottom: 0, borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: LUNA_COLORS.surface, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle, ...(shadows.sm as object) },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: LUNA_COLORS.secondary },
  sectionTitle: { color: LUNA_COLORS.textInverse, fontWeight: '700', fontSize: 14 },
  addBtnFloat: { backgroundColor: LUNA_COLORS.secondary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', margin: 12 },
  addBtnText: { color: LUNA_COLORS.textInverse, fontWeight: '700', fontSize: 13 },
  eqIconBox: { width: 32, height: 32, borderRadius: 6, backgroundColor: LUNA_COLORS.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  eqName: { fontSize: 13, fontWeight: '600', color: LUNA_COLORS.darkest },
  eqCode: { fontSize: 10, color: LUNA_COLORS.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  catBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, backgroundColor: LUNA_COLORS.surfaceLight, alignSelf: 'flex-start' },
  catText: { fontSize: 10, color: LUNA_COLORS.textSecondary },
  qtyText: { fontSize: 16, fontWeight: '700', color: LUNA_COLORS.darkest },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '700' },
  actBtn: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  cellText: { fontSize: 12, color: LUNA_COLORS.textSecondary },
  overlay: { flex: 1, backgroundColor: LUNA_COLORS.overlay, justifyContent: 'center', padding: 16 },
  modalCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LUNA_COLORS.primary,
    overflow: 'hidden',
  },
  mHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: LUNA_COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(84, 172, 191, 0.45)',
  },
  mTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: LUNA_COLORS.darkest },
  mBody: { padding: 16 },
  mFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: LUNA_COLORS.primary,
    backgroundColor: LUNA_COLORS.surfaceLight,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(197, 220, 234, 0.6)' },
  detailLabel: { fontSize: 12, color: LUNA_COLORS.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '600', color: LUNA_COLORS.textPrimary, flex: 1, textAlign: 'right' },
  deleteDesc: { fontSize: 14, color: LUNA_COLORS.textPrimary, textAlign: 'center' },
  readonlyField: { fontSize: 14, fontWeight: '600', color: LUNA_COLORS.darkest, padding: 10, backgroundColor: LUNA_COLORS.background, borderRadius: 8, marginBottom: 8 },
  fLabel: { fontSize: 12, fontWeight: '600', color: LUNA_COLORS.textPrimary, marginBottom: 4, marginTop: 8 },
  // ✨ Input HeroUI — inputBg, minHeight 52
  inp: { backgroundColor: LUNA_COLORS.inputBg, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 14, color: LUNA_COLORS.textPrimary, borderWidth: 1, borderColor: LUNA_COLORS.borderInput, marginBottom: 4, minHeight: 52 },
  inpErr: { borderColor: LUNA_COLORS.error },
  errTxt: { fontSize: 11, color: LUNA_COLORS.error, marginBottom: 6 },
  row2: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  typeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: LUNA_COLORS.surface, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle, marginRight: 6 },
  typeChipActive: { backgroundColor: LUNA_COLORS.secondary },
  typeChipText: { fontSize: 12, color: LUNA_COLORS.textPrimary },
  typeChipTextActive: { color: LUNA_COLORS.textInverse },
  errBox: { backgroundColor: LUNA_COLORS.errorLight, borderRadius: 8, padding: 10, marginTop: 8 },
  errBoxText: { fontSize: 12, color: LUNA_COLORS.error },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: LUNA_COLORS.surface, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle },
  cancelBtnText: { fontSize: 14, color: LUNA_COLORS.darkest, fontWeight: '600' },
  submitBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: LUNA_COLORS.secondary },
  submitBtnText: { fontSize: 14, color: LUNA_COLORS.textInverse, fontWeight: '700' },
  dangerBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: LUNA_COLORS.error },
  closeBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: LUNA_COLORS.darkest },
  closeBtnText: { fontSize: 14, color: LUNA_COLORS.textInverse, fontWeight: '600' },
});
