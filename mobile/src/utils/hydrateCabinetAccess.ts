import { fetchAbonnementCourant } from '@/src/services/billing.service';
import { useAuthStore } from '@/src/store/auth.store';

/** Rafraîchit accesCabinet après paiement Stripe cabinet (aligné web hydrateCabinetAccess). */
export async function hydrateCabinetAccess(): Promise<void> {
  const { estCabinet, role } = useAuthStore.getState();
  if (!role?.includes('MEDECIN') && !estCabinet) {
    return;
  }
  const cur = await fetchAbonnementCourant('cabinet');
  if (cur?.accesAutorise === true) {
    useAuthStore.getState().setAuth({ accesCabinet: true });
  }
}
