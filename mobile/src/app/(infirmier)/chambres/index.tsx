import React from 'react';
import { ChambresListScreen } from '@/src/components/screens/ChambresListScreen';

export default function InfirmierChambresRoute(): React.JSX.Element {
  return <ChambresListScreen detailRoutePrefix="/(infirmier)/chambres" />;
}
