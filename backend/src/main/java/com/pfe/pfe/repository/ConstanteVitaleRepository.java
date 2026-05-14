package com.pfe.pfe.repository;

import com.pfe.pfe.model.ConstanteVitale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ConstanteVitaleRepository extends JpaRepository<ConstanteVitale, String> {
    List<ConstanteVitale> findByPatientId(String patientId);
    List<ConstanteVitale> findByPatientIdOrderByDateHeureDesc(String patientId);
    List<ConstanteVitale> findByPatientIdAndDateHeureBetweenOrderByDateHeureDesc(
            String patientId,
            LocalDateTime debut,
            LocalDateTime fin
    );
}
