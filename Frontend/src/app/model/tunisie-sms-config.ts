/** Réponse GET /api/cliniques/{id}/configuration-tunisiesms */
export interface CliniqueTunisieSmsConfigDTO {
  abonnementSmsGratuits: boolean;
  tunisiesmsSender: string | null;
  cleConfiguree: boolean;
  cleMasquee: string | null;
}

/** Corps PUT */
export interface CliniqueTunisieSmsUpdateDTO {
  abonnementSmsGratuits?: boolean;
  tunisiesmsSender?: string | null;
  /** null = ne pas changer ; '' = effacer */
  tunisiesmsApiKey?: string | null;
}
