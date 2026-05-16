import { DemandesOperationListScreen } from '@/src/components/screens/DemandesOperationListScreen';

export default function MedecinDemandesOperationRoute() {
  return (
    <DemandesOperationListScreen
      title="Demandes d'opération"
      detailRoutePrefix="/(medecin)/operations"
      createRoute="/(medecin)/operations/nouveau"
    />
  );
}
