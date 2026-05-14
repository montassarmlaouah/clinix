package com.pfe.pfe.repository;

import com.pfe.pfe.model.Equipement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EquipementRepository extends JpaRepository<Equipement, String> {
    List<Equipement> findByCliniqueId(String cliniqueId);

    List<Equipement> findByCliniqueIdAndEtatTechniqueIn(String cliniqueId, Collection<Equipement.EtatTechnique> etats);
    List<Equipement> findByEtatTechnique(Equipement.EtatTechnique etatTechnique);
    List<Equipement> findByStatut(Equipement.StatutEquipement statut);
    List<Equipement> findByTypeLocalisation(Equipement.TypeLocalisation typeLocalisation);
    List<Equipement> findByCategorie(Equipement.CategorieEquipement categorie);
    Optional<Equipement> findByCode(String code);
    List<Equipement> findByChambreId(String chambreId);

    // Recherche par nom
    List<Equipement> findByNomContainingIgnoreCase(String nom);

    // Correction du nom de la colonne (date_maintenance au lieu de date_mainenance)
    @Query("SELECT e FROM Equipement e WHERE e.dateMaintenance <= :date AND e.etatTechnique != 'HORS_SERVICE'")
    List<Equipement> findByDateMaintenanceRequise(@Param("date") LocalDateTime date);
}