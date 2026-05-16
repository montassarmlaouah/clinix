package com.pfe.pfe.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pfe.pfe.model.HistoriqueSms;

@Repository
public interface HistoriqueSmsRepository extends JpaRepository<HistoriqueSms, String> {
    
    // Récupérer par téléphone
    List<HistoriqueSms> findByTelephone(String telephone);
    
    // Récupérer par statut
    List<HistoriqueSms> findByStatut(String statut);
    
    // Récupérer par destinataire ID
    List<HistoriqueSms> findByDestinataireId(String destinataireId);
    
    // Récupérer par type de SMS
    List<HistoriqueSms> findByTypeSms(String typeSms);
    
    // Récupérer les SMS d'une période
    @Query("SELECT h FROM HistoriqueSms h WHERE h.dateEnvoi BETWEEN :debut AND :fin ORDER BY h.dateEnvoi DESC")
    List<HistoriqueSms> findByDatePeriode(@Param("debut") LocalDateTime debut, @Param("fin") LocalDateTime fin);
    
    // Récupérer les SMS échoués
    @Query("SELECT h FROM HistoriqueSms h WHERE h.statut IN ('FAILED', 'UNDELIVERED')")
    List<HistoriqueSms> findFailedSms();
    
    // Récupérer par Twilio SID
    HistoriqueSms findByTwilioSid(String twilioSid);
    
    // Statistiques: nombre de SMS envoyés par jour
    @Query("SELECT COUNT(h) FROM HistoriqueSms h WHERE CAST(h.dateEnvoi AS date) = CURRENT_DATE")
    Long countTodaySms();
    
    // Coût total des SMS d'une période
    @Query("SELECT SUM(h.fraisCents) FROM HistoriqueSms h WHERE h.dateEnvoi BETWEEN :debut AND :fin")
    Double getTotalCost(@Param("debut") LocalDateTime debut, @Param("fin") LocalDateTime fin);

    /** SMS envoyés avec succès pour une clinique sur la période d'abonnement. */
    @Query("SELECT COUNT(h) FROM HistoriqueSms h WHERE h.cliniqueId = :cliniqueId AND h.statut = 'SENT' "
            + "AND h.dateEnvoi >= :debut AND h.dateEnvoi <= :fin")
    long countSentForCliniqueInPeriod(
            @Param("cliniqueId") String cliniqueId,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin);
}
