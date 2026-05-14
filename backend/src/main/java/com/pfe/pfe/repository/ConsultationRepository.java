package com.pfe.pfe.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pfe.pfe.model.Consultation;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, String> {
    List<Consultation> findByPatientId(String patientId);
    List<Consultation> findByMedecinId(String medecinId);

    long countByMedecinId(String medecinId);

    long countByMedecinIdAndDateBetween(String medecinId, LocalDateTime debut, LocalDateTime fin);

    @Query("SELECT COUNT(DISTINCT c.patient.id) FROM Consultation c WHERE c.medecin.id = :medecinId")
    long countDistinctPatientsByMedecinId(@Param("medecinId") String medecinId);
}
