package com.pfe.pfe.repository;

import com.pfe.pfe.model.Secretaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SecretaireRepository extends JpaRepository<Secretaire, String> {
    Optional<Secretaire> findByTelephone(String telephone);
    List<Secretaire> findByCliniqueId(String cliniqueId);
    List<Secretaire> findByActif(Boolean actif);
    boolean existsByNumeroOrdre(String numeroOrdre);
}
