import { apiDelete, apiGet, apiPost } from '@/src/api/client';
import { PERSONNEL } from '@/src/api/endpoints';
import type {
  CreerPersonnelPayload,
  CreerPersonnelResponse,
  MedecinRattachementResult,
  PersonnelMember,
  PersonnelRole,
} from '@/src/types/personnel';

function listUrl(role: PersonnelRole, cliniqueId: string): string {
  const base = {
    MEDECIN: PERSONNEL.MEDECINS,
    INFIRMIER: PERSONNEL.INFIRMIERS,
    PHARMACIEN: PERSONNEL.PHARMACIENS,
    SECRETAIRE: PERSONNEL.SECRETAIRES,
    RADIOLOGUE: PERSONNEL.RADIOLOGUES,
    CHEF_PERSONNEL: PERSONNEL.CHEFS,
    TECHNICIEN_MAINTENANCE: PERSONNEL.TECHNICIENS,
  }[role];
  return `${base}?cliniqueId=${encodeURIComponent(cliniqueId)}`;
}

function deleteUrl(role: PersonnelRole, id: string): string {
  const byId = {
    MEDECIN: PERSONNEL.MEDECIN_BY_ID,
    INFIRMIER: PERSONNEL.INFIRMIER_BY_ID,
    PHARMACIEN: PERSONNEL.PHARMACIEN_BY_ID,
    SECRETAIRE: PERSONNEL.SECRETAIRE_BY_ID,
    RADIOLOGUE: PERSONNEL.RADIOLOGUE_BY_ID,
    CHEF_PERSONNEL: PERSONNEL.CHEF_BY_ID,
    TECHNICIEN_MAINTENANCE: PERSONNEL.TECHNICIEN_BY_ID,
  }[role];
  return byId(id);
}

export const personnelService = {
  listByRole(role: PersonnelRole, cliniqueId: string): Promise<PersonnelMember[]> {
    return apiGet<PersonnelMember[]>(listUrl(role, cliniqueId));
  },

  creer(payload: CreerPersonnelPayload): Promise<CreerPersonnelResponse> {
    return apiPost<CreerPersonnelResponse>(PERSONNEL.CREATE, payload);
  },

  rechercherMedecinsRattachement(
    q: string,
    cin?: string,
  ): Promise<MedecinRattachementResult[]> {
    return apiGet<MedecinRattachementResult[]>(
      PERSONNEL.MEDECINS_RECHERCHE_RATTACHEMENT(q, cin),
    );
  },

  supprimer(role: PersonnelRole, id: string): Promise<void> {
    return apiDelete(deleteUrl(role, id));
  },
};
