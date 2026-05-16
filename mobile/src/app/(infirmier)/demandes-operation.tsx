import React from 'react';

import { DemandesOperationListScreen } from '@/src/components/screens/DemandesOperationListScreen';

export default function InfirmierDemandesOperation(): React.JSX.Element {
  return (
    <DemandesOperationListScreen
      title="Demandes d'opération"
      detailRoutePrefix="/(secretaire)/transferts"
    />
  );
}
