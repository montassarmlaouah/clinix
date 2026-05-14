package com.pfe.pfe.repository;

import com.pfe.pfe.model.SurveillanceInfirmiere;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SurveillanceInfirmiereRepository extends JpaRepository<SurveillanceInfirmiere, String> {
    
    // Rechercher toutes les surveillances d'un patient
    List<SurveillanceInfirmiere> findByPatientIdOrderByHeureObservationDesc(String patientId);
    
    // Rechercher les surveillances d'un patient sur une période
    List<SurveillanceInfirmiere> findByPatientIdAndHeureObservationBetweenOrderByHeureObservationDesc(
            String patientId, LocalDateTime debut, LocalDateTime fin);
    
    // Rechercher les surveillances effectuées par un infirmier
    List<SurveillanceInfirmiere> findByInfirmierId(String infirmierId);
    
    // Rechercher les surveillances avec alertes
    List<SurveillanceInfirmiere> findByAlerteDeclencheTrue();
    
    // Rechercher les surveillances avec alertes pour un patient
    List<SurveillanceInfirmiere> findByPatientIdAndAlerteDeclencheTrue(String patientId);
    
    // Dernière surveillance d'un patient
    @Query("SELECT s FROM SurveillanceInfirmiere s WHERE s.patient.id = :patientId " +
           "ORDER BY s.heureObservation DESC")
    List<SurveillanceInfirmiere> findLastByPatientId(@Param("patientId") String patientId);
    
    // Surveillances du jour pour un patient
    @Query("SELECT s FROM SurveillanceInfirmiere s WHERE s.patient.id = :patientId " +
           "AND s.heureObservation >= :debut AND s.heureObservation < :fin " +
           "ORDER BY s.heureObservation")
    List<SurveillanceInfirmiere> findTodaySurveillancesByPatientId(@Param("patientId") String patientId,
                                                                     @Param("debut") LocalDateTime debut,
                                                                     @Param("fin") LocalDateTime fin);
    
    // Compter les surveillances d'un patient
    long countByPatientId(String patientId);
    
    // Recherche par nom de patient (partiel)
    @Query("SELECT s FROM SurveillanceInfirmiere s WHERE " +
           "LOWER(s.patient.nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.patient.prenom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.patient.numeroPatient) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "ORDER BY s.heureObservation DESC")
    List<SurveillanceInfirmiere> rechercherParPatient(@Param("searchTerm") String searchTerm);
    
    // Recherche par nom d'infirmier (partiel)
    @Query("SELECT s FROM SurveillanceInfirmiere s WHERE " +
           "LOWER(s.infirmier.nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.infirmier.prenom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "ORDER BY s.heureObservation DESC")
    List<SurveillanceInfirmiere> rechercherParInfirmier(@Param("searchTerm") String searchTerm);
    
    // Recherche globale (patient, infirmier, observations)
    @Query("SELECT s FROM SurveillanceInfirmiere s WHERE " +
           "LOWER(s.patient.nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.patient.prenom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.patient.numeroPatient) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.infirmier.nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.infirmier.prenom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.observations) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.typeAlerte) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "ORDER BY s.heureObservation DESC")
    List<SurveillanceInfirmiere> rechercheGlobale(@Param("searchTerm") String searchTerm);
    
    // Recherche par critères multiples
    @Query("SELECT s FROM SurveillanceInfirmiere s WHERE " +
           "(:patientId IS NULL OR s.patient.id = :patientId) AND " +
           "(:infirmierId IS NULL OR s.infirmier.id = :infirmierId) AND " +
           "(:dateDebut IS NULL OR s.heureObservation >= :dateDebut) AND " +
           "(:dateFin IS NULL OR s.heureObservation <= :dateFin) AND " +
           "(:avecAlerte IS NULL OR s.alerteDeclenche = :avecAlerte) " +
           "ORDER BY s.heureObservation DESC")
    List<SurveillanceInfirmiere> rechercheAvancee(
            @Param("patientId") String patientId,
            @Param("infirmierId") String infirmierId,
            @Param("dateDebut") LocalDateTime dateDebut,
            @Param("dateFin") LocalDateTime dateFin,
            @Param("avecAlerte") Boolean avecAlerte);
    
    // Obtenir toutes les surveillances avec alertes non validées
    @Query("SELECT s FROM SurveillanceInfirmiere s WHERE s.alerteDeclenche = true " +
           "ORDER BY s.heureObservation DESC")
    List<SurveillanceInfirmiere> findAllAlertesNonValidees();
}
