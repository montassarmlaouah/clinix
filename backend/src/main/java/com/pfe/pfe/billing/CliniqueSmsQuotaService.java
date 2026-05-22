package com.pfe.pfe.billing;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pfe.pfe.model.AbonnementClinique;
import com.pfe.pfe.model.HistoriqueSms;
import com.pfe.pfe.model.OffreAbonnement;
import com.pfe.pfe.repository.HistoriqueSmsRepository;

import lombok.RequiredArgsConstructor;

/**
 * Quota SMS inclus dans l'offre d'abonnement active d'une clinique.
 * Si le quota est atteint, aucun SMS ne doit être envoyé via la clé plateforme.
 */
@Service
@RequiredArgsConstructor
public class CliniqueSmsQuotaService {

    private final HistoriqueSmsRepository historiqueSmsRepository;
    private final SubscriptionAccessService subscriptionAccessService;

    public record SmsQuotaStatus(
            boolean autorise,
            String message,
            int limite,
            long utilises,
            long restants,
            String offreNom,
            LocalDate periodeDebut,
            LocalDate periodeFin) {
    }

    /**
     * Vérifie si un SMS peut encore être envoyé pour cette clinique (abonnement + offre).
     */
    @Transactional(readOnly = true)
    public SmsQuotaStatus verifierQuota(String cliniqueId) {
        if (!StringUtils.hasText(cliniqueId)) {
            return new SmsQuotaStatus(true, "Pas de quota (envoi global).", -1, 0, -1, null, null, null);
        }

        Optional<AbonnementClinique> aboOpt = subscriptionAccessService.findActiveCliniqueSubscription(cliniqueId);
        if (aboOpt.isEmpty()) {
            return new SmsQuotaStatus(
                    false,
                    "Aucun abonnement actif pour cette clinique. SMS non envoyé.",
                    0, 0, 0, null, null, null);
        }

        AbonnementClinique abo = aboOpt.get();
        OffreAbonnement offre = abo.getOffre();
        int limite = offre.getSmsGratuitsInclus() != null ? offre.getSmsGratuitsInclus() : 0;

        if (limite <= 0) {
            return new SmsQuotaStatus(
                    false,
                    "L'offre « " + offre.getNom() + " » n'inclut aucun SMS gratuit. SMS non envoyé.",
                    0, 0, 0, offre.getNom(), abo.getDateDebut(), abo.getDateFin());
        }

        LocalDateTime debut = abo.getDateDebut().atStartOfDay();
        LocalDateTime fin = abo.getDateFin().atTime(LocalTime.MAX);
        long utilises = historiqueSmsRepository.countSentForCliniqueInPeriod(cliniqueId, debut, fin);

        if (utilises >= limite) {
            return new SmsQuotaStatus(
                    false,
                    "Quota SMS atteint pour l'offre « " + offre.getNom() + " » ("
                            + limite + " inclus, " + utilises + " déjà envoyés). Aucun SMS supplémentaire.",
                    limite, utilises, 0, offre.getNom(), abo.getDateDebut(), abo.getDateFin());
        }

        long restants = limite - utilises;
        return new SmsQuotaStatus(
                true,
                restants + " SMS restant(s) sur " + limite + " (offre « " + offre.getNom() + " »).",
                limite, utilises, restants, offre.getNom(), abo.getDateDebut(), abo.getDateFin());
    }

    @Transactional
    public void enregistrerEnvoi(String cliniqueId, String telephone, String message, String statut, String typeSms) {
        HistoriqueSms h = new HistoriqueSms();
        h.setCliniqueId(cliniqueId);
        h.setTelephone(telephone);
        h.setMessage(message);
        h.setStatut(statut);
        h.setTypeSms(typeSms != null ? typeSms : "NOTIFICATION");
        h.setDateEnvoi(LocalDateTime.now());
        historiqueSmsRepository.save(h);
    }

}
