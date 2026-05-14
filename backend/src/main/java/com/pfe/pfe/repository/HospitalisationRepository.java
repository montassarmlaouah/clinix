package com.pfe.pfe.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pfe.pfe.model.Hospitalisation;

@Repository
public interface HospitalisationRepository extends JpaRepository<Hospitalisation, String> {
    List<Hospitalisation> findByPatientId(String patientId);
    List<Hospitalisation> findByStatut(Hospitalisation.StatutHospitalisation statut);
    List<Hospitalisation> findByChambreServiceIdAndStatut(String serviceId, Hospitalisation.StatutHospitalisation statut);
}
