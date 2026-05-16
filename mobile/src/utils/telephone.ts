/** Chiffres seuls (8 chiffres TN sans indicatif). */
export function normalizeTelephoneDigits(telephone?: string): string {
  return (telephone ?? '').replace(/\D/g, '').slice(-8);
}

/** Format attendu par l'API (indicatif 216 + 8 chiffres). */
export function toApiTelephone(telephone?: string): string {
  const digits = normalizeTelephoneDigits(telephone);
  if (digits.length !== 8) return digits;
  return `216${digits}`;
}
