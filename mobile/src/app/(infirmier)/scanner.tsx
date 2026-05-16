import React from 'react';

import { PatientScannerScreen } from '@/src/components/screens/PatientScannerScreen';

export default function InfirmierScanner(): React.JSX.Element {
  return <PatientScannerScreen patientsRoutePrefix="/(infirmier)/patients" />;
}
