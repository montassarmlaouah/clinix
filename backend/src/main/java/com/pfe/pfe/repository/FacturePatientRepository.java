package com.pfe.pfe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pfe.pfe.model.FacturePatient;
import com.pfe.pfe.model.StatutFacturePatient;

public interface FacturePatientRepository extends JpaRepository<FacturePatient, String> {

    @Query("SELECT f FROM FacturePatient f JOIN FETCH f.patient JOIN FETCH f.clinique WHERE f.clinique.id = :cliniqueId ORDER BY f.dateFacture DESC, f.numeroFacture DESC")
    List<FacturePatient> findByCliniqueWithDetails(@Param("cliniqueId") String cliniqueId);

    @Query("""
        SELECT f FROM FacturePatient f JOIN FETCH f.patient JOIN FETCH f.clinique
        WHERE f.clinique.id = :cliniqueId AND f.statut = :statut
        ORDER BY f.dateFacture DESC, f.numeroFacture DESC
        """)
    List<FacturePatient> findByCliniqueAndStatutWithDetails(
            @Param("cliniqueId") String cliniqueId,
            @Param("statut") StatutFacturePatient statut);

    @Query("SELECT f FROM FacturePatient f JOIN FETCH f.patient JOIN FETCH f.clinique WHERE f.patient.id = :patientId ORDER BY f.dateFacture DESC")
    List<FacturePatient> findByPatientWithDetails(@Param("patientId") String patientId);

    @Query("SELECT f FROM FacturePatient f JOIN FETCH f.patient JOIN FETCH f.clinique LEFT JOIN FETCH f.lignes WHERE f.id = :id")
    Optional<FacturePatient> findByIdWithDetails(@Param("id") String id);

    Optional<FacturePatient> findByHospitalisationId(String hospitalisationId);

    boolean existsByNumeroFacture(String numeroFacture);
}
