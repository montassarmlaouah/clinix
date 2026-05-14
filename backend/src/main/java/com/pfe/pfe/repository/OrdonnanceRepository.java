package com.pfe.pfe.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.pfe.pfe.model.Ordonnance;

@Repository
public interface OrdonnanceRepository extends JpaRepository<Ordonnance, String> {
    List<Ordonnance> findByValidee(Boolean validee);
    List<Ordonnance> findByMedecinId(String medecinId);
    List<Ordonnance> findByPatientId(String patientId);

    long countByMedecinId(String medecinId);

    /** Charge l'ordonnance avec prescriptions pour génération PDF. */
    @Query("SELECT DISTINCT o FROM Ordonnance o LEFT JOIN FETCH o.prescriptions WHERE o.id = :id")
    Optional<Ordonnance> findByIdWithPrescriptions(String id);

    long countByDateBetween(LocalDate start, LocalDate end);
}
