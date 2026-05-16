import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, Card, EmptyState, LoadingOverlay } from '@/src/components/common';
import type { BadgeColor } from '@/src/components/common';
import { apiGet } from '@/src/api/client';
import { RDV } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
type RdvStatut = 'PLANIFIE' | 'CONFIRME' | 'ARRIVE' | 'ANNULE' | 'TERMINE';

interface RdvItem {
  id:              string;
  dateHeure:       string;
  statut:          RdvStatut;
  motif?:          string;
  typeRdv?:        string;
  patientId:       string;
  patientNom:      string;
  patientPrenom:   string;
  patientTelephone?: string;
  medecinId?:      string;
  medecinNom?:     string;
  medecinPrenom?:  string;
  medecinSpecialite?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateWeekDays(): { label: string; value: string }[] {
  const days: { label: string; value: string }[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
      value: d.toISOString().slice(0, 10),
    });
  }
  return days;
}

function extractTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(nom: string, prenom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

const STATUT_CONFIG: Record<RdvStatut, { label: string; color: BadgeColor }> = {
  PLANIFIE: { label: 'Planifié', color: 'warning' },
  CONFIRME: { label: 'Confirmé', color: 'success' },
  ARRIVE:   { label: 'Arrivé',   color: 'info'    },
  ANNULE:   { label: 'Annulé',   color: 'error'   },
  TERMINE:  { label: 'Terminé',  color: 'secondary' },
};

const WEEK_DAYS = generateWeekDays();

// ── BottomSheet ───────────────────────────────────────────────────────────────
function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible:  boolean;
  onClose:  () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={bsStyles.backdrop}>
        <Pressable style={bsStyles.overlayTap} onPress={onClose} />
        <View style={bsStyles.sheet}>
          <View style={bsStyles.handle} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const bsStyles = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: LUNA_COLORS.overlay,
    justifyContent:  'flex-end',
  },
  overlayTap: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor:     LUNA_COLORS.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal:   spacing.xxl,
    paddingTop:          spacing.lg,
    paddingBottom:       spacing.huge,
    ...(shadows.xl as object),
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    borderRadius.full,
    backgroundColor: LUNA_COLORS.borderDark,
    alignSelf:       'center',
    marginBottom:    spacing.lg,
  },
});

// ── Écran Planning ────────────────────────────────────────────────────────────
export default function PlanningScreen(): React.JSX.Element {
  const router   = useRouter();
  const medecinId = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [selectedDate, setSelectedDate] = useState<string>(WEEK_DAYS[0].value);
  const [rdvs,          setRdvs]          = useState<RdvItem[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [selectedRdv,   setSelectedRdv]   = useState<RdvItem | null>(null);
  const [sheetVisible,  setSheetVisible]  = useState(false);

  const loadRdvs = useCallback(async (date: string) => {
    if (!medecinId) return;
    setLoading(true);
    try {
      const data = await apiGet<RdvItem[]>(
        cliniqueId
          ? `${RDV.BY_CLINIQUE(cliniqueId)}?date=${date}`
          : `${RDV.BY_MEDECIN(medecinId)}?date=${date}`
      );
      const sorted = [...data].sort(
        (a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime()
      );
      setRdvs(sorted);
    } catch {
      setRdvs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medecinId, cliniqueId]);

  useEffect(() => { loadRdvs(selectedDate); }, [selectedDate, loadRdvs]);

  function handleDaySelect(date: string) {
    setSelectedDate(date);
  }

  function openSheet(rdv: RdvItem) {
    setSelectedRdv(rdv);
    setSheetVisible(true);
  }

  function closeSheet() {
    setSheetVisible(false);
    setSelectedRdv(null);
  }

  function goToConsultation(rdv: RdvItem) {
    closeSheet();
    router.push(
      `/(medecin)/patients/${rdv.patientId}/consultation?rdvId=${rdv.id}` as never
    );
  }

  function goToDossier(rdv: RdvItem) {
    closeSheet();
    router.push(`/(medecin)/patients/${rdv.patientId}/dossier` as never);
  }

  // ── Rendu carte RDV ─────────────────────────────────────────────────────────
  function renderRdvCard({ item }: { item: RdvItem }) {
    const cfg = STATUT_CONFIG[item.statut];
    return (
      <Pressable onPress={() => openSheet(item)}>
        <View style={cardStyles.container}>
          <View style={cardStyles.leftBar} />
          <View style={cardStyles.content}>
            <View style={cardStyles.topRow}>
              <Text style={cardStyles.time}>{extractTime(item.dateHeure)}</Text>
              <Badge label={cfg.label} color={cfg.color} />
            </View>
            <Text style={cardStyles.patientName}>
              {item.patientPrenom} {item.patientNom}
            </Text>
            {item.motif ? (
              <Text style={cardStyles.motif} numberOfLines={1}>{item.motif}</Text>
            ) : null}
            {item.typeRdv ? (
              <Text style={cardStyles.type}>{item.typeRdv}</Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textSecondary} />
        </View>
      </Pressable>
    );
  }

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon planning</Text>
        <Text style={styles.headerSub}>
          {rdvs.length > 0 ? `${rdvs.length} RDV aujourd'hui` : 'Aucun RDV programmé'}
        </Text>
      </View>

      {/* Sélecteur jours */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.weekScroll}
        contentContainerStyle={styles.weekContent}
      >
        {WEEK_DAYS.map((day) => {
          const active = selectedDate === day.value;
          return (
            <Pressable
              key={day.value}
              onPress={() => handleDaySelect(day.value)}
              style={[styles.dayChip, active && styles.dayChipActive]}
            >
              <Text style={[styles.dayTxt, active && styles.dayTxtActive]}>
                {day.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Liste des RDV */}
      {loading ? (
        <ActivityIndicator
          color={LUNA_COLORS.secondary}
          style={{ marginTop: spacing.xl }}
        />
      ) : (
        <FlatList
          data={rdvs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRdvCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadRdvs(selectedDate); }}
              tintColor={LUNA_COLORS.secondary}
              colors={[LUNA_COLORS.secondary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="Aucun rendez-vous"
              subtitle="Pas de consultation ce jour-là."
            />
          }
        />
      )}

      {/* BottomSheet détails RDV */}
      <BottomSheet visible={sheetVisible} onClose={closeSheet}>
        {selectedRdv ? (
          <View>
            {/* En-tête sheet */}
              <View style={sheetStyles.patientRow}>
              <View style={sheetStyles.avatar}>
                <Text style={sheetStyles.avatarTxt}>
                  {getInitials(selectedRdv.patientNom, selectedRdv.patientPrenom)}
                </Text>
              </View>
              <View>
                <Text style={sheetStyles.patientName}>
                  {selectedRdv.patientPrenom} {selectedRdv.patientNom}
                </Text>
                <Text style={sheetStyles.time}>{extractTime(selectedRdv.dateHeure)}</Text>
              </View>
            </View>

            {/* Détails */}
            <Card style={sheetStyles.detailCard}>
              <DetailRow icon="calendar-outline" label="Date"
                value={new Date(selectedRdv.dateHeure).toLocaleDateString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              />
              {selectedRdv.motif ? (
                <DetailRow icon="document-text-outline" label="Motif" value={selectedRdv.motif} />
              ) : null}
              {selectedRdv.typeRdv ? (
                <DetailRow icon="medical-outline" label="Type" value={selectedRdv.typeRdv} />
              ) : null}
              <View style={sheetStyles.badgeRow}>
                <Ionicons name="ellipse-outline" size={16} color={LUNA_COLORS.secondary} />
                <Text style={sheetStyles.detailLabel}>Statut</Text>
                <Badge
                  label={STATUT_CONFIG[selectedRdv.statut].label}
                  color={STATUT_CONFIG[selectedRdv.statut].color}
                />
              </View>
            </Card>

            {/* Actions */}
            <View style={sheetStyles.actions}>
              <Button
                title="Commencer consultation"
                onPress={() => goToConsultation(selectedRdv)}
                fullWidth
                size="lg"
              />
              <Button
                title="Voir le dossier patient"
                variant="secondary"
                onPress={() => goToDossier(selectedRdv)}
                fullWidth
                size="lg"
              />
            </View>
          </View>
        ) : null}
      </BottomSheet>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={sheetStyles.detailRow}>
      <Ionicons name={icon as never} size={16} color={LUNA_COLORS.secondary} />
      <Text style={sheetStyles.detailLabel}>{label}</Text>
      <Text style={sheetStyles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const sheetStyles = StyleSheet.create({
  patientRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.md,
    marginBottom:  spacing.lg,
  },
  avatar: {
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarTxt:   { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.lg },
  patientName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  time:        { fontSize: fontSize.sm, color: LUNA_COLORS.secondary, marginTop: 2 },
  detailCard:  { marginBottom: spacing.xl },
  detailRow:   {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:            spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing.sm,
    paddingVertical: spacing.xs,
  },
  detailLabel: { width: 50, fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  detailValue: {
    flex:       1,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
    color:      LUNA_COLORS.darkest,
  },
  actions: { gap: spacing.md },
});

const cardStyles = StyleSheet.create({
  container: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  LUNA_COLORS.surface,
    borderRadius:     borderRadius.md,
    marginBottom:     spacing.md,
    overflow:         'hidden',
    ...(shadows.sm as object),
  },
  leftBar: {
    width:           4,
    alignSelf:       'stretch',
    backgroundColor: LUNA_COLORS.secondary,
  },
  content: {
    flex:    1,
    padding: spacing.lg,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   spacing.xs,
  },
  time:        { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.secondary },
  patientName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  motif:       { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  type:        { fontSize: fontSize.xs, color: LUNA_COLORS.tertiary, marginTop: 2 },
});

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingVertical:   spacing.lg,
    backgroundColor:   LUNA_COLORS.surface,
    ...(shadows.sm as object),
  },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  headerSub:   { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  weekScroll:  { flexGrow: 0, backgroundColor: LUNA_COLORS.surface, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.border },
  weekContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  dayChip: {
    paddingVertical:   spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius:      borderRadius.full,
    backgroundColor:   LUNA_COLORS.surfaceLight,
    borderWidth:       1,
    borderColor:       LUNA_COLORS.borderDark,
  },
  dayChipActive: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  dayTxt:        { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, fontWeight: fontWeight.medium },
  dayTxtActive:  { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  listContent:   { paddingHorizontal: spacing.xxl, paddingTop: spacing.md, paddingBottom: 80 },
});
