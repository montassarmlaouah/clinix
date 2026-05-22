package com.pfe.pfe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pfe.pfe.model.Medecin;

@Repository
public interface MedecinRepository extends JpaRepository<Medecin, String> {
    List<Medecin> findBySpecialite(String specialite);
    List<Medecin> findByCliniqueId(String cliniqueId);
    /** Cabinets médecins : comptes sans clinique liée */
    List<Medecin> findByCliniqueIsNullOrderByDateCreationDesc();

    /** Cabinets : indépendants ou médecins de clinique avec accès cabinet activé */
    @Query("SELECT m FROM Medecin m WHERE m.clinique IS NULL OR COALESCE(m.accesCabinet, false) = true ORDER BY m.dateCreation DESC")
    List<Medecin> findCabinetsOrderByDateCreationDesc();
    Optional<Medecin> findByTelephone(String telephone);

    List<Medecin> findAllByNumeroPieceIdentite(String numeroPieceIdentite);

    boolean existsByNumeroOrdre(String numeroOrdre);

    @Query("SELECT m FROM Medecin m WHERE " +
           "(LOWER(COALESCE(m.nom,'')) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(COALESCE(m.prenom,'')) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR m.telephone LIKE CONCAT('%', :q, '%') " +
           "OR (:cin <> '' AND m.numeroPieceIdentite = :cin)) ")
    List<Medecin> rechercherPourRattachement(@Param("q") String q, @Param("cin") String cin, Pageable pageable);
}
