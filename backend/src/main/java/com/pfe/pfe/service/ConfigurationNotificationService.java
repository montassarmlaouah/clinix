package com.pfe.pfe.service;

import com.pfe.pfe.model.ConfigurationNotification;
import com.pfe.pfe.repository.ConfigurationNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.time.LocalDateTime;

/**
 * Service pour gérer les préférences de notifications des utilisateurs
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ConfigurationNotificationService {
    
    private final ConfigurationNotificationRepository configRepository;

    /**
     * Obtenir ou créer la configuration d'un utilisateur
     */
    public ConfigurationNotification obtenirConfiguration(String userId) {
        Optional<ConfigurationNotification> existing = configRepository.findByUserId(userId);
        return existing.orElseGet(() -> creerConfigurationParDefaut(userId));
    }

    /**
     * Créer une configuration par défaut
     */
    private ConfigurationNotification creerConfigurationParDefaut(String userId) {
        ConfigurationNotification config = new ConfigurationNotification();
        config.setUserId(userId);
        config.setNotificationsEmail(true);
        config.setNotificationsSms(true);
        config.setNotificationsPush(true);
        config.setRappelRendezVous(true);
        config.setAlertesMedicales(true);
        config.setNotificationsAdministratives(true);
        config.setFuseauHoraire("Africa/Tunis");
        return configRepository.save(config);
    }

    /**
     * Mettre à jour les préférences de notifications
     */
    public ConfigurationNotification mettreAJourConfiguration(String userId, ConfigurationNotification config) {
        ConfigurationNotification existing = obtenirConfiguration(userId);
        
        if (config.getNotificationsEmail() != null) {
            existing.setNotificationsEmail(config.getNotificationsEmail());
        }
        if (config.getNotificationsSms() != null) {
            existing.setNotificationsSms(config.getNotificationsSms());
        }
        if (config.getNotificationsPush() != null) {
            existing.setNotificationsPush(config.getNotificationsPush());
        }
        if (config.getRappelRendezVous() != null) {
            existing.setRappelRendezVous(config.getRappelRendezVous());
        }
        if (config.getAlertesMedicales() != null) {
            existing.setAlertesMedicales(config.getAlertesMedicales());
        }
        if (config.getNotificationsAdministratives() != null) {
            existing.setNotificationsAdministratives(config.getNotificationsAdministratives());
        }
        if (config.getEmailPrincipal() != null) {
            existing.setEmailPrincipal(config.getEmailPrincipal());
        }
        if (config.getTelephonePrincipal() != null) {
            existing.setTelephonePrincipal(config.getTelephonePrincipal());
        }
        if (config.getHeureDebutSilencieux() != null) {
            existing.setHeureDebutSilencieux(config.getHeureDebutSilencieux());
        }
        if (config.getHeureFinSilencieux() != null) {
            existing.setHeureFinSilencieux(config.getHeureFinSilencieux());
        }
        if (config.getFuseauHoraire() != null) {
            existing.setFuseauHoraire(config.getFuseauHoraire());
        }
        
        return configRepository.save(existing);
    }

    /**
     * Activer tous les types de notifications
     */
    public void activerToutesNotifications(String userId) {
        ConfigurationNotification config = obtenirConfiguration(userId);
        config.setNotificationsEmail(true);
        config.setNotificationsSms(true);
        config.setNotificationsPush(true);
        configRepository.save(config);
    }

    /**
     * Désactiver tous les types de notifications
     */
    public void desactiverToutesNotifications(String userId) {
        ConfigurationNotification config = obtenirConfiguration(userId);
        config.setNotificationsEmail(false);
        config.setNotificationsSms(false);
        config.setNotificationsPush(false);
        configRepository.save(config);
    }

    /**
     * Vérifier si l'utilisateur reçoit les notifications par email
     */
    public boolean accepteNotificationsEmail(String userId) {
        ConfigurationNotification config = obtenirConfiguration(userId);
        return config.getNotificationsEmail() != null && config.getNotificationsEmail();
    }

    /**
     * Vérifier si l'utilisateur reçoit les notifications par SMS
     */
    public boolean accepteNotificationsSms(String userId) {
        ConfigurationNotification config = obtenirConfiguration(userId);
        return config.getNotificationsSms() != null && config.getNotificationsSms();
    }

    /**
     * Vérifier si l'utilisateur accepte les rappels de rendez-vous
     */
    public boolean accepteRappelRendezVous(String userId) {
        ConfigurationNotification config = obtenirConfiguration(userId);
        return config.getRappelRendezVous() != null && config.getRappelRendezVous();
    }

    /**
     * Vérifier si l'utilisateur accepte les alertes médicales
     */
    public boolean accepteAlertesMedicales(String userId) {
        ConfigurationNotification config = obtenirConfiguration(userId);
        return config.getAlertesMedicales() != null && config.getAlertesMedicales();
    }

    /**
     * Vérifier si c'est l'heure de silence
     */
    public boolean estEnHeuresSilence(String userId) {
        ConfigurationNotification config = obtenirConfiguration(userId);
        if (config.getHeureDebutSilencieux() == null || config.getHeureFinSilencieux() == null) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        String heureActuelle = String.format("%02d:%02d", now.getHour(), now.getMinute());
        
        return heureActuelle.compareTo(config.getHeureDebutSilencieux()) >= 0 &&
               heureActuelle.compareTo(config.getHeureFinSilencieux()) < 0;
    }
}
