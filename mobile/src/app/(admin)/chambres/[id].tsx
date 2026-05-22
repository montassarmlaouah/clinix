import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, Modal, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';

import { LUNA_COLORS } from '@/src/theme/colors';
import { apiGet, apiPut, apiDelete } from '@/src/api/client';
import { CHAMBRES, SERVICES } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { spacing, borderRadius, shadows } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
type TypeChambre = 'SIMPLE' | 'DOUBLE' | 'SUITE' | 'REANIMATION' | 'URGENCE';
type StatutChambre = 'DISPONIBLE' | 'OCCUPEE' | 'EN_MAINTENANCE';

interface ServiceMedical { id: number; nom: string; }

interface Chambre {
  id: string;
  numero: string;
  type: TypeChambre;
  capacite: number;
  nombreLits?: number;
  statut: StatutChambre;
  service?: { id: number; nom: string };
  equipements?: string[];
  patient?: { id: string; nom: string; prenom: string } | null;
}

const editSchema = z.object({
  numero: z.string().min(1, 'Numéro requis'),
  type: z.enum(['SIMPLE', 'DOUBLE', 'SUITE', 'REANIMATION', 'URGENCE']),
  capacite: z.string().min(1, 'Capacité requise'),
  nombreLits: z.string().optional(),
  serviceId: z.string().optional(),
});

type EditForm = z.infer<typeof editSchema>;

const statutCfg = (s?: StatutChambre) => {
  if (s === 'DISPONIBLE') return { bg: LUNA_COLORS.successLight, color: LUNA_COLORS.success, label: '✅ DISPONIBLE' };
  if (s === 'OCCUPEE') return { bg: LUNA_COLORS.errorLight, color: LUNA_COLORS.error, label: '🔴 OCCUPÉE' };
  return { bg: LUNA_COLORS.warningLight, color: LUNA_COLORS.warning, label: '🔧 EN MAINTENANCE' };
};

// ── Écran ─────────────────────────────────────────────────────────────────────
export default function ChambreDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [chambre, setChambre] = useState<Chambre | null>(null);
  const [services, setServices] = useState<ServiceMedical[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { numero: '', type: 'SIMPLE', capacite: '', nombreLits: '', serviceId: '' },
  });

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [c, s] = await Promise.all([
        apiGet<Chambre>(CHAMBRES.BY_ID(id)).catch(() => null),
        apiGet<ServiceMedical[]>(SERVICES.BY_CLINIQUE(String(cliniqueId))).catch(() => []),
      ]);
      setChambre(c);
      setServices(Array.isArray(s) ? s : []);
      if (c) {
        reset({
          numero: c.numero,
          type: c.type,
          capacite: String(c.capacite),
          nombreLits: c.nombreLits != null ? String(c.nombreLits) : '',
          serviceId: c.service?.id ? String(c.service.id) : '',
        });
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [id, cliniqueId, reset]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSubmit = async (data: EditForm) => {
    if (!id) return;
    setSaving(true); setSubmitError(null);
    try {
      await apiPut(CHAMBRES.UPDATE(id), {
        numero: data.numero,
        type: data.type,
        capacite: parseInt(data.capacite) || 1,
        nombreLits: data.nombreLits ? parseInt(data.nombreLits) : undefined,
        serviceId: data.serviceId || undefined,
        cliniqueId: String(cliniqueId),
      });
      await fetchData();
      setShowEdit(false);
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Erreur');
    } finally { setSaving(false); }
  };

  const handleDelete = () => {
    if (!chambre || chambre.statut !== 'DISPONIBLE') {
      Alert.alert('Impossible', 'Seules les chambres disponibles peuvent être supprimées.');
      return;
    }
    Alert.alert(
      'Supprimer la chambre',
      `Confirmer la suppression de "${chambre.numero}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDelete(CHAMBRES.DELETE(chambre.id));
              router.back();
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer la chambre.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!chambre) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={LUNA_COLORS.textSecondary} />
          <Text style={styles.emptyText}>Chambre introuvable</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sc = statutCfg(chambre.statut);
  const canDelete = chambre.statut === 'DISPONIBLE';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={LUNA_COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>Chambre {chambre.numero}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusBannerText, { color: sc.color }]}>{sc.label}</Text>
        </View>

        {/* Details card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Détails</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Numéro</Text>
            <Text style={styles.detailValue}>{chambre.numero}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{chambre.type}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Capacité</Text>
            <Text style={styles.detailValue}>{chambre.capacite} personnes</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Lits</Text>
            <Text style={styles.detailValue}>{chambre.nombreLits ?? 0}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>{chambre.service?.nom ?? '—'}</Text>
          </View>
          {chambre.equipements && chambre.equipements.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Équipements</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1, justifyContent: 'flex-end' }}>
                {chambre.equipements.map((e, i) => (
                  <View key={i} style={styles.eqBadge}><Text style={styles.eqBadgeText}>{e}</Text></View>
                ))}
              </View>
            </View>
          )}
          {chambre.patient && (
            <View style={[styles.patientRow, { marginTop: spacing.sm }]}>
              <Ionicons name="person-outline" size={16} color={LUNA_COLORS.info ?? LUNA_COLORS.secondary} />
              <Text style={styles.patientText}>Occupée par : {chambre.patient.prenom} {chambre.patient.nom}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: LUNA_COLORS.secondary }]} onPress={() => setShowEdit(true)}>
            <Ionicons name="create-outline" size={18} color={LUNA_COLORS.textInverse} />
            <Text style={styles.actionBtnText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: canDelete ? LUNA_COLORS.error : '#D0D0D0' }]}
            onPress={handleDelete}
            disabled={!canDelete}
          >
            <Ionicons name="trash-outline" size={18} color={LUNA_COLORS.textInverse} />
            <Text style={styles.actionBtnText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.mHeader}>
              <Ionicons name="create-outline" size={22} color={LUNA_COLORS.textInverse} />
              <Text style={styles.mTitle}>Modifier {chambre.numero}</Text>
              <TouchableOpacity onPress={() => setShowEdit(false)}>
                <Ionicons name="close" size={22} color={LUNA_COLORS.textInverse} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.mBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fLabel}>Numéro *</Text>
              <Controller control={control} name="numero" render={({ field: { onChange, value } }) => (
                <TextInput style={[styles.inp, errors.numero && styles.inpErr]} value={value} onChangeText={onChange} placeholder="Ex: 101" placeholderTextColor={LUNA_COLORS.textSecondary} />
              )} />
              {errors.numero && <Text style={styles.errTxt}>{errors.numero.message}</Text>}

              <Text style={styles.fLabel}>Type *</Text>
              <Controller control={control} name="type" render={({ field: { value, onChange } }) => (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {(['SIMPLE', 'DOUBLE', 'SUITE', 'REANIMATION', 'URGENCE'] as TypeChambre[]).map(t => (
                    <TouchableOpacity key={t} style={[styles.typeChip, value === t && styles.typeChipActive]} onPress={() => onChange(t)}>
                      <Text style={[styles.typeChipText, value === t && styles.typeChipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )} />

              <View style={styles.row2}>
                <View style={styles.half}>
                  <Text style={styles.fLabel}>Capacité *</Text>
                  <Controller control={control} name="capacite" render={({ field: { onChange, value } }) => (
                    <TextInput style={[styles.inp, errors.capacite && styles.inpErr]} value={value} onChangeText={onChange} keyboardType="number-pad" placeholder="1" placeholderTextColor={LUNA_COLORS.textSecondary} />
                  )} />
                </View>
                <View style={styles.half}>
                  <Text style={styles.fLabel}>Nombre lits</Text>
                  <Controller control={control} name="nombreLits" render={({ field: { onChange, value } }) => (
                    <TextInput style={styles.inp} value={value} onChangeText={onChange} keyboardType="number-pad" placeholder="0" placeholderTextColor={LUNA_COLORS.textSecondary} />
                  )} />
                </View>
              </View>

              <Text style={styles.fLabel}>Service</Text>
              <Controller control={control} name="serviceId" render={({ field: { value, onChange } }) => (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {services.map(s => (
                    <TouchableOpacity key={s.id} style={[styles.typeChip, value === String(s.id) && styles.typeChipActive]} onPress={() => onChange(String(s.id))}>
                      <Text style={[styles.typeChipText, value === String(s.id) && styles.typeChipTextActive]}>{s.nom}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )} />

              {submitError && <View style={styles.errBox}><Text style={styles.errBoxText}>{submitError}</Text></View>}
            </ScrollView>
            <View style={styles.mFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEdit(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.5 }]} onPress={handleSubmit(onSubmit)} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color={LUNA_COLORS.textInverse} /> : <Text style={styles.submitBtnText}>Enregistrer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: LUNA_COLORS.surface,
    ...(shadows.sm as object),
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  scroll: { padding: spacing.xxl, paddingBottom: 80 },
  emptyText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: spacing.sm },
  backBtnText: { fontSize: fontSize.sm, color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold, marginTop: spacing.md },
  statusBanner: { borderRadius: borderRadius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.lg, alignItems: 'center' },
  statusBannerText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  // ✨ Carte HeroUI — borderSubtle + shadow sm
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  // ✨ Titre de section — typography.sectionTitle
  sectionTitle: { ...typography.sectionTitle, marginBottom: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(197, 220, 234, 0.6)' },
  detailLabel: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  detailValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  eqBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.sm, backgroundColor: `${LUNA_COLORS.secondary}26` },
  eqBadgeText: { fontSize: 10, color: LUNA_COLORS.secondary },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: LUNA_COLORS.infoLight ?? '#E3F4F7', padding: spacing.md, borderRadius: borderRadius.md },
  patientText: { fontSize: fontSize.sm, color: LUNA_COLORS.info ?? LUNA_COLORS.secondary, fontWeight: fontWeight.medium },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  actionBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.textInverse },
  overlay: { flex: 1, backgroundColor: LUNA_COLORS.overlay, justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: LUNA_COLORS.surface, borderRadius: 16, overflow: 'hidden' },
  mHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: LUNA_COLORS.dark },
  mTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: LUNA_COLORS.textInverse },
  mBody: { padding: 16 },
  mFooter: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(197, 220, 234, 0.6)' },
  fLabel: { fontSize: 12, fontWeight: '600', color: LUNA_COLORS.textPrimary, marginBottom: 4, marginTop: 8 },
  // ✨ Input HeroUI — inputBg, minHeight 52
  inp: { backgroundColor: LUNA_COLORS.inputBg, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 14, color: LUNA_COLORS.textPrimary, borderWidth: 1, borderColor: LUNA_COLORS.borderInput, marginBottom: 4, minHeight: 52 },
  inpErr: { borderColor: LUNA_COLORS.error },
  errTxt: { fontSize: 11, color: LUNA_COLORS.error, marginBottom: 6 },
  row2: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: LUNA_COLORS.surface, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle, marginRight: 6 },
  typeChipActive: { backgroundColor: LUNA_COLORS.secondary },
  typeChipText: { fontSize: 12, color: LUNA_COLORS.textPrimary },
  typeChipTextActive: { color: LUNA_COLORS.textInverse },
  errBox: { backgroundColor: LUNA_COLORS.errorLight, borderRadius: 8, padding: 10, marginTop: 8 },
  errBoxText: { fontSize: 12, color: LUNA_COLORS.error },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: LUNA_COLORS.surface, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle },
  cancelBtnText: { fontSize: 14, color: LUNA_COLORS.darkest, fontWeight: '600' },
  submitBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: LUNA_COLORS.secondary },
  submitBtnText: { fontSize: 14, color: LUNA_COLORS.textInverse, fontWeight: '700' },
});
