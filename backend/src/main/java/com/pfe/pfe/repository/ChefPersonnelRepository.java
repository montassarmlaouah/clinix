package com.pfe.pfe.repository;

import com.pfe.pfe.model.ChefPersonnel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChefPersonnelRepository extends JpaRepository<ChefPersonnel, String> {
    Optional<ChefPersonnel> findByTelephone(String telephone);
    List<ChefPersonnel> findByCliniqueId(String cliniqueId);
    List<ChefPersonnel> findByActif(Boolean actif);
    boolean existsByNumeroOrdre(String numeroOrdre);
}
