package com.pfe.pfe.repository;

import com.pfe.pfe.model.Maintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MaintenanceRepository extends JpaRepository<Maintenance, String> {
    List<Maintenance> findByEquipementId(String equipementId);
    List<Maintenance> findByTechnicienId(String technicienId);
    List<Maintenance> findByStatut(Maintenance.StatutMaintenance statut);
}
