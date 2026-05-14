package com.pfe.pfe.repository;

import com.pfe.pfe.model.ImagerieDICOM;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImagerieDICOMRepository extends JpaRepository<ImagerieDICOM, String> {
    List<ImagerieDICOM> findByPatientId(String patientId);
    List<ImagerieDICOM> findByStatut(ImagerieDICOM.StatutImagerie statut);
    List<ImagerieDICOM> findByRadiologueId(String radiologueId);
    List<ImagerieDICOM> findByMedecinDemandeurId(String medecinId);
    List<ImagerieDICOM> findByRadiologueIdAndStatut(String radiologueId, ImagerieDICOM.StatutImagerie statut);
    List<ImagerieDICOM> findByDossierMedicalId(String dossierMedicalId);

    List<ImagerieDICOM> findByStatutAndRadiologueIsNull(ImagerieDICOM.StatutImagerie statut);

    @Query("SELECT DISTINCT i FROM ImagerieDICOM i JOIN FETCH i.patient p LEFT JOIN FETCH p.clinique LEFT JOIN FETCH i.medecinDemandeur md LEFT JOIN FETCH md.clinique LEFT JOIN FETCH i.radiologue rad LEFT JOIN FETCH i.rapport rp LEFT JOIN FETCH i.dossierMedical dm WHERE rad.id = :rid")
    List<ImagerieDICOM> findByRadiologueIdFetched(@Param("rid") String radiologueId);

    @Query("SELECT DISTINCT i FROM ImagerieDICOM i JOIN FETCH i.patient p LEFT JOIN FETCH p.clinique LEFT JOIN FETCH i.medecinDemandeur md LEFT JOIN FETCH md.clinique WHERE i.statut = :st AND i.radiologue IS NULL")
    List<ImagerieDICOM> findEnAttenteSansRadiologueFetched(@Param("st") ImagerieDICOM.StatutImagerie st);
}
