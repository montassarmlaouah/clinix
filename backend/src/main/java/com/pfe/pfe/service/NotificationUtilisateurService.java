package com.pfe.pfe.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pfe.pfe.dto.NotificationUtilisateurDTO;
import com.pfe.pfe.model.NotificationUtilisateur;
import com.pfe.pfe.repository.NotificationUtilisateurRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationUtilisateurService {

    private final NotificationUtilisateurRepository notificationRepository;

    /**
     * Créer une nouvelle notification
     */
    @Transactional
    public NotificationUtilisateurDTO creerNotification(NotificationUtilisateurDTO dto) {
        log.info("Création d'une nouvelle notification pour le destinataire {}", dto.getDestinataireId() != null ? dto.getDestinataireId() : dto.getDestinataireIdStr());
        
        NotificationUtilisateur notification = new NotificationUtilisateur();
        notification.setTitre(dto.getTitre());
        notification.setMessage(dto.getMessage());
        notification.setType(NotificationUtilisateur.TypeNotification.valueOf(dto.getType()));
        notification.setDestinataireId(dto.getDestinataireId());
        notification.setDestinataireIdStr(dto.getDestinataireIdStr());
        notification.setCode(dto.getCode());
        notification.setDestinataireType(dto.getDestinataireType());
        notification.setReferenceId(dto.getReferenceId());
        notification.setReferenceType(dto.getReferenceType());
        notification.setActionUrl(dto.getActionUrl());
        notification.setLu(false);
        notification.setDateCreation(LocalDateTime.now());

        NotificationUtilisateur saved = notificationRepository.save(notification);
        log.info("Notification créée avec succès : {}", saved.getId());
        
        return NotificationUtilisateurDTO.fromEntity(saved);
    }

    /**
     * Créer une notification métier (par code et destinataire Long ou UUID).
     */
    @Transactional
    public NotificationUtilisateurDTO creerNotificationMetier(
            Long destinataireId,
            String destinataireIdStr,
            String destinataireType,
            String code,
            String titre,
            String message,
            NotificationUtilisateur.TypeNotification type,
            Long referenceId,
            String referenceType,
            String actionUrl) {
        if ((destinataireId == null && (destinataireIdStr == null || destinataireIdStr.isBlank()))) {
            throw new IllegalArgumentException("Destinataire requis (destinataireId ou destinataireIdStr)");
        }
        NotificationUtilisateurDTO dto = new NotificationUtilisateurDTO();
        dto.setDestinataireId(destinataireId);
        dto.setDestinataireIdStr(destinataireIdStr != null && !destinataireIdStr.isBlank() ? destinataireIdStr : null);
        dto.setDestinataireType(destinataireType);
        dto.setCode(code);
        dto.setTitre(titre);
        dto.setMessage(message);
        dto.setType(type.name());
        dto.setReferenceId(referenceId);
        dto.setReferenceType(referenceType);
        dto.setActionUrl(actionUrl);
        return creerNotification(dto);
    }

    /**
     * Récupère toutes les notifications d'un utilisateur
     */
    @Transactional(readOnly = true)
    public List<NotificationUtilisateurDTO> getAllNotifications(Long userId) {
        log.info("Récupération de toutes les notifications pour l'utilisateur {}", userId);
        
        List<NotificationUtilisateur> notifications = notificationRepository
                .findByDestinataireIdOrderByDateCreationDesc(userId);
        
        return notifications.stream()
                .map(NotificationUtilisateurDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Récupère les notifications non lues d'un utilisateur
     */
    @Transactional(readOnly = true)
    public List<NotificationUtilisateurDTO> getUnreadNotifications(Long userId) {
        log.info("Récupération des notifications non lues pour l'utilisateur {}", userId);
        
        List<NotificationUtilisateur> notifications = notificationRepository
                .findByDestinataireIdAndLuFalseOrderByDateCreationDesc(userId);
        
        return notifications.stream()
                .map(NotificationUtilisateurDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Récupère les notifications du jour pour un utilisateur
     */
    @Transactional(readOnly = true)
    public List<NotificationUtilisateurDTO> getTodayNotifications(Long userId) {
        return getTodayNotifications(userId, null);
    }

    /**
     * Récupère les notifications du jour (par ID numérique et/ou UUID)
     */
    @Transactional(readOnly = true)
    public List<NotificationUtilisateurDTO> getTodayNotifications(Long userId, String userIdStr) {
        List<NotificationUtilisateur> notifications;
        if (userIdStr != null && !userIdStr.isBlank()) {
            notifications = notificationRepository.findTodayNotificationsByDestinataireIdOrStr(userId, userIdStr);
        } else if (userId != null) {
            notifications = notificationRepository.findTodayNotificationsByDestinataire(userId);
        } else {
            throw new IllegalArgumentException("userId ou userIdStr requis");
        }
        return notifications.stream()
                .map(NotificationUtilisateurDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Marque une notification comme lue
     */
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        markAsRead(notificationId, userId, null);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId, String userIdStr) {
        log.info("Marquage de la notification {} comme lue pour l'utilisateur {}", notificationId, userId != null ? userId : userIdStr);
        
        NotificationUtilisateur notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification non trouvée : " + notificationId));
        
        boolean belongs = (notification.getDestinataireId() != null && userId != null && notification.getDestinataireId().equals(userId))
                || (notification.getDestinataireIdStr() != null && userIdStr != null && notification.getDestinataireIdStr().equals(userIdStr));
        if (!belongs) {
            throw new RuntimeException("Accès non autorisé à cette notification");
        }
        
        if (!notification.getLu()) {
            notification.setLu(true);
            notification.setDateLecture(LocalDateTime.now());
            notificationRepository.save(notification);
            log.info("Notification {} marquée comme lue", notificationId);
        }
    }

    /**
     * Marque toutes les notifications d'un utilisateur comme lues
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        markAllAsRead(userId, null);
    }

    @Transactional
    public void markAllAsRead(Long userId, String userIdStr) {
        LocalDateTime now = LocalDateTime.now();
        if (userId != null) {
            notificationRepository.markAllAsReadByDestinataire(userId, now);
        }
        if (userIdStr != null && !userIdStr.isBlank()) {
            notificationRepository.markAllAsReadByDestinataireIdStr(userIdStr, now);
        }
        log.info("Toutes les notifications marquées comme lues pour l'utilisateur {}", userId != null ? userId : userIdStr);
    }

    /**
     * Supprime une notification
     */
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        deleteNotification(notificationId, userId, null);
    }

    @Transactional
    public void deleteNotification(Long notificationId, Long userId, String userIdStr) {
        log.info("Suppression de la notification {} pour l'utilisateur {}", notificationId, userId != null ? userId : userIdStr);
        
        NotificationUtilisateur notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification non trouvée : " + notificationId));
        
        boolean belongs = (notification.getDestinataireId() != null && userId != null && notification.getDestinataireId().equals(userId))
                || (notification.getDestinataireIdStr() != null && userIdStr != null && notification.getDestinataireIdStr().equals(userIdStr));
        if (!belongs) {
            throw new RuntimeException("Accès non autorisé à cette notification");
        }
        
        notificationRepository.delete(notification);
        log.info("Notification {} supprimée avec succès", notificationId);
    }

    /**
     * Compte le nombre de notifications non lues pour un utilisateur
     */
    @Transactional(readOnly = true)
    public Long getUnreadCount(Long userId) {
        return getUnreadCount(userId, null);
    }

    @Transactional(readOnly = true)
    public Long getUnreadCount(Long userId, String userIdStr) {
        if (userIdStr != null && !userIdStr.isBlank()) {
            return notificationRepository.countByDestinataireIdOrStrAndLuFalse(userId, userIdStr);
        }
        if (userId != null) {
            return notificationRepository.countByDestinataireIdAndLuFalse(userId);
        }
        throw new IllegalArgumentException("userId ou userIdStr requis");
    }

    /**
     * Crée une notification de rendez-vous (par ID numérique)
     */
    @Transactional
    public NotificationUtilisateurDTO creerNotificationRendezVous(Long userId, String userType, 
                                                                   String titre, String message, 
                                                                   Long rendezVousId) {
        log.info("Création d'une notification de rendez-vous pour l'utilisateur {}", userId);
        
        NotificationUtilisateur notification = new NotificationUtilisateur();
        notification.setTitre(titre);
        notification.setMessage(message);
        notification.setType(NotificationUtilisateur.TypeNotification.INFO);
        notification.setDestinataireId(userId);
        notification.setDestinataireType(userType);
        notification.setReferenceId(rendezVousId);
        notification.setReferenceType("RENDEZ_VOUS");
        notification.setActionUrl("/rendez-vous");
        notification.setLu(false);
        notification.setDateCreation(LocalDateTime.now());

        NotificationUtilisateur saved = notificationRepository.save(notification);
        return NotificationUtilisateurDTO.fromEntity(saved);
    }

    /**
     * Crée une notification de rendez-vous (par UUID String — pour User.id)
     */
    @Transactional
    public NotificationUtilisateurDTO creerNotificationRendezVousStr(String userIdStr, String userType,
                                                                      String titre, String message,
                                                                      String rendezVousIdStr) {
        log.info("Création d'une notification de rendez-vous pour l'utilisateur UUID {}", userIdStr);

        NotificationUtilisateur notification = new NotificationUtilisateur();
        notification.setTitre(titre);
        notification.setMessage(message);
        notification.setType(NotificationUtilisateur.TypeNotification.INFO);
        notification.setDestinataireIdStr(userIdStr);
        notification.setDestinataireType(userType);
        notification.setReferenceType("RENDEZ_VOUS");
        notification.setActionUrl("/rendez-vous");
        notification.setLu(false);
        notification.setDateCreation(LocalDateTime.now());

        NotificationUtilisateur saved = notificationRepository.save(notification);
        return NotificationUtilisateurDTO.fromEntity(saved);
    }

    /**
     * Nettoie les anciennes notifications (plus de 30 jours)
     */
    @Transactional
    public void cleanOldNotifications() {
        log.info("Nettoyage des anciennes notifications");
        
        LocalDateTime dateLimit = LocalDateTime.now().minusDays(30);
        notificationRepository.deleteOldNotifications(dateLimit);
        
        log.info("Anciennes notifications supprimées");
    }
}
