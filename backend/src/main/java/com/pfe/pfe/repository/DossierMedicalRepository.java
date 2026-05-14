package com.pfe.pfe.repository;

import com.pfe.pfe.model.DossierMedical;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DossierMedicalRepository extends JpaRepository<DossierMedical, String> {
    Optional<DossierMedical> findByPatientId(String patientId);
}
