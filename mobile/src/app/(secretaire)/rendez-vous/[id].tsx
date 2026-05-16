// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPatch } from '@/src/api/client';
import { RDV } from '@/src/api/endpoints';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

type RdvStatut = 'PLANIFIE' | 'CONFIRME' | 'ARRIVE' | 'ANNULE' | 'TERMINE';

const STATUT_CONFIG: Record<RdvStatut, { label: string; color: string; bg: string }> = {
  PLANIFIE: { label: 'Planifié',  color: LUNA_COLORS.warning, bg: LUNA_COLORS.warningLight },
  CONFIRME: { label: 'Confirmé',  color: LUNA_COLORS.success, bg: LUNA_COLORS.successLight ?? '#e8f8f0' },
  ARRIVE:   { label: 'Arrivé',    color: LUNA_COLORS.info,    bg: LUNA_COLORS.infoLight },
  ANNULE:   { label: 'Annulé',    color: LUNA_COLORS.error,   bg: LUNA_COLORS.errorLight },
  TERMINE:  { label: 'Terminé',   color: LUNA_COLORS.textSecondary, bg: LUNA_COLORS.background },
};

interface RdvDetail {
  id: string | number;
  patientNom: string;
  patientPrenom: string;
  patientTelephone?: string;
  medecinNom: string;
  medecinPrenom: string;
  medecinSpecialite?: string;
  dateHeure: string;
  motif: string;
  typeRdv?: string;
  statut: RdvStatut;
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as never} size={18} color={LUNA_COLORS.secondary} />
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function RdvDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [rdv, setRdv] = useState<RdvDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await apiGet<RdvDetail>(`/api/rendez-vous/${id}`);
      setRdv(data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger le rendez-vous.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleConfirmer = async () => {
    if (!id) return;
    Alert.alert('Confirmer', 'Confirmer ce rendez-vous ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: async () => {
          setActionLoading(true);
          try {
            await apiPatch(RDV.CONFIRMER(id), {});
            Alert.alert('Succès', 'Rendez-vous confirmé.');
            load();
          } catch {
            Alert.alert('Erreur', 'Impossible de confirmer le rendez-vous.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleAnnuler = async () => {
    if (!id) return;
    Alert.alert('Annuler', 'Voulez-vous vraiment annuler ce rendez-vous ?', [
      { text: 'Retour', style: 'cancel' },
      {
        text: 'Confirmer l\'annulation',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await apiPatch(RDV.ANNULER(id), {});
            Alert.alert('Succès', 'Rendez-vous annulé.');
            load();
          } catch {
            Alert.alert('Erreur', 'Impossible d\'annuler le rendez-vous.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
      </SafeAreaView>
    );
  }

  if (!rdv) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="calendar-outline" size={48} color={LUNA_COLORS.textDisabled} />
        <Text style={styles.errorText}>Rendez-vous introuvable</Text>
      </SafeAreaView>
    );
  }

  const cfg = STATUT_CONFIG[rdv.statut] ?? STATUT_CONFIG.PLANIFIE;
  const isPlanifie = rdv.statut === 'PLANIFIE';

  const dateObj = new Date(rdv.dateHeure);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={LUNA_COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Détail rendez-vous</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Statut badge */}
        <View style={[styles.statutBanner, { backgroundColor: cfg.bg }]}>
          <Ionicons name="ellipse" size={10} color={cfg.color} />
          <Text style={[styles.statutText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>

        {/* Info card */}
        <View style={styles.card}>
          <DetailRow icon="person-outline" label="Patient" value={`${rdv.patientPrenom} ${rdv.patientNom}`} />
          {rdv.patientTelephone ? (
            <DetailRow icon="call-outline" label="Téléphone" value={rdv.patientTelephone} />
          ) : null}
          <DetailRow
            icon="medkit-outline"
            label="Médecin"
            value={`Dr ${rdv.medecinPrenom} ${rdv.medecinNom}${rdv.medecinSpecialite ? ` — ${rdv.medecinSpecialite}` : ''}`}
          />
          <DetailRow icon="calendar-outline" label="Date" value={dateStr} />
          <DetailRow icon="time-outline" label="Heure" value={timeStr} />
          {rdv.motif ? <DetailRow icon="document-text-outline" label="Motif" value={rdv.motif} /> : null}
          {rdv.typeRdv ? <DetailRow icon="pricetag-outline" label="Type" value={rdv.typeRdv} /> : null}
        </View>

        {/* Action buttons */}
        {isPlanifie && (
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, styles.btnConfirmer, actionLoading && styles.btnDisabled]}
              onPress={handleConfirmer}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              )}
              <Text style={styles.actionBtnText}>Confirmer</Text>
            </Pressable>

            <Pressable
              style={[styles.actionBtn, styles.btnAnnuler, actionLoading && styles.btnDisabled]}
              onPress={handleAnnuler}
              disabled={actionLoading}
            >
              <Ionicons name="close-circle-outline" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Annuler</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LUNA_COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { fontSize: fontSize.base, color: LUNA_COLORS.textDisabled },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.border,
    backgroundColor: LUNA_COLORS.surface,
  },
  backBtn: { padding: spacing.xs },
  title: { flex: 1, fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.textPrimary },

  scrollContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },

  statutBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.md, alignSelf: 'flex-start',
  },
  statutText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

  card: {
    backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.md,
    padding: spacing.md, borderWidth: 1, borderColor: LUNA_COLORS.border,
    gap: spacing.sm,
    ...shadows.sm as object,
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  detailValue: { fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, fontWeight: fontWeight.medium },

  actions: { flexDirection: 'row', gap: spacing.md },

  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    paddingVertical: spacing.md, borderRadius: borderRadius.md,
  },
  btnConfirmer: { backgroundColor: LUNA_COLORS.success },
  btnAnnuler: { backgroundColor: LUNA_COLORS.error },
  btnDisabled: { opacity: 0.6 },
  actionBtnText: { color: '#fff', fontSize: fontSize.base, fontWeight: fontWeight.bold },
});