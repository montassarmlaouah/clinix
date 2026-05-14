package com.pfe.pfe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pfe.pfe.model.Patient;

@Repository
public interface PatientRepository extends JpaRepository<Patient, String> {
    Optional<Patient> findByNumeroPatient(String numeroPatient);
    Optional<Patient> findByTelephone(String telephone);
    List<Patient> findByCliniqueId(String cliniqueId);
    List<Patient> findByMedecinCabinetId(String medecinId);

    long countByMedecinCabinetId(String medecinId);
}
