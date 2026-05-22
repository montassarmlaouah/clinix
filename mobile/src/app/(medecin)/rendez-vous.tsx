import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import { AgendaScreen } from '@/src/components/screens/medecin/AgendaScreen';

export default function MedecinRendezVousScreen(): React.JSX.Element {
  const { scope } = useLocalSearchParams<{ scope?: string }>();
  const rdvScope =
    scope === 'cabinet' || scope === 'clinique' ? scope : undefined;

  return <AgendaScreen initialTab="rdv" scope={rdvScope} />;
}
