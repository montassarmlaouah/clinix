package com.pfe.pfe.repository;

import com.pfe.pfe.model.Presence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PresenceRepository extends JpaRepository<Presence, String> {
    
    // Trouver la présence d'un infirmier pour une date donnée
    Optional<Presence> findByInfirmierIdAndDatePresence(String infirmierId, LocalDate datePresence);
    
    // Toutes les présences d'un infirmier
    List<Presence> findByInfirmierId(String infirmierId);
    
    // Présences du jour
    List<Presence> findByDatePresence(LocalDate datePresence);
    
    // Présences par période
    @Query("SELECT p FROM Presence p WHERE p.datePresence BETWEEN :debut AND :fin")
    List<Presence> findByPeriode(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);
    
    // Présences par statut
    List<Presence> findByStatut(String statut);
    
    // Présences par statut et date
    List<Presence> findByStatutAndDatePresence(String statut, LocalDate datePresence);
    
    // Absences du jour
    @Query("SELECT p FROM Presence p WHERE p.datePresence = :date AND p.present = false")
    List<Presence> findAbsencesDuJour(@Param("date") LocalDate date);
    
    // Retards du jour
    @Query("SELECT p FROM Presence p WHERE p.datePresence = :date AND p.statut = 'RETARD'")
    List<Presence> findRetardsDuJour(@Param("date") LocalDate date);
    
    // Statistiques de présence d'un infirmier
    @Query("SELECT COUNT(p) FROM Presence p WHERE p.infirmier.id = :infirmierId AND p.present = true AND p.datePresence BETWEEN :debut AND :fin")
    Long countPresencesParPeriode(@Param("infirmierId") String infirmierId, @Param("debut") LocalDate debut, @Param("fin") LocalDate fin);
    
    @Query("SELECT COUNT(p) FROM Presence p WHERE p.infirmier.id = :infirmierId AND p.present = false AND p.datePresence BETWEEN :debut AND :fin")
    Long countAbsencesParPeriode(@Param("infirmierId") String infirmierId, @Param("debut") LocalDate debut, @Param("fin") LocalDate fin);
}
