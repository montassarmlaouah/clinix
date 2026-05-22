/**
 * useConstantesValidation
 *
 * Hook partagé entre ConstantesForm et ConstantesVitalesModal.
 * Contient les définitions officielles des champs (seuils normaux / attention)
 * et la logique de statut coloré.
 */

import { LUNA_COLORS } from '@/src/theme/colors';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConstanteKey =
  | 'tensionSystolique'
  | 'tensionDiastolique'
  | 'frequenceCardiaque'
  | 'temperature'
  | 'saturationOxygene'
  | 'poids';

export type ConstanteStatut = 'none' | 'normal' | 'attention' | 'alerte';

export interface ConstanteFieldDef {
  key:        ConstanteKey;
  label:      string;
  unit:       string;
  /** Valeur normale min (inclusive) */
  normalMin:  number;
  /** Valeur normale max (inclusive) */
  normalMax:  number;
  /** Valeur attention min (inclusive) */
  attenMin:   number;
  /** Valeur attention max (inclusive) */
  attenMax:   number;
  /** Afficher le badge de statut */
  hasBadge:   boolean;
  keyboardDecimal?: boolean;
}

export interface ConstanteStatutConfig {
  color:  string;
  bg:     string;
  label:  string;
  icon:   string;
}

// ── Définitions des champs ────────────────────────────────────────────────────

export const CONSTANTE_FIELDS: ConstanteFieldDef[] = [
  {
    key: 'tensionSystolique',
    label: 'Tension systolique',
    unit: 'mmHg',
    normalMin: 90,  normalMax: 140,
    attenMin:  70,  attenMax:  170,
    hasBadge: true,
  },
  {
    key: 'tensionDiastolique',
    label: 'Tension diastolique',
    unit: 'mmHg',
    normalMin: 60,  normalMax: 90,
    attenMin:  40,  attenMax:  110,
    hasBadge: true,
  },
  {
    key: 'frequenceCardiaque',
    label: 'Fréquence cardiaque',
    unit: 'bpm',
    normalMin: 60,  normalMax: 100,
    attenMin:  40,  attenMax:  140,
    hasBadge: true,
  },
  {
    key: 'temperature',
    label: 'Température',
    unit: '°C',
    normalMin: 36.0, normalMax: 37.5,
    attenMin:  35.0, attenMax:  38.5,
    hasBadge: true,
    keyboardDecimal: true,
  },
  {
    key: 'saturationOxygene',
    label: 'Saturation O₂ (SpO₂)',
    unit: '%',
    normalMin: 95,   normalMax: 100,
    attenMin:  90,   attenMax:  94.9,
    hasBadge: true,
  },
  {
    key: 'poids',
    label: 'Poids',
    unit: 'kg',
    normalMin: -1,       normalMax: Infinity,
    attenMin:  -1,       attenMax:  Infinity,
    hasBadge: false,
    keyboardDecimal: true,
  },
];

// ── Statut coloré ─────────────────────────────────────────────────────────────

export const STATUT_CONFIG: Record<Exclude<ConstanteStatut, 'none'>, ConstanteStatutConfig> = {
  normal:    { color: LUNA_COLORS.success, bg: LUNA_COLORS.successLight, label: 'Normal',    icon: 'checkmark-circle-outline' },
  attention: { color: LUNA_COLORS.warning, bg: LUNA_COLORS.warningLight, label: 'Attention', icon: 'warning-outline'           },
  alerte:    { color: LUNA_COLORS.error,   bg: LUNA_COLORS.errorLight,   label: 'Alerte',    icon: 'alert-circle-outline'      },
};

export function getConstanteStatut(value: string, field: ConstanteFieldDef): ConstanteStatut {
  if (!field.hasBadge) return 'none';
  const v = parseFloat(value.replace(',', '.'));
  if (!value || isNaN(v)) return 'none';
  if (v >= field.normalMin && v <= field.normalMax) return 'normal';
  if (v >= field.attenMin  && v <= field.attenMax)  return 'attention';
  return 'alerte';
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Retourne les définitions et helpers de validation pour le formulaire
 * de constantes vitales. Aucun state interne — pure configuration.
 */
export function useConstantesValidation() {
  return {
    fields: CONSTANTE_FIELDS,
    getStatut: getConstanteStatut,
    statutConfig: STATUT_CONFIG,
  };
}
