package com.pfe.pfe.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pfe.pfe.model.DemandeOperation;

public interface DemandeOperationRepository extends JpaRepository<DemandeOperation, String> {

    List<DemandeOperation> findByCliniqueIdOrderByDateCreationDesc(String cliniqueId);

    List<DemandeOperation> findByPatientIdOrderByDateCreationDesc(String patientId);

    List<DemandeOperation> findByDemandeurIdOrderByDateCreationDesc(String demandeurId);

    List<DemandeOperation> findByStatutOrderByDateCreationDesc(String statut);
}
