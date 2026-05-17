package com.pfe.pfe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pfe.pfe.model.PrestationFacturation;
import com.pfe.pfe.model.TypePrestation;

public interface PrestationFacturationRepository extends JpaRepository<PrestationFacturation, String> {

    List<PrestationFacturation> findByCliniqueIdAndActifTrueOrderByTypeAscCodeAsc(String cliniqueId);

    List<PrestationFacturation> findByCliniqueIdOrderByTypeAscCodeAsc(String cliniqueId);

    Optional<PrestationFacturation> findByCliniqueIdAndTypeAndActifTrue(String cliniqueId, TypePrestation type);

    boolean existsByCliniqueId(String cliniqueId);
}
