package com.pfe.pfe.repository;

import com.pfe.pfe.model.Garde;
import com.pfe.pfe.model.Garde.TypeGarde;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GardeRepository extends JpaRepository<Garde, String> {
    
    List<Garde> findByUtilisateurId(String utilisateurId);
    
    List<Garde> findByType(TypeGarde type);
    
    List<Garde> findByDebutBetween(LocalDateTime debut, LocalDateTime fin);
    
    List<Garde> findByPlanningId(String planningId);

    @Query("SELECT DISTINCT g FROM Garde g LEFT JOIN FETCH g.utilisateur LEFT JOIN FETCH g.service WHERE g.planning.id = :planningId")
    List<Garde> findByPlanningIdWithUtilisateurAndService(@Param("planningId") String planningId);

    @Query("SELECT g FROM Garde g WHERE g.utilisateur.id = :utilisateurId AND g.debut >= :debut AND g.fin <= :fin")
    List<Garde> findByUtilisateurAndPeriode(@Param("utilisateurId") String utilisateurId, 
                                             @Param("debut") LocalDateTime debut, 
                                             @Param("fin") LocalDateTime fin);
    
    @Query("SELECT g FROM Garde g WHERE g.debut <= :dateTime AND g.fin >= :dateTime")
    List<Garde> findGardesEnCours(@Param("dateTime") LocalDateTime dateTime);

    @Query("""
        SELECT COUNT(g) > 0
        FROM Garde g
        WHERE g.utilisateur.id = :utilisateurId
          AND g.debut <= :fin
          AND g.fin >= :debut
        """)
    boolean existsOverlappingGardes(
            @Param("utilisateurId") String utilisateurId,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin
    );
}
