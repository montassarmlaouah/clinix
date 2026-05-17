package com.pfe.pfe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pfe.pfe.model.Hospitalisation;

@Repository
public interface HospitalisationRepository extends JpaRepository<Hospitalisation, String> {
    List<Hospitalisation> findByPatientId(String patientId);
    List<Hospitalisation> findByStatut(Hospitalisation.StatutHospitalisation statut);
    List<Hospitalisation> findByChambreServiceIdAndStatut(String serviceId, Hospitalisation.StatutHospitalisation statut);

    @Query("SELECT h FROM Hospitalisation h JOIN FETCH h.patient JOIN FETCH h.medecin m JOIN FETCH m.clinique LEFT JOIN FETCH h.chambre WHERE h.id = :id")
    Optional<Hospitalisation> findByIdWithDetails(@Param("id") String id);
}
