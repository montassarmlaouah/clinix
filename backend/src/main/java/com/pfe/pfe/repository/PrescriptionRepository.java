package com.pfe.pfe.repository;

import com.pfe.pfe.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, String> {
    List<Prescription> findByOrdonnanceId(String ordonnanceId);
}
