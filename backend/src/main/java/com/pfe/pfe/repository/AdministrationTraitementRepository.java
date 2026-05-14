package com.pfe.pfe.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pfe.pfe.model.AdministrationTraitement;

@Repository
public interface AdministrationTraitementRepository extends JpaRepository<AdministrationTraitement, String> {
    
    // Rechercher tous les traitements d'un patient
    List<AdministrationTraitement> findByPatientIdOrderByHeureAdministrationDesc(String patientId);
    
    // Rechercher les traitements sur une période
    List<AdministrationTraitement> findByPatientIdAndHeureAdministrationBetweenOrderByHeureAdministration(
            String patientId, LocalDateTime debut, LocalDateTime fin);
    
    // Rechercher les traitements administrés par un infirmier
    List<AdministrationTraitement> findByInfirmierId(String infirmierId);

    List<AdministrationTraitement> findByInfirmierIdOrderByHeureAdministrationDesc(String infirmierId);
    
    // Rechercher les traitements non administrés
    List<AdministrationTraitement> findByPatientIdAndAdministreFalse(String patientId);
    
    // Traitements du jour pour un patient
    @Query("SELECT a FROM AdministrationTraitement a WHERE a.patient.id = :patientId " +
           "AND a.heureAdministration >= :debut AND a.heureAdministration < :fin " +
           "ORDER BY a.heureAdministration")
    List<AdministrationTraitement> findTodayTraitementsByPatientId(@Param("patientId") String patientId, 
                                                                    @Param("debut") LocalDateTime debut,
                                                                    @Param("fin") LocalDateTime fin);
    
    // Traitements à venir (non administrés et planifiés)
    @Query("SELECT a FROM AdministrationTraitement a WHERE a.patient.id = :patientId " +
           "AND a.administre = false AND a.heureAdministration >= :debut " +
           "ORDER BY a.heureAdministration")
    List<AdministrationTraitement> findUpcomingTraitementsByPatientId(@Param("patientId") String patientId,
                                                                       @Param("debut") LocalDateTime debut);
    
    // Rechercher par type de traitement
    List<AdministrationTraitement> findByPatientIdAndTypeTraitement(String patientId, String typeTraitement);

    @Query("SELECT DISTINCT a FROM AdministrationTraitement a JOIN a.patient p " +
           "WHERE p.medecinCabinet.id = :medecinId OR a.medecinDemandeurId = :medecinId " +
           "ORDER BY a.heureAdministration DESC")
    List<AdministrationTraitement> findSuiviPourMedecin(@Param("medecinId") String medecinId);

    /** Compte explicite (évite l'ambiguïté du parseur sur "Medecin" dans validationSoinsMedecin). */
    @Query("SELECT COUNT(a) FROM AdministrationTraitement a WHERE a.medecinDemandeurId = :medecinId "
            + "AND a.validationSoinsMedecin = :statut AND a.administre = true")
    long countByMedecinDemandeurIdAndValidationStatutAndAdministre(
            @Param("medecinId") String medecinId,
            @Param("statut") String statut);
}
