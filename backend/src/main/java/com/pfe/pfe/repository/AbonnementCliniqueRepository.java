package com.pfe.pfe.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pfe.pfe.model.AbonnementClinique;

public interface AbonnementCliniqueRepository extends JpaRepository<AbonnementClinique, String> {

    @Query("SELECT a FROM AbonnementClinique a JOIN FETCH a.clinique JOIN FETCH a.offre WHERE a.clinique.id = :cid ORDER BY a.dateDebut DESC")
    List<AbonnementClinique> findByCliniqueIdOrderByDateDebutDesc(@Param("cid") String cliniqueId);

    @Query("SELECT a FROM AbonnementClinique a JOIN FETCH a.clinique JOIN FETCH a.offre WHERE a.clinique.id = :cid ORDER BY a.dateCreation DESC")
    List<AbonnementClinique> findByCliniqueIdOrderByDateCreationDesc(@Param("cid") String cliniqueId);

    List<AbonnementClinique> findByCliniqueIdAndStatut(String cliniqueId, String statut);

    Optional<AbonnementClinique> findByStripeSessionId(String stripeSessionId);

    Optional<AbonnementClinique> findByStripeSubscriptionId(String stripeSubscriptionId);

    /**
     * Abonnements au statut Actif (toutes cliniques, super admin).
     * Le statut est stocké en majuscules côté application ({@code ACTIF}).
     */
    @Query("SELECT a FROM AbonnementClinique a JOIN FETCH a.clinique JOIN FETCH a.offre WHERE a.statut = :statut ORDER BY a.dateCreation DESC")
    List<AbonnementClinique> findByStatutForSuperAdmin(@Param("statut") String statut);

    /**
     * Abonnements avec montant payé strictement positif (super admin).
     * Comparaison via paramètre {@link BigDecimal} pour éviter les ambiguïtés JPQL (literal 0 vs DECIMAL).
     */
    @Query("SELECT a FROM AbonnementClinique a JOIN FETCH a.clinique JOIN FETCH a.offre WHERE a.montantPaye > :zero ORDER BY a.dateCreation DESC")
    List<AbonnementClinique> findPaidSubscriptionsOrderByDateCreationDesc(@Param("zero") BigDecimal zero);
}
