package com.pfe.pfe.dto;

import com.pfe.pfe.model.NotificationUtilisateur;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationUtilisateurDTO {
    
    private Long id;
    private String titre;
    private String message;
    private String type; // INFO, SUCCESS, WARNING, ERROR
    private Boolean lu;
    private String dateCreation; // Format ISO pour le frontend
    private String dateLecture;
    private Long destinataireId;
    private String destinataireIdStr;
    private String code;
    private String destinataireType;
    private Long referenceId;
    private String referenceType;
    private String actionUrl;

    /**
     * Convertit une entité NotificationUtilisateur en DTO
     */
    public static NotificationUtilisateurDTO fromEntity(NotificationUtilisateur notification) {
        NotificationUtilisateurDTO dto = new NotificationUtilisateurDTO();
        dto.setId(notification.getId());
        dto.setTitre(notification.getTitre());
        dto.setMessage(notification.getMessage());
        dto.setType(notification.getType().name());
        dto.setLu(notification.getLu());
        dto.setDateCreation(notification.getDateCreation().toString());
        dto.setDateLecture(notification.getDateLecture() != null ? notification.getDateLecture().toString() : null);
        dto.setDestinataireId(notification.getDestinataireId());
        dto.setDestinataireIdStr(notification.getDestinataireIdStr());
        dto.setCode(notification.getCode());
        dto.setDestinataireType(notification.getDestinataireType());
        dto.setReferenceId(notification.getReferenceId());
        dto.setReferenceType(notification.getReferenceType());
        dto.setActionUrl(notification.getActionUrl());
        return dto;
    }

    /**
     * Convertit un DTO en entité NotificationUtilisateur
     */
    public NotificationUtilisateur toEntity() {
        NotificationUtilisateur notification = new NotificationUtilisateur();
        notification.setId(this.id);
        notification.setTitre(this.titre);
        notification.setMessage(this.message);
        notification.setType(NotificationUtilisateur.TypeNotification.valueOf(this.type));
        notification.setLu(this.lu != null ? this.lu : false);
        if (this.dateCreation != null) {
            notification.setDateCreation(LocalDateTime.parse(this.dateCreation));
        }
        if (this.dateLecture != null) {
            notification.setDateLecture(LocalDateTime.parse(this.dateLecture));
        }
        notification.setDestinataireId(this.destinataireId);
        notification.setDestinataireIdStr(this.destinataireIdStr);
        notification.setCode(this.code);
        notification.setDestinataireType(this.destinataireType);
        notification.setReferenceId(this.referenceId);
        notification.setReferenceType(this.referenceType);
        notification.setActionUrl(this.actionUrl);
        return notification;
    }
}
