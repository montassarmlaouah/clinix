package com.pfe.pfe.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pfe.pfe.model.NotificationUtilisateur;

@Repository
public interface NotificationUtilisateurRepository extends JpaRepository<NotificationUtilisateur, Long> {

    /**
     * Récupère toutes les notifications d'un utilisateur spécifique
     */
    List<NotificationUtilisateur> findByDestinataireIdOrderByDateCreationDesc(Long destinataireId);

    /**
     * Récupère les notifications non lues d'un utilisateur
     */
    List<NotificationUtilisateur> findByDestinataireIdAndLuFalseOrderByDateCreationDesc(Long destinataireId);

    /**
     * Récupère les notifications d'aujourd'hui pour un utilisateur (par ID numérique)
     */
    @Query("SELECT n FROM NotificationUtilisateur n WHERE n.destinataireId = :destinataireId " +
           "AND n.dateCreation >= CURRENT_DATE " +
           "ORDER BY n.dateCreation DESC")
    List<NotificationUtilisateur> findTodayNotificationsByDestinataire(@Param("destinataireId") Long destinataireId);

    /**
     * Récupère les notifications d'aujourd'hui pour un utilisateur (par ID UUID ou numérique)
     */
    @Query("SELECT n FROM NotificationUtilisateur n WHERE " +
           "((:destinataireId IS NOT NULL AND n.destinataireId = :destinataireId) OR " +
           "(:destinataireIdStr IS NOT NULL AND n.destinataireIdStr = :destinataireIdStr)) " +
           "AND n.dateCreation >= CURRENT_DATE " +
           "ORDER BY n.dateCreation DESC")
    List<NotificationUtilisateur> findTodayNotificationsByDestinataireIdOrStr(
            @Param("destinataireId") Long destinataireId,
            @Param("destinataireIdStr") String destinataireIdStr);

    /**
     * Récupère toutes les notifications pour un utilisateur (par ID UUID)
     */
    List<NotificationUtilisateur> findByDestinataireIdStrOrderByDateCreationDesc(String destinataireIdStr);

    /**
     * Récupère les notifications non lues pour un utilisateur (par ID UUID)
     */
    List<NotificationUtilisateur> findByDestinataireIdStrAndLuFalseOrderByDateCreationDesc(String destinataireIdStr);

    /**
     * Compte le nombre de notifications non lues pour un utilisateur
     */
    Long countByDestinataireIdAndLuFalse(Long destinataireId);

    /**
     * Compte le nombre de notifications non lues pour un utilisateur (par ID UUID)
     */
    Long countByDestinataireIdStrAndLuFalse(String destinataireIdStr);

    /**
     * Récupère toutes les notifications pour un utilisateur (par ID numérique ou UUID)
     */
    @Query("SELECT n FROM NotificationUtilisateur n WHERE " +
           "(:destinataireId IS NOT NULL AND n.destinataireId = :destinataireId) OR " +
           "(:destinataireIdStr IS NOT NULL AND n.destinataireIdStr = :destinataireIdStr) " +
           "ORDER BY n.dateCreation DESC")
    List<NotificationUtilisateur> findByDestinataireIdOrStrOrderByDateCreationDesc(
            @Param("destinataireId") Long destinataireId,
            @Param("destinataireIdStr") String destinataireIdStr);

    /**
     * Compte les notifications non lues pour un utilisateur (par ID numérique ou UUID)
     */
    @Query("SELECT COUNT(n) FROM NotificationUtilisateur n WHERE " +
           "((:destinataireId IS NOT NULL AND n.destinataireId = :destinataireId) OR " +
           "(:destinataireIdStr IS NOT NULL AND n.destinataireIdStr = :destinataireIdStr)) AND n.lu = false")
    Long countByDestinataireIdOrStrAndLuFalse(@Param("destinataireId") Long destinataireId,
                                             @Param("destinataireIdStr") String destinataireIdStr);

    /**
     * Marque toutes les notifications d'un utilisateur comme lues
     */
    @Modifying
    @Query("UPDATE NotificationUtilisateur n SET n.lu = true, n.dateLecture = :dateLecture " +
           "WHERE n.destinataireId = :destinataireId AND n.lu = false")
    void markAllAsReadByDestinataire(@Param("destinataireId") Long destinataireId, 
                                      @Param("dateLecture") LocalDateTime dateLecture);

    @Modifying
    @Query("UPDATE NotificationUtilisateur n SET n.lu = true, n.dateLecture = :dateLecture " +
           "WHERE n.destinataireIdStr = :destinataireIdStr AND n.lu = false")
    void markAllAsReadByDestinataireIdStr(@Param("destinataireIdStr") String destinataireIdStr,
                                         @Param("dateLecture") LocalDateTime dateLecture);

    /**
     * Récupère les notifications par type pour un utilisateur
     */
    List<NotificationUtilisateur> findByDestinataireIdAndTypeOrderByDateCreationDesc(
            Long destinataireId, NotificationUtilisateur.TypeNotification type);

    /**
     * Récupère les notifications créées après une certaine date
     */
    List<NotificationUtilisateur> findByDestinataireIdAndDateCreationAfterOrderByDateCreationDesc(
            Long destinataireId, LocalDateTime dateDebut);

    /**
     * Supprime les anciennes notifications (cleanup)
     */
    @Modifying
    @Query("DELETE FROM NotificationUtilisateur n WHERE n.dateCreation < :dateLimit")
    void deleteOldNotifications(@Param("dateLimit") LocalDateTime dateLimit);
}
