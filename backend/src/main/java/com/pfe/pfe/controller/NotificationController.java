package com.pfe.pfe.controller;

import com.pfe.pfe.dto.NotificationUtilisateurDTO;
import com.pfe.pfe.service.NotificationUtilisateurService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class NotificationController {

    private final NotificationUtilisateurService notificationService;

    /**
     * Récupère toutes les notifications de l'utilisateur connecté
     */
    @GetMapping
    public ResponseEntity<List<NotificationUtilisateurDTO>> getAllNotifications() {
        Long userId = getCurrentUserIdLong();
        String userIdStr = getCurrentUserIdStr();
        log.info("GET /api/notifications - userId: {}, userIdStr: {}", userId, userIdStr);
        List<NotificationUtilisateurDTO> notifications = notificationService.getAllNotifications(userId, userIdStr);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Récupère les notifications non lues de l'utilisateur connecté
     */
    @GetMapping("/non-lues")
    public ResponseEntity<List<NotificationUtilisateurDTO>> getUnreadNotifications() {
        Long userId = getCurrentUserIdLong();
        String userIdStr = getCurrentUserIdStr();
        log.info("GET /api/notifications/non-lues - userId: {}, userIdStr: {}", userId, userIdStr);
        List<NotificationUtilisateurDTO> notifications = notificationService.getUnreadNotifications(userId, userIdStr);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Récupère les notifications du jour pour l'utilisateur connecté
     */
    @GetMapping("/aujourdhui")
    public ResponseEntity<List<NotificationUtilisateurDTO>> getTodayNotifications() {
        Long userId = getCurrentUserIdLong();
        String userIdStr = getCurrentUserIdStr();
        log.info("GET /api/notifications/aujourdhui - userId: {}, userIdStr: {}", userId, userIdStr);
        
        List<NotificationUtilisateurDTO> notifications = notificationService.getTodayNotifications(userId, userIdStr);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Récupère le nombre de notifications non lues
     */
    @GetMapping("/non-lues/count")
    public ResponseEntity<Long> getUnreadCount() {
        Long userId = getCurrentUserIdLong();
        String userIdStr = getCurrentUserIdStr();
        Long count = notificationService.getUnreadCount(userId, userIdStr);
        return ResponseEntity.ok(count);
    }

    /**
     * Marque une notification comme lue
     */
    @PutMapping("/{id}/marquer-lue")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        Long userId = getCurrentUserIdLong();
        String userIdStr = getCurrentUserIdStr();
        try {
            notificationService.markAsRead(id, userId, userIdStr);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Erreur lors du marquage de la notification {} comme lue: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    /**
     * Marque toutes les notifications comme lues
     */
    @PutMapping("/marquer-toutes-lues")
    public ResponseEntity<Void> markAllAsRead() {
        Long userId = getCurrentUserIdLong();
        String userIdStr = getCurrentUserIdStr();
        notificationService.markAllAsRead(userId, userIdStr);
        return ResponseEntity.ok().build();
    }

    /**
     * Supprime une notification
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        Long userId = getCurrentUserIdLong();
        String userIdStr = getCurrentUserIdStr();
        try {
            notificationService.deleteNotification(id, userId, userIdStr);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Erreur lors de la suppression de la notification {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    /**
     * Crée une notification (usage interne / super admin uniquement).
     */
    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<NotificationUtilisateurDTO> createNotification(
            @RequestBody NotificationUtilisateurDTO notificationDTO) {
        log.info("POST /api/notifications - Création d'une notification");

        NotificationUtilisateurDTO created = notificationService.creerNotification(notificationDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Récupère l'ID utilisateur (Long) depuis le JWT : uniquement si l'identifiant est numérique.
     */
    private Long getCurrentUserIdLong() {
        String idStr = getCurrentUserIdStr();
        if (idStr != null && !idStr.isBlank()) {
            try {
                return Long.parseLong(idStr.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        if (username != null && !username.isBlank()) {
            try {
                return Long.parseLong(username.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    /**
     * Récupère l'ID utilisateur (UUID String) depuis le JWT / principal (CustomUserDetails).
     * Utilise la réflexion pour éviter la dépendance directe au package security.
     */
    private String getCurrentUserIdStr() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        try {
            java.lang.reflect.Method getId = principal.getClass().getMethod("getId");
            Object id = getId.invoke(principal);
            return id != null ? id.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
