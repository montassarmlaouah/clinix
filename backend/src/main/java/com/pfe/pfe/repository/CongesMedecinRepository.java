package com.pfe.pfe.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pfe.pfe.model.CongesMedecin;

public interface CongesMedecinRepository extends JpaRepository<CongesMedecin, String> {

    List<CongesMedecin> findByMedecinId(String medecinId);

    /** Congés actifs (APPROUVE) d'un médecin qui chevauchent une date donnée. */
    @Query("""
        SELECT c FROM CongesMedecin c
        WHERE c.medecin.id = :medecinId
          AND c.statut = 'APPROUVE'
          AND c.dateDebut <= :date
          AND c.dateFin >= :date
    """)
    List<CongesMedecin> findCongesActifsADate(@Param("medecinId") String medecinId, @Param("date") LocalDate date);

    /**
     * Médecins disponibles dans une clinique à une date donnée
     * (sans congé approuvé qui chevauche cette date).
     */
    @Query("""
        SELECT DISTINCT m FROM Medecin m
        WHERE m.clinique.id = :cliniqueId
          AND m.actif = true
          AND m.id NOT IN (
              SELECT c.medecin.id FROM CongesMedecin c
              WHERE c.statut = 'APPROUVE'
                AND c.dateDebut <= :date
                AND c.dateFin >= :date
          )
    """)
    List<com.pfe.pfe.model.Medecin> findMedecinsDisponibles(
            @Param("cliniqueId") String cliniqueId,
            @Param("date") LocalDate date);
}
