package com.pfe.pfe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pfe.pfe.model.TechnicienMaintenance;

@Repository
public interface TechnicienMaintenanceRepository extends JpaRepository<TechnicienMaintenance, String> {
    Optional<TechnicienMaintenance> findByTelephone(String telephone);

    /** JPQL explicite (héritage User / relation clinique) pour éviter tout ambiguïté côté Spring Data. */
    @Query("SELECT t FROM TechnicienMaintenance t WHERE t.clinique IS NOT NULL AND t.clinique.id = :cliniqueId")
    List<TechnicienMaintenance> findByCliniqueId(@Param("cliniqueId") String cliniqueId);
    List<TechnicienMaintenance> findByActif(Boolean actif);
    boolean existsByNumeroOrdre(String numeroOrdre);
}
