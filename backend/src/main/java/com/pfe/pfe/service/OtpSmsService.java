package com.pfe.pfe.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.pfe.pfe.dto.OtpIssueResult;
import com.pfe.pfe.dto.SmsSendOutcome;
import com.pfe.pfe.model.HistoriqueSms;
import com.pfe.pfe.repository.HistoriqueSmsRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Codes OTP (stockage mémoire) et envoi SMS via TunisieSMS uniquement (clé globale).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OtpSmsService {

    private final HistoriqueSmsRepository historiqueSmsRepository;
    private final TunisieSmsService tunisieSmsService;

    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    private static final int OTP_VALIDITY_MINUTES = 5;

    public OtpIssueResult envoyerCodeOtp(String telephone) {
        String codeOtp = genererCodeOtp();
        String otpKey = tunisieSmsService.normalizeOtpStorageKey(telephone);
        OtpData otpData = new OtpData(codeOtp, LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES));
        otpStorage.put(otpKey, otpData);

        boolean smsEnvoyeParApi = false;
        if (tunisieSmsService.isReadyForGlobalSend()) {
            String msg = "Clinux - Votre code de verification : " + codeOtp + " (valide 5 min). Ne le partagez avec personne.";
            try {
                SmsSendOutcome outcome = tunisieSmsService.sendSmsWithGlobalKey(telephone, msg);
                smsEnvoyeParApi = outcome.envoye();
                if (!smsEnvoyeParApi) {
                    log.warn("[OTP] API TunisieSMS n'a pas accepté l'envoi vers {} : {}", telephone, outcome.detail());
                }
            } catch (Exception e) {
                log.error("[OTP] Echec envoi SMS TunisieSMS vers {}: {}", telephone, e.getMessage());
            }
        } else {
            log.warn("[OTP] TunisieSMS non configure (tunisiesms.enabled + tunisiesms.api.key) — code pour {} : {}", telephone, codeOtp);
        }

        return new OtpIssueResult(codeOtp, smsEnvoyeParApi);
    }

    public boolean verifierCodeOtp(String telephone, String codeOtp) {
        String otpKey = tunisieSmsService.normalizeOtpStorageKey(telephone);
        OtpData data = otpStorage.get(otpKey);

        if (data == null) {
            log.warn("Aucun code OTP trouvé pour le téléphone: {}", telephone);
            return false;
        }

        if (LocalDateTime.now().isAfter(data.getExpiration())) {
            log.warn("Code OTP expiré pour le téléphone: {}", telephone);
            otpStorage.remove(otpKey);
            return false;
        }

        if (data.getCode().equals(codeOtp)) {
            log.info("Code OTP vérifié avec succès pour: {}", telephone);
            otpStorage.remove(otpKey);
            return true;
        }

        log.warn("Code OTP incorrect pour le téléphone: {}", telephone);
        return false;
    }

    @Async
    public void envoyerSms(String telephone, String message) {
        envoyerSms(telephone, message, "NOTIFICATION", null);
    }

    @Async
    public void envoyerSms(String telephone, String message, String typeSms, String userId) {
        try {
            if (tunisieSmsService.isReadyForGlobalSend()) {
                SmsSendOutcome outcome = tunisieSmsService.sendSmsWithGlobalKey(telephone, message);
                if (outcome.envoye()) {
                    sauvegarderHistoriqueSms(telephone, message, "SENT", null, typeSms, null);
                } else {
                    log.warn("[SMS] TunisieSMS refus ou erreur API vers {} : {}", telephone, outcome.detail());
                    sauvegarderHistoriqueSms(telephone, message, "FAILED", null, typeSms, null);
                }
            } else {
                log.warn("[SMS] TunisieSMS non configure — message non envoye vers {} : {}", telephone, message);
                sauvegarderHistoriqueSms(telephone, message, "SKIPPED", null, typeSms, null);
            }
        } catch (Exception e) {
            log.error("Erreur envoi SMS TunisieSMS: {}", e.getMessage());
            sauvegarderHistoriqueSms(telephone, message, "FAILED", null, typeSms, null);
        }
    }

    public List<HistoriqueSms> obtenirHistoriqueSms(String telephone) {
        return historiqueSmsRepository.findByTelephone(telephone);
    }

    public Double obtenirCoutTotal(LocalDateTime debut, LocalDateTime fin) {
        Double cout = historiqueSmsRepository.getTotalCost(debut, fin);
        return cout != null ? cout : 0.0;
    }

    private void sauvegarderHistoriqueSms(String telephone, String message, String statut, String externalId,
            String typeSms, Double fraisCents) {
        try {
            HistoriqueSms historique = new HistoriqueSms();
            historique.setTelephone(telephone);
            historique.setMessage(message);
            historique.setStatut(statut);
            historique.setTwilioSid(externalId);
            historique.setTypeSms(typeSms != null ? typeSms : "SMS");
            historique.setDateEnvoi(LocalDateTime.now());
            historique.setFraisCents(fraisCents != null ? fraisCents : 0.0);
            historiqueSmsRepository.save(historique);
        } catch (Exception e) {
            log.error("Erreur lors de la sauvegarde de l'historique SMS: {}", e.getMessage());
        }
    }

    private String genererCodeOtp() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    public void nettoyerCodesExpires() {
        LocalDateTime maintenant = LocalDateTime.now();
        otpStorage.entrySet().removeIf(entry -> maintenant.isAfter(entry.getValue().getExpiration()));
        log.info("Nettoyage des codes OTP expirés effectué");
    }

    private static class OtpData {
        private final String code;
        private final LocalDateTime expiration;

        OtpData(String code, LocalDateTime expiration) {
            this.code = code;
            this.expiration = expiration;
        }

        String getCode() {
            return code;
        }

        LocalDateTime getExpiration() {
            return expiration;
        }
    }
}
