import { apiDelete, apiGet, apiPost, apiPut } from '@/src/api/client';
import { PERSONNEL } from '@/src/api/endpoints';
import type {
  CreerPersonnelPayload,
  CreerPersonnelResponse,
  MedecinRattachementResult,
  PersonnelMember,
  PersonnelRole,
} from '@/src/types/personnel';

function listUrl(role: PersonnelRole, cliniqueId: string | number): string {
  const cid = encodeURIComponent(String(cliniqueId));
  const base = {
    MEDECIN: PERSONNEL.MEDECINS,
    INFIRMIER: PERSONNEL.INFIRMIERS,
    PHARMACIEN: PERSONNEL.PHARMACIENS,
    SECRETAIRE: PERSONNEL.SECRETAIRES,
    RADIOLOGUE: PERSONNEL.RADIOLOGUES,
    CHEF_PERSONNEL: PERSONNEL.CHEFS,
    TECHNICIEN_MAINTENANCE: PERSONNEL.TECHNICIENS,
  }[role];
  return `${base}?cliniqueId=${cid}`;
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

function reactiverUrl(role: PersonnelRole, id: string): string {
  const byId = {
    MEDECIN: PERSONNEL.MEDECIN_REACTIVER,
    INFIRMIER: PERSONNEL.INFIRMIER_REACTIVER,
    PHARMACIEN: PERSONNEL.PHARMACIEN_REACTIVER,
    SECRETAIRE: PERSONNEL.SECRETAIRE_REACTIVER,
    RADIOLOGUE: PERSONNEL.RADIOLOGUE_REACTIVER,
    CHEF_PERSONNEL: PERSONNEL.CHEF_REACTIVER,
    TECHNICIEN_MAINTENANCE: PERSONNEL.TECHNICIEN_REACTIVER,
  }[role];
  return byId(id);
}

export interface VerifierTelephoneResult {
  disponible: boolean;
  message?: string;
  telephoneNormalise?: string;
  nom?: string;
  prenom?: string;
  roles?: string[];
}

export const personnelService = {
  listByRole(role: PersonnelRole, cliniqueId: string | number): Promise<PersonnelMember[]> {
    return apiGet<PersonnelMember[]>(listUrl(role, cliniqueId));
  },

  verifierTelephone(telephone: string, medecinExistantId?: string): Promise<VerifierTelephoneResult> {
    return apiGet<VerifierTelephoneResult>(
      PERSONNEL.VERIFIER_TELEPHONE(telephone, medecinExistantId),
    );
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

  reactiver(role: PersonnelRole, id: string): Promise<void> {
    return apiPut<void>(reactiverUrl(role, id), {});
  },
};
