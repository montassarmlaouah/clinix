/**
 * [screen].tsx — Routeur dynamique de l'espace médecin.
 *
 * Délègue à DynamicRoleScreen (composant partagé) pour résoudre
 * le paramètre `screen` et rendre le bon composant.
 *
 * Navigation : router.push('/(medecin)/agenda')
 *              router.push('/(medecin)/planning')
 */
import React from 'react';

import { MedecinUrgencesScreen }       from '@/src/components/screens/MedecinUrgencesScreen';
import { MedecinNotesHubScreen }       from '@/src/components/screens/MedecinNotesHubScreen';
import { MedecinOrdonnancesHubScreen } from '@/src/components/screens/MedecinOrdonnancesHubScreen';
import { MedecinTachesSoinsScreen }    from '@/src/components/screens/MedecinTachesSoinsScreen';
import { MedecinDashboardStats }       from '@/src/components/screens/MedecinDashboardStats';
import { NotificationsScreen }         from '@/src/components/screens/NotificationsScreen';
import { PatientScannerScreen }        from '@/src/components/screens/PatientScannerScreen';
import { AgendaScreen }                from '@/src/components/screens/medecin/AgendaScreen';
import { DemandesScreen }              from '@/src/components/screens/medecin/DemandesScreen';
import { SubscriptionScreen }          from '@/src/components/screens/medecin/SubscriptionScreen';
import { DynamicRoleScreen, ScreenMap } from '@/src/components/navigation/DynamicRoleScreen';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';
import { useAuthStore } from '@/src/store/auth.store';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

// ── Hospitalisations (re-export de l'infirmier) ───────────────────────────────
const HospitalisationsInfirmier = React.lazy(() =>
  import('@/src/app/(infirmier)/hospitalisations').then((m) => ({ default: m.default })),
);

// ── ChangeOrganisation (inline) ───────────────────────────────────────────────
function ChangeOrganisationInline(): React.JSX.Element {
  const { cliniqueId, estCabinet } = useAuthStore();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LUNA_COLORS.background }}>
      <ScreenHeader title="Organisation" />
      <View style={inlineStyles.body}>
        <Text style={inlineStyles.text}>
          {estCabinet
            ? 'Vous exercez en cabinet médical (sans clinique rattachée).'
            : cliniqueId
              ? `Clinique rattachée : ID ${cliniqueId}`
              : 'Aucune organisation associée.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const inlineStyles = StyleSheet.create({
  body: { flex: 1, padding: spacing.xl },
  text: { fontSize: fontSize.base, color: LUNA_COLORS.dark, lineHeight: 22 },
});

// ── Map screen → composant ────────────────────────────────────────────────────
const SCREENS: ScreenMap = {
  // ── Agenda fusionné ──
  'agenda':              () => <AgendaScreen />,
  'planning':            () => <AgendaScreen initialTab="planning" />,
  'rendez-vous':         () => <AgendaScreen initialTab="rdv" />,

  // ── Abonnement fusionné ──
  'subscription':        () => <SubscriptionScreen />,
  'abonnement':          () => <SubscriptionScreen initialStep="status" />,
  'tarifs':              () => <SubscriptionScreen initialStep="tarifs" />,
  'abonnement-paiement': () => <SubscriptionScreen initialStep="paiement" />,

  // ── Demandes fusionnées ──
  'demandes':            () => <DemandesScreen />,
  'demandes-medicament': () => <DemandesScreen initialTab="medicament" />,
  'demandes-operation':  () => <DemandesScreen initialTab="operation" />,

  // ── Re-exports simples ──
  'alertes':             () => <MedecinUrgencesScreen />,
  'notes':               () => <MedecinNotesHubScreen />,
  'ordonnances':         () => <MedecinOrdonnancesHubScreen />,
  'taches-soins':        () => <MedecinTachesSoinsScreen />,
  'statistiques':        () => <MedecinDashboardStats />,
  'notifications':       () => <NotificationsScreen />,
  'scanner':             () => <PatientScannerScreen patientsRoutePrefix="/(medecin)/patients" />,
  'change-organisation': () => <ChangeOrganisationInline />,

  // ── Hospitalisations (partagé avec infirmier) ──
  'hospitalisations': () => (
    <React.Suspense fallback={null}>
      <HospitalisationsInfirmier />
    </React.Suspense>
  ),
};

// ── Route dynamique ───────────────────────────────────────────────────────────
export default function DynamicMedecinScreen(): React.JSX.Element {
  return <DynamicRoleScreen role="medecin" screens={SCREENS} />;
}
