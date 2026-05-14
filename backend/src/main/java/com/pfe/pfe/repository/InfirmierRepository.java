package com.pfe.pfe.repository;

import com.pfe.pfe.model.Infirmier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InfirmierRepository extends JpaRepository<Infirmier, String> {
    Optional<Infirmier> findByTelephone(String telephone);
    List<Infirmier> findByCliniqueId(String cliniqueId);
    List<Infirmier> findByActif(Boolean actif);
    boolean existsByNumeroOrdre(String numeroOrdre);
}
