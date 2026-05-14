package com.pfe.pfe.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pfe.pfe.model.NoteHospitalisation;

@Repository
public interface NoteHospitalisationRepository extends JpaRepository<NoteHospitalisation, String> {
    List<NoteHospitalisation> findByHospitalisationIdOrderByDateCreationDesc(String hospitalisationId);
}
