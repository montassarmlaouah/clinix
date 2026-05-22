import React from 'react';
import { SubscriptionScreen } from '@/src/components/screens/medecin/SubscriptionScreen';

export default function MedecinAbonnementPaiementScreen(): React.JSX.Element {
  return <SubscriptionScreen initialStep="paiement" />;
}
