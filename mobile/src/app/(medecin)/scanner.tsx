import React from 'react';

import { PatientScannerScreen } from '@/src/components/screens/PatientScannerScreen';

export default function MedecinScanner(): React.JSX.Element {
  return <PatientScannerScreen patientsRoutePrefix="/(medecin)/patients" />;
}
