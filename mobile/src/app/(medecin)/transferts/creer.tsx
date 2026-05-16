import React from 'react';

import { DemandesOperationListScreen } from '@/src/components/screens/DemandesOperationListScreen';

/** Création de transfert = nouvelle demande d'opération (parcours web équivalent). */
export default function MedecinTransfertCreer(): React.JSX.Element {
  return (
    <DemandesOperationListScreen
      title="Transferts / opérations"
      detailRoutePrefix="/(medecin)/operations"
      createRoute="/(medecin)/operations/nouveau"
    />
  );
}
