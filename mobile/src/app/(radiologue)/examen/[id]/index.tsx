import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, Pressable, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPatch, apiPost } from '@/src/api/client';
import { IMAGERIES, RAPPORTS, MESSAGES } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PatientInfo {
  id: string; nom: string; prenom: string; dateNaissance?: string; sexe?: string;
}

interface MedecinInfo {
  id: string; nom: string; prenom: string; specialite?: string;
}

interface Rapport {
  id: string;
  technique?: string;
  resultat?: string;
  conclusion?: string;
  recommandation?: string;
  signe?: boolean;
  valide?: boolean;
  lienImages?: string;
  commentaireMedecin?: string;
  validateParMedecin?: boolean;
  date?: string;
}

interface Constante {
  dateHeure: string;
  tensionSystolique?: number;
  tensionDiastolique?: number;
  pouls?: number;
  spo2?: number;
  temperature?: number;
}

interface ImagerieDetail {
  id: string;
  type: string;
  typeExamen?: string;
  motif?: string;
  renseignementsCliniques?: string;
  urgence?: boolean;
  statut?: string;
  date?: string;
  datePriseEnCharge?: string;
  dateRealisation?: string;
  fichier?: string;
  patient?: PatientInfo;
  medecinDemandeur?: MedecinInfo;
  rapport?: Rapport;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAge(dateNaissance?: string): number | null {
  if (!dateNaissance) return null;
  const d = new Date(dateNaissance);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

// ── Écran ─────────────────────────────────────────────────────────────────────
export default function ExamenDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.userId);

  const [imagerie, setImagerie] = useState<ImagerieDetail | null>(null);
  const [constantes, setConstantes] = useState<Constante[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const img = await apiGet<ImagerieDetail>(IMAGERIES.BY_ID(id));
      setImagerie(img);
      if (img.patient?.id) {
        try {
          const c = await apiGet<Constante[]>(`/api/constantes-vitales/patient/${img.patient.id}`);
          setConstantes(c.slice(0, 1));
        } catch { /* ignore */ }
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de charger l\'examen.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSignRapport = async () => {
    if (!imagerie?.rapport?.id) return;
    setSigning(true);
    try {
      await apiPatch(RAPPORTS.VALIDER(imagerie.rapport.id) + `?radiologueId=${userId}`);
      Alert.alert('Succès', 'Rapport signé — le médecin a été notifié.', [
        { text: 'OK', onPress: fetchData },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible de signer le rapport.');
    } finally {
      setSigning(false);
    }
  };

  const handleMessageUrgent = async () => {
    if (!imagerie?.medecinDemandeur?.id) return;
    try {
      await apiPost(MESSAGES.SEND, {
        expediteurId: userId,
        destinataireId: imagerie.medecinDemandeur.id,
        contenu: `URGENT — Résultat imagerie ${imagerie.typeExamen ?? imagerie.type} pour ${imagerie.patient?.prenom} ${imagerie.patient?.nom}`,
        urgent: true,
      });
      Alert.alert('Envoyé', 'Message urgent transmis au médecin.');
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message.');
    }
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

  if (!imagerie) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={LUNA_COLORS.textSecondary} />
          <Text style={styles.emptyText}>Examen introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const age = getAge(imagerie.patient?.dateNaissance);
  const statut = imagerie.statut ?? 'EN_ATTENTE';
  const hasRapport = !!imagerie.rapport;
  const isSigne = imagerie.rapport?.signe ?? false;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={LUNA_COLORS.dark} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>
          {imagerie.typeExamen ?? imagerie.type}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Urgence badge */}
        {imagerie.urgence && (
          <View style={styles.urgenceBanner}>
            <Ionicons name="warning" size={18} color={LUNA_COLORS.error} />
            <Text style={styles.urgenceText}>Demande urgente</Text>
          </View>
        )}

        {/* SECTION 1 — Patient info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Patient</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nom</Text>
            <Text style={styles.infoValue}>{imagerie.patient?.prenom} {imagerie.patient?.nom}</Text>
          </View>
          {age != null && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Âge</Text>
              <Text style={styles.infoValue}>{age} ans</Text>
            </View>
          )}
          {imagerie.patient?.sexe && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sexe</Text>
              <Text style={styles.infoValue}>{imagerie.patient.sexe}</Text>
            </View>
          )}
        </View>

        {/* Motif */}
        {imagerie.motif && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Motif de l'examen</Text>
            <Text style={styles.textBody}>{imagerie.motif}</Text>
          </View>
        )}

        {/* Renseignements cliniques */}
        {imagerie.renseignementsCliniques && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Renseignements cliniques</Text>
            <Text style={styles.textBody}>{imagerie.renseignementsCliniques}</Text>
          </View>
        )}

        {/* Constantes */}
        {constantes.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Constantes du jour</Text>
            {constantes.map((c, i) => (
              <View key={i} style={styles.constantesRow}>
                <Text style={styles.constanteItem}>TA {c.tensionSystolique ?? '—'}/{c.tensionDiastolique ?? '—'}</Text>
                <Text style={styles.constanteItem}>Pouls {c.pouls ?? '—'} bpm</Text>
                <Text style={styles.constanteItem}>SpO₂ {c.spo2 ?? '—'} %</Text>
                <Text style={styles.constanteItem}>Temp {c.temperature ?? '—'} °C</Text>
              </View>
            ))}
          </View>
        )}

        {/* SECTION 2 — Exam info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Détails de l'examen</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{imagerie.typeExamen ?? imagerie.type}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date demande</Text>
            <Text style={styles.infoValue}>{imagerie.date ? new Date(imagerie.date).toLocaleDateString('fr-FR') : '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Statut</Text>
            <Text style={[styles.infoValue, { color: statut === 'VALIDE' ? LUNA_COLORS.success : statut === 'REALISE' ? LUNA_COLORS.info : LUNA_COLORS.warning }]}>{statut}</Text>
          </View>
          {imagerie.medecinDemandeur && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Médecin demandeur</Text>
              <Text style={styles.infoValue}>Dr {imagerie.medecinDemandeur.prenom} {imagerie.medecinDemandeur.nom} {imagerie.medecinDemandeur.specialite ? `— ${imagerie.medecinDemandeur.specialite}` : ''}</Text>
            </View>
          )}
        </View>

        {/* SECTION 3 — Images PACS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Images</Text>
          {imagerie.fichier && imagerie.fichier.startsWith('http') ? (
            <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(imagerie.fichier!)}>
              <Ionicons name="open-outline" size={16} color={LUNA_COLORS.textInverse} />
              <Text style={styles.linkBtnText}>Voir les images</Text>
            </TouchableOpacity>
          ) : imagerie.rapport?.lienImages ? (
            <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(imagerie.rapport!.lienImages!)}>
              <Ionicons name="open-outline" size={16} color={LUNA_COLORS.textInverse} />
              <Text style={styles.linkBtnText}>Voir les images PACS</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptyText}>Images non disponibles</Text>
          )}
        </View>

        {/* SECTION 4 — Rapport */}
        {hasRapport && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Rapport</Text>
            {imagerie.rapport!.technique && (
              <View style={styles.rapportBlock}>
                <Text style={styles.rapportLabel}>Technique</Text>
                <Text style={styles.rapportText}>{imagerie.rapport!.technique}</Text>
              </View>
            )}
            {imagerie.rapport!.resultat && (
              <View style={styles.rapportBlock}>
                <Text style={styles.rapportLabel}>Résultat</Text>
                <Text style={styles.rapportText}>{imagerie.rapport!.resultat}</Text>
              </View>
            )}
            {imagerie.rapport!.conclusion && (
              <View style={styles.rapportBlock}>
                <Text style={styles.rapportLabel}>Conclusion</Text>
                <Text style={styles.rapportText}>{imagerie.rapport!.conclusion}</Text>
              </View>
            )}
            {imagerie.rapport!.recommandation && (
              <View style={styles.rapportBlock}>
                <Text style={styles.rapportLabel}>Recommandation</Text>
                <Text style={styles.rapportText}>{imagerie.rapport!.recommandation}</Text>
              </View>
            )}
            {isSigne && (
              <View style={styles.signedBadge}>
                <Ionicons name="shield-checkmark" size={14} color={LUNA_COLORS.success} />
                <Text style={styles.signedText}>Rapport signé</Text>
              </View>
            )}
          </View>
        )}

        {/* Bottom buttons */}
        <View style={styles.actions}>
          {statut === 'PRISE_EN_CHARGE' && !hasRapport && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: LUNA_COLORS.secondary }]}
              onPress={() => router.push(`/(radiologue)/examen/${id}/rapport` as never)}
            >
              <Ionicons name="create-outline" size={18} color={LUNA_COLORS.textInverse} />
              <Text style={styles.actionBtnText}>Rédiger le rapport</Text>
            </TouchableOpacity>
          )}

          {hasRapport && !isSigne && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: LUNA_COLORS.success }]}
              onPress={handleSignRapport}
              disabled={signing}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={LUNA_COLORS.textInverse} />
              <Text style={styles.actionBtnText}>{signing ? 'Signature…' : 'Signer le rapport'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtnOutline, { borderColor: LUNA_COLORS.error }]}
            onPress={handleMessageUrgent}
          >
            <Ionicons name="alert-circle-outline" size={18} color={LUNA_COLORS.error} />
            <Text style={[styles.actionBtnOutlineText, { color: LUNA_COLORS.error }]}>Message urgent au médecin</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: LUNA_COLORS.surface, ...(shadows.sm as object) },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  scroll: { padding: spacing.xxl, paddingBottom: 80 },
  emptyText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  urgenceBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: LUNA_COLORS.errorLight, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.lg },
  urgenceText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.error },
  // ✨ Carte HeroUI — borderSubtle + shadow sm
  card: { backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg, padding: spacing.xxl, marginBottom: spacing.lg, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle, ...(shadows.sm as object) },
  // ✨ Titre de section — typography.sectionTitle
  sectionTitle: { ...typography.sectionTitle, marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(197, 220, 234, 0.6)' },
  infoLabel: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  infoValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark, flex: 1, textAlign: 'right' },
  textBody: { fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, lineHeight: 22 },
  constantesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  constanteItem: { fontSize: fontSize.sm, color: LUNA_COLORS.dark, backgroundColor: LUNA_COLORS.background, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  linkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: LUNA_COLORS.secondary, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  linkBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.textInverse },
  rapportBlock: { marginBottom: spacing.md },
  rapportLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark, marginBottom: spacing.xs },
  rapportText: { fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, lineHeight: 22 },
  signedBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: LUNA_COLORS.successLight, padding: spacing.md, borderRadius: borderRadius.md, alignSelf: 'flex-start' },
  signedText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.success },
  actions: { gap: spacing.md, marginTop: spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  actionBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: LUNA_COLORS.textInverse },
  actionBtnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: borderRadius.md, borderWidth: 1.5, backgroundColor: LUNA_COLORS.surface },
  actionBtnOutlineText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
});
