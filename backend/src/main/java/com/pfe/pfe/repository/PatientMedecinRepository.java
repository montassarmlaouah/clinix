package com.pfe.pfe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pfe.pfe.model.PatientMedecin;

public interface PatientMedecinRepository extends JpaRepository<PatientMedecin, String> {

    List<PatientMedecin> findByPatientIdOrderByPrincipalDescDateAttributionAsc(String patientId);

    Optional<PatientMedecin> findByPatientIdAndMedecinId(String patientId, String medecinId);

    boolean existsByPatientIdAndMedecinId(String patientId, String medecinId);

    @Modifying
    @Query("UPDATE PatientMedecin pm SET pm.principal = false WHERE pm.patient.id = :patientId")
    void clearPrincipalForPatient(@Param("patientId") String patientId);

    @Query("SELECT pm FROM PatientMedecin pm JOIN FETCH pm.medecin JOIN FETCH pm.patient p WHERE p.id IN :patientIds")
    List<PatientMedecin> findByPatientIdInWithMedecin(@Param("patientIds") List<String> patientIds);
}
