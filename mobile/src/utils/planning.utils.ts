export type ShiftValue = '' | 'MATIN' | 'APRES_MIDI' | 'NUIT';

export interface WeekDay {
  label: string;
  date: string;
}

export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr;
  d.setDate(d.getDate() + days);
  return formatDateLocal(d);
}

export function buildWeekDays(dateDebut: string): WeekDay[] {
  const start = parseLocalDate(dateDebut);
  if (!start) return [];
  const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  return Array.from({ length: 7 }, (_, idx) => {
    const day = new Date(start);
    day.setDate(start.getDate() + idx);
    return { label: labels[idx], date: formatDateLocal(day) };
  });
}

export function setNextMonday(): string {
  const today = new Date();
  const dow = today.getDay();
  const daysUntilMonday = dow === 0 ? 1 : 8 - dow;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return formatDateLocal(nextMonday);
}

export function setCurrentMonday(): string {
  const today = new Date();
  const dow = today.getDay();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  return formatDateLocal(monday);
}

export function shiftLabel(value?: ShiftValue | string): string {
  switch (value) {
    case 'MATIN':
      return '07:00 - 13:00';
    case 'APRES_MIDI':
      return '13:00 - 19:00';
    case 'NUIT':
      return '19:00 - 07:00';
    default:
      return 'Repos';
  }
}

export function validateInfirmierPlanning(
  assignedDates: string[],
  shifts: string[],
): string | null {
  const total = assignedDates.length;
  const nights = shifts.filter((s) => s === 'NUIT').length;
  if (total === 0) {
    return 'Chaque infirmier sélectionné doit avoir au moins 1 jour travaillé.';
  }
  const isSixDays = total === 6 && nights === 0;
  const isThreeNightsOnly = total === 3 && nights === 3;
  if (!isSixDays && !isThreeNightsOnly) {
    return 'Règle : 6 jours/semaine sans nuit OU 3 nuits/semaine uniquement.';
  }
  return null;
}

export function getIsoDatePart(iso?: string): string | null {
  if (!iso || typeof iso !== 'string') return null;
  return iso.length >= 10 ? iso.slice(0, 10) : null;
}

export function getIsoTimePart(iso?: string): string | null {
  if (!iso || typeof iso !== 'string') return null;
  return iso.length >= 16 ? iso.slice(11, 16) : null;
}

export function displayGardeUser(g: {
  utilisateur?: { nom?: string; prenom?: string; telephone?: string };
}): string {
  const u = g.utilisateur;
  const full = `${u?.nom ?? ''} ${u?.prenom ?? ''}`.trim();
  return full || u?.telephone || '—';
}

export function buildDetailByShift(
  weekDays: WeekDay[],
  gardes: Array<{ debut?: string; type?: string; utilisateur?: { nom?: string; prenom?: string; telephone?: string } }>,
): Record<string, { matin: string[]; soir: string[]; nuit: string[] }> {
  const map: Record<string, { matin: string[]; soir: string[]; nuit: string[] }> = {};
  weekDays.forEach((d) => {
    map[d.date] = { matin: [], soir: [], nuit: [] };
  });
  gardes.forEach((g) => {
    const day = getIsoDatePart(g.debut);
    if (!day || !map[day]) return;
    const time = getIsoTimePart(g.debut);
    const name = displayGardeUser(g);
    if (g.type === 'JOUR' && time === '07:00') map[day].matin.push(name);
    else if (g.type === 'JOUR' && time === '13:00') map[day].soir.push(name);
    else if (g.type === 'NUIT' && time === '19:00') map[day].nuit.push(name);
  });
  Object.keys(map).forEach((day) => {
    map[day].matin = Array.from(new Set(map[day].matin)).sort();
    map[day].soir = Array.from(new Set(map[day].soir)).sort();
    map[day].nuit = Array.from(new Set(map[day].nuit)).sort();
  });
  return map;
}
