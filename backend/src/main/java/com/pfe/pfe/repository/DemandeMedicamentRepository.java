package com.pfe.pfe.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pfe.pfe.model.DemandeMedicament;

public interface DemandeMedicamentRepository extends JpaRepository<DemandeMedicament, String> {

    List<DemandeMedicament> findByCliniqueIdOrderByDateCreationDesc(String cliniqueId);

    List<DemandeMedicament> findByPatientIdOrderByDateCreationDesc(String patientId);

    List<DemandeMedicament> findByDemandeurIdOrderByDateCreationDesc(String demandeurId);

    List<DemandeMedicament> findByStatutOrderByDateCreationDesc(String statut);
}
