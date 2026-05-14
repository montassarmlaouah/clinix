package com.pfe.pfe.repository;

import com.pfe.pfe.model.Planning;
import com.pfe.pfe.model.Planning.TypePlanning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PlanningRepository extends JpaRepository<Planning, String> {
    
    @Query("SELECT DISTINCT p FROM Planning p LEFT JOIN FETCH p.utilisateurs LEFT JOIN FETCH p.createur")
    List<Planning> findAllWithRelations();

    @Query("SELECT DISTINCT p FROM Planning p JOIN p.utilisateurs u LEFT JOIN FETCH p.utilisateurs LEFT JOIN FETCH p.createur WHERE u.id = :utilisateurId")
    List<Planning> findByUtilisateursIdWithRelations(@Param("utilisateurId") String utilisateurId);
    
    List<Planning> findByDateBetween(LocalDate debut, LocalDate fin);
    
    List<Planning> findByUtilisateursId(String utilisateurId);
    
    @Query("SELECT DISTINCT p FROM Planning p JOIN p.utilisateurs u WHERE p.date = :date AND p.type = :type AND u.id IN :utilisateurIds")
    List<Planning> findConflictingPlans(@Param("date") LocalDate date,
                                        @Param("type") TypePlanning type,
                                        @Param("utilisateurIds") List<String> utilisateurIds);
    
    List<Planning> findByType(TypePlanning type);
    
    List<Planning> findByCreateurId(String createurId);
    
    List<Planning> findByValide(Boolean valide);
    
    @Query("SELECT p FROM Planning p WHERE p.date >= :debut AND p.date <= :fin AND p.type = :type")
    List<Planning> findByPeriodeAndType(@Param("debut") LocalDate debut, 
                                        @Param("fin") LocalDate fin, 
                                        @Param("type") TypePlanning type);
}
