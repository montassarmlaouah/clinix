import { PatientsListScreen } from '@/src/components/screens/PatientsListScreen';

export default function AdminPatientsScreen() {
  return (
    <PatientsListScreen
      title="Patients"
      detailRouteBase="/(admin)/patients"
    />
  );
}
