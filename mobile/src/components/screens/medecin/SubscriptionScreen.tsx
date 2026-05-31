/**
 * SubscriptionScreen — Abonnement + Tarifs + Paiement en un seul écran tabbed.
 * Utilisé par médecin et admin clinique (parité web mon-abonnement).
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { AbonnementPaiementScreen } from '@/src/components/screens/AbonnementPaiementScreen';
import { AbonnementTarifsScreen } from '@/src/components/screens/AbonnementTarifsScreen';
import { SegmentTabs } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { useSubscriptionStatus } from '@/src/hooks/useSubscriptionStatus';
import {
  fetchHistoriqueAbonnements,
  fetchOffresActives,
  fetchSmsQuota,
  type AbonnementSummary,
  type OffreAbonnementSummary,
  type SmsQuotaStatus,
} from '@/src/services/billing.service';
import { resolveBillingScope } from '@/src/utils/billingScope';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function joursRestants(dateFin?: string): number | null {
  if (!dateFin) return null;
  const fin = new Date(dateFin);
  const now = new Date();
  const diff = Math.ceil((fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function StatusTab({
  onChangeTab,
  explicitScope,
  showSmsQuota = false,
}: {
  onChangeTab: (s: SubscriptionStep) => void;
  explicitScope?: 'clinique' | 'cabinet';
  showSmsQuota?: boolean;
}): React.JSX.Element {
  const { status, loading, refetch } = useSubscriptionStatus(5 * 60 * 1000, explicitScope);
  const estCabinet = useAuthStore((s) => s.estCabinet);
  const accesCabinet = useAuthStore((s) => s.accesCabinet);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const billingScope = resolveBillingScope(estCabinet, cliniqueId, explicitScope, accesCabinet);

  const [offres, setOffres] = useState<OffreAbonnementSummary[]>([]);
  const [historique, setHistorique] = useState<AbonnementSummary[]>([]);
  const [smsQuota, setSmsQuota] = useState<SmsQuotaStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadExtras = useCallback(async () => {
    const [hist, off, sms] = await Promise.all([
      fetchHistoriqueAbonnements(billingScope),
      fetchOffresActives(billingScope),
      showSmsQuota ? fetchSmsQuota() : Promise.resolve(null),
    ]);
    setHistorique(hist);
    setOffres(off);
    setSmsQuota(sms);
  }, [billingScope, showSmsQuota]);

  useEffect(() => {
    void loadExtras();
  }, [loadExtras]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([refetch(), loadExtras()]).finally(() => setRefreshing(false));
  }, [refetch, loadExtras]);

  const isActive = status?.accesAutorise === true || status?.statut === 'ACTIF';
  const isExpired = status?.statut === 'EXPIRE' || status?.statut === 'IMPAYE';
  const jours = joursRestants(status?.dateFin);

  if (loading) {
    return (
      <View style={subStyles.center}>
        <ActivityIndicator color={LUNA_COLORS.secondary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={subStyles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={LUNA_COLORS.secondary}
          colors={[LUNA_COLORS.secondary]}
        />
      }
    >
      <View style={subStyles.iconRow}>
        <Ionicons name="card-outline" size={28} color={LUNA_COLORS.secondary} />
        <Text style={subStyles.heading}>Mon abonnement</Text>
      </View>

      {status ? (
        <View style={subStyles.statusCard}>
          <View
            style={[
              subStyles.badge,
              isActive ? subStyles.badgeActive : isExpired ? subStyles.badgeWarning : subStyles.badgeInactive,
            ]}
          >
            <Text style={subStyles.badgeText}>
              {isActive ? '✅ Actif' : isExpired ? '⚠️ Expiré' : 'Inactif'}
            </Text>
          </View>
          {status.offreNom ? <Text style={subStyles.offreName}>{status.offreNom}</Text> : null}
          {(status.datePremierPaiement || status.dateDebut) ? (
            <View style={subStyles.row}>
              <Ionicons name="calendar-outline" size={16} color={LUNA_COLORS.textSecondary} />
              <Text style={subStyles.rowLabel}>Premier paiement</Text>
              <Text style={subStyles.rowValue}>
                {formatDate(status.datePremierPaiement ?? status.dateDebut)}
              </Text>
            </View>
          ) : null}
          {status.dateFin ? (
            <View style={subStyles.row}>
              <Ionicons name="calendar-outline" size={16} color={LUNA_COLORS.textSecondary} />
              <Text style={subStyles.rowLabel}>Fin</Text>
              <Text style={subStyles.rowValue}>{formatDate(status.dateFin)}</Text>
            </View>
          ) : null}
          {jours != null && isActive ? (
            <View style={subStyles.daysRow}>
              <Text style={subStyles.daysNum}>{jours}</Text>
              <Text style={subStyles.daysLabel}>jour(s) restant(s)</Text>
            </View>
          ) : null}
          {isExpired && (
            <Text style={subStyles.graceText}>
              Période de grâce active. Les nouvelles créations sont bloquées, la consultation reste accessible.
            </Text>
          )}
        </View>
      ) : (
        <View style={subStyles.empty}>
          <Ionicons name="information-circle-outline" size={48} color={LUNA_COLORS.textSecondary} />
          <Text style={subStyles.emptyTitle}>Aucun abonnement actif</Text>
          <Text style={subStyles.emptySub}>
            Souscrivez à une offre pour débloquer toutes les fonctionnalités.
          </Text>
          <Pressable style={subStyles.souscrireBtn} onPress={() => onChangeTab('tarifs')}>
            <Ionicons name="grid-outline" size={16} color={LUNA_COLORS.textInverse} />
            <Text style={subStyles.souscireBtnTxt}>Voir les forfaits</Text>
          </Pressable>
        </View>
      )}

      {showSmsQuota && smsQuota ? (
        <View style={subStyles.statusCard}>
          <Text style={subStyles.sectionTitle}>Quota SMS</Text>
          <Text style={subStyles.offreDesc}>{smsQuota.offreNom ?? 'Offre active'}</Text>
          <View style={subStyles.progressTrack}>
            <View
              style={[
                subStyles.progressFill,
                {
                  width: `${Math.min(
                    100,
                    ((smsQuota.utilises ?? 0) / Math.max(1, smsQuota.limite ?? 1)) * 100,
                  )}%`,
                },
              ]}
            />
          </View>
          <Text style={subStyles.offreDesc}>
            {smsQuota.utilises ?? 0} / {smsQuota.limite ?? 0} SMS utilisés
            {smsQuota.restants != null ? ` · ${smsQuota.restants} restants` : ''}
          </Text>
          {smsQuota.message ? (
            <Text style={[subStyles.offreDesc, { color: LUNA_COLORS.warning }]}>{smsQuota.message}</Text>
          ) : null}
        </View>
      ) : null}

      {historique.length > 0 ? (
        <>
          <Text style={subStyles.sectionTitle}>Historique</Text>
          {historique.map((h) => (
            <View key={h.id ?? `${h.dateDebut}-${h.offreNom}`} style={subStyles.offreCard}>
              <Text style={subStyles.offreNom}>{h.offreNom ?? '—'}</Text>
              <Text style={subStyles.offrePrix}>
                {h.statut} · {formatDate(h.dateDebut)} → {formatDate(h.dateFin)}
              </Text>
              {(h.montantPaye ?? 0) > 0 ? (
                <Text style={subStyles.offreDesc}>{h.montantPaye} TND payés</Text>
              ) : null}
            </View>
          ))}
        </>
      ) : null}

      <Text style={subStyles.sectionTitle}>Offres disponibles</Text>
      {offres.length === 0 ? (
        <Text style={subStyles.noOffres}>Aucune offre disponible pour le moment.</Text>
      ) : (
        offres.map((offre) => (
          <View key={offre.id} style={subStyles.offreCard}>
            <Text style={subStyles.offreNom}>{offre.nom}</Text>
            <Text style={subStyles.offrePrix}>
              {offre.prixMensuel ?? 0} TND / mois
            </Text>
            {offre.description ? <Text style={subStyles.offreDesc}>{offre.description}</Text> : null}
            {!isActive ? (
              <Pressable style={subStyles.souscrireBtn} onPress={() => onChangeTab('tarifs')}>
                <Ionicons name="checkmark-circle-outline" size={16} color={LUNA_COLORS.textInverse} />
                <Text style={subStyles.souscireBtnTxt}>Souscrire</Text>
              </Pressable>
            ) : (
              <Text style={subStyles.paidHint}>Forfait actif — aucun nouveau paiement requis.</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const subStyles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 80 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  heading: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  statusCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    ...(shadows.sm as object),
  },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  badgeActive: { backgroundColor: LUNA_COLORS.successLight },
  badgeInactive: { backgroundColor: LUNA_COLORS.errorLight },
  badgeWarning: { backgroundColor: LUNA_COLORS.warningLight },
  badgeText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  offreName: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowLabel: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, width: 110 },
  rowValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.dark, flex: 1 },
  graceText: { fontSize: fontSize.sm, color: LUNA_COLORS.warning, marginTop: spacing.sm, fontWeight: fontWeight.medium },
  daysRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  daysNum: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: LUNA_COLORS.secondary },
  daysLabel: { fontSize: fontSize.base, color: LUNA_COLORS.textSecondary },
  progressTrack: {
    height: 8,
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginVertical: spacing.sm,
  },
  progressFill: { height: '100%', backgroundColor: LUNA_COLORS.secondary },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  emptySub: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, textAlign: 'center' },
  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark, marginTop: spacing.lg },
  noOffres: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, textAlign: 'center', marginTop: spacing.md },
  offreCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
  },
  offreNom: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  offrePrix: { fontSize: fontSize.sm, color: LUNA_COLORS.secondary, fontWeight: fontWeight.medium },
  offreDesc: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  paidHint: { fontSize: fontSize.sm, color: LUNA_COLORS.success, fontWeight: fontWeight.semibold, marginTop: spacing.sm },
  souscrireBtn: {
    flexDirection: 'row',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  souscireBtnTxt: { color: LUNA_COLORS.textInverse, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});

type SubscriptionStep = 'status' | 'tarifs' | 'paiement';

export interface SubscriptionScreenProps {
  initialStep?: SubscriptionStep;
  variant?: 'medecin' | 'admin';
}

export function SubscriptionScreen({
  initialStep = 'status',
  variant = 'medecin',
}: SubscriptionScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SubscriptionStep>(initialStep);
  const [selectedOffreId, setSelectedOffreId] = useState<string | undefined>();
  const [selectedInterval, setSelectedInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const { scope: scopeParam } = useLocalSearchParams<{ scope?: string }>();
  const explicitScope =
    scopeParam === 'cabinet' || scopeParam === 'clinique' ? scopeParam : undefined;

  const paymentRoutePrefix = variant === 'admin' ? '/(admin)' : '/(medecin)';

  function handleSelectForPayment(offreId: string, interval: 'MONTHLY' | 'YEARLY') {
    setSelectedOffreId(offreId);
    setSelectedInterval(interval);
    setActiveTab('paiement');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LUNA_COLORS.background }}>
      <View style={screenStyles.header}>
        <Text style={screenStyles.title}>
          {explicitScope === 'cabinet' ? 'Abonnement cabinet' : 'Mon abonnement'}
        </Text>
        <Text style={screenStyles.sub}>Statut · Forfaits · Paiement Stripe</Text>
      </View>
      <SegmentTabs<SubscriptionStep>
        options={[
          { key: 'status', label: 'Abonnement' },
          { key: 'tarifs', label: 'Forfaits' },
          { key: 'paiement', label: 'Paiement' },
        ]}
        value={activeTab}
        onChange={setActiveTab}
        onDark={false}
      />
      {activeTab === 'status' ? (
        <StatusTab
          onChangeTab={setActiveTab}
          explicitScope={explicitScope}
          showSmsQuota={variant === 'admin'}
        />
      ) : null}
      {activeTab === 'tarifs' ? (
        <AbonnementTarifsScreen
          embedded
          onSelectForPayment={handleSelectForPayment}
          paymentRoutePrefix={paymentRoutePrefix}
        />
      ) : null}
      {activeTab === 'paiement' ? (
        <AbonnementPaiementScreen
          embedded
          preselectedOffreId={selectedOffreId}
          preselectedInterval={selectedInterval}
        />
      ) : null}
    </SafeAreaView>
  );
}

const screenStyles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: LUNA_COLORS.surface,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  sub: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
});
