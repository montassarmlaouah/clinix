package com.pfe.pfe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Synthèse bureau radiologue (file clinique + examens assignés au praticien connecté).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RadiologueWorkspaceStatsDto {
    /** Demandes en attente sans radiologue (même clinique). */
    private long fileAttente;
    /** Examens assignés au radiologue, statut EN_COURS. */
    private long mesExamensEnCours;
    /** Assignés au radiologue, terminés mais rapport absent ou non validé. */
    private long comptesRendusAFinaliser;
    /** Assignés au radiologue, statut VALIDE (rapport validé). */
    private long examensValides;
}
