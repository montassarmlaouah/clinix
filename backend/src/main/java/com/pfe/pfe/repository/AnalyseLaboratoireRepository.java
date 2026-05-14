package com.pfe.pfe.repository;

import com.pfe.pfe.model.AnalyseLaboratoire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AnalyseLaboratoireRepository extends JpaRepository<AnalyseLaboratoire, String> {
    List<AnalyseLaboratoire> findByPatientId(String patientId);
    List<AnalyseLaboratoire> findByStatut(AnalyseLaboratoire.StatutAnalyse statut);
}
