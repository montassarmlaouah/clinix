package com.pfe.pfe.repository;

import com.pfe.pfe.model.RapportImagerie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RapportImagerieRepository extends JpaRepository<RapportImagerie, String> {
    Optional<RapportImagerie> findByImagerieId(String imagerieId);
    List<RapportImagerie> findByRadiologueId(String radiologueId);
    List<RapportImagerie> findByValide(Boolean valide);
}
