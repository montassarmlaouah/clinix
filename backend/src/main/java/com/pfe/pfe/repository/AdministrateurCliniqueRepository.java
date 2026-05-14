package com.pfe.pfe.repository;

import com.pfe.pfe.model.AdministrateurClinique;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdministrateurCliniqueRepository extends JpaRepository<AdministrateurClinique, String> {

    // ==================== MÉTHODES OPTIMISÉES ====================

    /**
     * Récupérer tous les admins avec leurs cliniques en une seule requête
     */
    @Override
    @EntityGraph(attributePaths = {"clinique", "roles"})
    List<AdministrateurClinique> findAll();

    /**
     * Trouver par ID avec clinique
     */
    @Override
    @EntityGraph(attributePaths = {"clinique", "roles"})
    Optional<AdministrateurClinique> findById(String id);

    /**
     * Trouver par téléphone avec clinique
     */
    @EntityGraph(attributePaths = {"clinique", "roles"})
    Optional<AdministrateurClinique> findByTelephone(String telephone);

    /**
     * Trouver par téléphone et clinique ID
     */
    @EntityGraph(attributePaths = {"clinique"})
    Optional<AdministrateurClinique> findByTelephoneAndCliniqueId(String telephone, String cliniqueId);

    /**
     * Trouver tous les admins d'une clinique
     */
    @EntityGraph(attributePaths = {"clinique", "roles"})
    List<AdministrateurClinique> findByCliniqueId(String cliniqueId);

    /**
     * Trouver les admins actifs d'une clinique
     */
    @EntityGraph(attributePaths = {"clinique", "roles"})
    List<AdministrateurClinique> findByCliniqueIdAndActifTrue(String cliniqueId);

    /**
     * Compter les administrateurs actifs d'une clinique
     */
    long countByCliniqueIdAndActifTrue(String cliniqueId);

    /**
     * Vérifier si un téléphone existe
     */
    boolean existsByTelephone(String telephone);

    // ==================== REQUÊTES PERSONNALISÉES (ALTERNATIVE) ====================

    /**
     * Alternative avec @Query et JOIN FETCH
     */
    @Query("SELECT DISTINCT a FROM AdministrateurClinique a " +
            "LEFT JOIN FETCH a.clinique " +
            "LEFT JOIN FETCH a.roles")
    List<AdministrateurClinique> findAllWithDetails();

    /**
     * Trouver par clinique avec détails
     */
    @Query("SELECT a FROM AdministrateurClinique a " +
            "LEFT JOIN FETCH a.clinique " +
            "LEFT JOIN FETCH a.roles " +
            "WHERE a.clinique.id = :cliniqueId")
    List<AdministrateurClinique> findByCliniqueIdWithDetails(@Param("cliniqueId") String cliniqueId);
}