package com.pfe.pfe.repository;

import com.pfe.pfe.model.Urgence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UrgenceRepository extends JpaRepository<Urgence, String> {

    List<Urgence> findByStatutOrderByDateSignalementDesc(Urgence.StatutUrgence statut);

    List<Urgence> findByPatientIdOrderByDateSignalementDesc(String patientId);

    List<Urgence> findByMedecinAssigneIdOrderByDateSignalementDesc(String medecinId);

    @Query("SELECT u FROM Urgence u WHERE u.statut IN ('EN_ATTENTE', 'PRISE_EN_CHARGE', 'EN_TRAITEMENT') " +
           "ORDER BY CASE u.niveau WHEN 'CRITIQUE' THEN 0 WHEN 'HAUTE' THEN 1 WHEN 'MOYENNE' THEN 2 ELSE 3 END, " +
           "u.dateSignalement ASC")
    List<Urgence> findUrgencesActives();

    List<Urgence> findBySignaleParIdOrderByDateSignalementDesc(String userId);
}
