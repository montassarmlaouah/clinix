package com.pfe.pfe.repository;

import com.pfe.pfe.model.Radiologue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RadiologueRepository extends JpaRepository<Radiologue, String> {
    Optional<Radiologue> findByTelephone(String telephone);
    List<Radiologue> findByCliniqueId(String cliniqueId);
    List<Radiologue> findByActif(Boolean actif);
    boolean existsByNumeroOrdre(String numeroOrdre);
}
