package com.pfe.pfe.repository;

import com.pfe.pfe.model.TechnicienMaintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TechnicienMaintenanceRepository extends JpaRepository<TechnicienMaintenance, String> {
    Optional<TechnicienMaintenance> findByTelephone(String telephone);
    List<TechnicienMaintenance> findByCliniqueId(String cliniqueId);
    List<TechnicienMaintenance> findByActif(Boolean actif);
    boolean existsByNumeroOrdre(String numeroOrdre);
}
