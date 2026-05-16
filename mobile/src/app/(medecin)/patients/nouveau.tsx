import React from 'react';

import { NewPatientScreen } from '@/src/components/screens/NewPatientScreen';

export default function MedecinNouveauPatient(): React.JSX.Element {
  return (
    <NewPatientScreen afterCreateRoute={(id) => `/(medecin)/patients/${id}`} />
  );
}
