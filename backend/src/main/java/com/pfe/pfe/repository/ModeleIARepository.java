package com.pfe.pfe.repository;

import com.pfe.pfe.model.ModeleIA;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ModeleIARepository extends JpaRepository<ModeleIA, String> {
}
