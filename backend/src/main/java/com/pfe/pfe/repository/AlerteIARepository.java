package com.pfe.pfe.repository;

import com.pfe.pfe.model.AlerteIA;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlerteIARepository extends JpaRepository<AlerteIA, String> {
    List<AlerteIA> findByTraitee(Boolean traitee);
    List<AlerteIA> findByNiveau(AlerteIA.NiveauAlerte niveau);
}
