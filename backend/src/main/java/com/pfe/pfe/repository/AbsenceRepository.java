package com.pfe.pfe.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pfe.pfe.model.Absence;

@Repository
public interface AbsenceRepository extends JpaRepository<Absence, String> {
    List<Absence> findByUtilisateurId(String utilisateurId);
    List<Absence> findByStatut(Absence.StatutAbsence statut);

    @Query("""
        SELECT COUNT(a) > 0
        FROM Absence a
        WHERE a.utilisateur.id = :utilisateurId
          AND a.statut <> 'REFUSEE'
          AND a.dateDebut <= :dateFin
          AND a.dateFin >= :dateDebut
        """)
    boolean existsOverlappingAbsence(
            @Param("utilisateurId") String utilisateurId,
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin") LocalDate dateFin
    );
    
    @Query("SELECT a FROM Absence a WHERE a.dateDebut >= :debut AND a.dateFin <= :fin")
    List<Absence> findByPeriode(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);
    
    @Query("SELECT a FROM Absence a WHERE a.statut = 'EN_ATTENTE'")
    List<Absence> findDemandesEnAttente();
}
