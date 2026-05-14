package com.pfe.pfe.repository;

import com.pfe.pfe.model.Medicament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicamentRepository extends JpaRepository<Medicament, String> {
    Optional<Medicament> findByCode(String code);
    List<Medicament> findByNomContainingIgnoreCase(String nom);
}
