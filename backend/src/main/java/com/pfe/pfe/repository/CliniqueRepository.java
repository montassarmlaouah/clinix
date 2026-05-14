package com.pfe.pfe.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pfe.pfe.model.Clinique;

@Repository
public interface CliniqueRepository extends JpaRepository<Clinique, String> {
    List<Clinique> findByActif(Boolean actif);
    boolean existsByNom(String nom);
    boolean existsByNomAndIdNot(String nom, String id);
}
