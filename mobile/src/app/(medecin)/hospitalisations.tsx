import React, { Suspense } from 'react';

// Partagé avec l'espace infirmier (chargement différé)
const HospitalisationsScreen = React.lazy(() =>
  import('@/src/app/(infirmier)/hospitalisations').then((m) => ({ default: m.default })),
);

export default function MedecinHospitalisationsScreen(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <HospitalisationsScreen />
    </Suspense>
  );
}
