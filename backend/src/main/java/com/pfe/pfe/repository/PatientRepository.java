package com.pfe.pfe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pfe.pfe.model.Patient;

@Repository
public interface PatientRepository extends JpaRepository<Patient, String> {
    Optional<Patient> findByNumeroPatient(String numeroPatient);
    Optional<Patient> findByTelephone(String telephone);

    @Query("""
        SELECT p FROM Patient p
        WHERE p.clinique.id = :cliniqueId
        AND (p.actif IS NULL OR p.actif = true)
        ORDER BY p.nom ASC, p.prenom ASC
        """)
    List<Patient> findByCliniqueId(@Param("cliniqueId") String cliniqueId);

    @Query("""
        SELECT p FROM Patient p
        WHERE p.medecinCabinet.id = :medecinId
        AND (p.actif IS NULL OR p.actif = true)
        ORDER BY p.nom ASC, p.prenom ASC
        """)
    List<Patient> findByMedecinCabinetId(@Param("medecinId") String medecinId);

    @Query("""
        SELECT p FROM Patient p
        WHERE p.actif IS NULL OR p.actif = true
        ORDER BY p.nom ASC, p.prenom ASC
        """)
    List<Patient> findAllActifs();

    @Query("""
        SELECT p FROM Patient p
        WHERE p.clinique.id = :cliniqueId
        AND p.actif = false
        ORDER BY p.nom ASC, p.prenom ASC
        """)
    List<Patient> findInactifsByCliniqueId(@Param("cliniqueId") String cliniqueId);

    long countByMedecinCabinetId(String medecinId);
}
