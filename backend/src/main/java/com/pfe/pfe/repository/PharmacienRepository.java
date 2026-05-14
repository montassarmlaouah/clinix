package com.pfe.pfe.repository;

import com.pfe.pfe.model.Pharmacien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PharmacienRepository extends JpaRepository<Pharmacien, String> {
    Optional<Pharmacien> findByTelephone(String telephone);
    List<Pharmacien> findByCliniqueId(String cliniqueId);
    List<Pharmacien> findByActif(Boolean actif);
    Optional<Pharmacien> findByNumeroOrdre(String numeroOrdre);
    boolean existsByNumeroOrdre(String numeroOrdre);
}
