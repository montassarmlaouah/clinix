package com.pfe.pfe.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pfe.pfe.model.OffreAbonnement;

public interface OffreAbonnementRepository extends JpaRepository<OffreAbonnement, String> {

    List<OffreAbonnement> findByActifTrueOrderByOrdreAffichageAsc();

    List<OffreAbonnement> findAllByOrderByOrdreAffichageAsc();

    List<OffreAbonnement> findByActifTrueAndCategorieOrderByOrdreAffichageAsc(String categorie);
}
