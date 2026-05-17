import type { Patient } from '@/src/api/services/patient.service';

export interface HospitalisationLite {
  id: string;
  dateEntree?: string;
  patient?: { id?: string };
  medecin?: { nom?: string; prenom?: string };
  chambre?: { numero?: string; service?: { nom?: string } };
}

export interface PatientRowView {
  patient: Patient;
  age: number | null;
  daysAdmitted: number | null;
  chambreLabel: string | null;
  medecinLabel: string | null;
  serviceLabel: string | null;
  accent: 'alert' | 'normal';
}

export function computeAge(dateNaissance?: string | null): number | null {
  if (!dateNaissance) return null;
  const d = new Date(dateNaissance);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

export function daysSince(dateIso?: string | null): number | null {
  if (!dateIso) return null;
  const start = new Date(dateIso);
  if (Number.isNaN(start.getTime())) return null;
  const diff = Date.now() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function buildPatientRows(
  patients: Patient[],
  hospitalisations: HospitalisationLite[],
): PatientRowView[] {
  const hospByPatient = new Map<string, HospitalisationLite>();
  for (const h of hospitalisations) {
    const pid = h.patient?.id;
    if (pid && !hospByPatient.has(pid)) hospByPatient.set(pid, h);
  }

  return patients.map((patient) => {
    const hosp = hospByPatient.get(String(patient.id));
    const age = patient.age ?? computeAge(patient.dateNaissance);
    const daysAdmitted = daysSince(hosp?.dateEntree);
    const medecin = hosp?.medecin;
    const medecinLabel = medecin
      ? `Dr ${medecin.prenom ?? ''} ${medecin.nom ?? ''}`.trim()
      : patient.medecins?.length
        ? patient.medecins
            .map((m) => `Dr ${m.prenom ?? ''} ${m.nom ?? ''}`.trim())
            .join(', ')
        : patient.medecinReferentNom ?? null;
    const chambreLabel = hosp?.chambre?.numero
      ? `CH: ${hosp.chambre.numero}`
      : patient.chambreNumero
        ? `CH: ${patient.chambreNumero}`
        : null;
    const serviceLabel = hosp?.chambre?.service?.nom ?? null;

    return {
      patient,
      age,
      daysAdmitted,
      chambreLabel,
      medecinLabel,
      serviceLabel,
      accent: patient.typeAdmission === 'URGENCE' || patient.typeAdmission === 'URGENT' ? 'alert' : 'normal',
    };
  });
}

export function sortPatientsByAge(rows: PatientRowView[], desc = true): PatientRowView[] {
  return [...rows].sort((a, b) => {
    const aa = a.age ?? -1;
    const bb = b.age ?? -1;
    return desc ? bb - aa : aa - bb;
  });
}

export function filterPatientRows(
  rows: PatientRowView[],
  query: string,
  serviceFilter: string,
): PatientRowView[] {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (serviceFilter !== 'ALL') {
      const svc = row.serviceLabel ?? '';
      if (svc !== serviceFilter) return false;
    }
    if (!q) return true;
    const p = row.patient;
    return (
      (p.nom?.toLowerCase().includes(q) ?? false) ||
      (p.prenom?.toLowerCase().includes(q) ?? false) ||
      (p.telephone?.toLowerCase().includes(q) ?? false) ||
      (row.chambreLabel?.toLowerCase().includes(q) ?? false) ||
      (row.medecinLabel?.toLowerCase().includes(q) ?? false)
    );
  });
}

export function collectServiceFilters(rows: PatientRowView[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    if (r.serviceLabel) set.add(r.serviceLabel);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
}
