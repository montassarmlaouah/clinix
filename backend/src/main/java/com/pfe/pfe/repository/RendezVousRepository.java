package com.pfe.pfe.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pfe.pfe.model.RendezVous;

@Repository
public interface RendezVousRepository extends JpaRepository<RendezVous, String> {
    List<RendezVous> findByPatientId(String patientId);
    List<RendezVous> findByMedecinId(String medecinId);
    List<RendezVous> findByMedecinIdAndDateHeureBetween(String medecinId, LocalDateTime debut, LocalDateTime fin);
    List<RendezVous> findByMedecinIdAndDateHeureBetweenAndIdNot(String medecinId, LocalDateTime debut, LocalDateTime fin, String id);
    List<RendezVous> findByStatut(RendezVous.StatutRendezVous statut);
    List<RendezVous> findByMedecinCliniqueId(String cliniqueId);

    long countByMedecinIdAndDateHeureBetween(String medecinId, LocalDateTime debut, LocalDateTime fin);

    @Query("SELECT r FROM RendezVous r JOIN r.patient p WHERE p.clinique.id = :cliniqueId "
            + "AND r.dateHeure >= :debut AND r.dateHeure < :fin ORDER BY r.dateHeure")
    List<RendezVous> findByCliniqueIdAndDateHeureBetween(
            @Param("cliniqueId") String cliniqueId,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin);

    /** RDV du médecin avec patients « clinique » (pas de lien cabinet exclusif). */
    @Query("SELECT r FROM RendezVous r JOIN r.patient p WHERE r.medecin.id = :medecinId "
            + "AND p.clinique IS NOT NULL AND p.clinique.id = :cliniqueId AND p.medecinCabinet IS NULL "
            + "ORDER BY r.dateHeure DESC")
    List<RendezVous> findRdvCliniquePourMedecin(
            @Param("medecinId") String medecinId,
            @Param("cliniqueId") String cliniqueId);

    /** RDV avec patients suivis en cabinet par ce médecin. */
    @Query("SELECT r FROM RendezVous r JOIN r.patient p WHERE r.medecin.id = :medecinId "
            + "AND p.medecinCabinet IS NOT NULL AND p.medecinCabinet.id = :medecinId "
            + "ORDER BY r.dateHeure DESC")
    List<RendezVous> findRdvCabinetPourMedecin(@Param("medecinId") String medecinId);
}
