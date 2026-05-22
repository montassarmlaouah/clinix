package com.pfe.pfe.billing;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pfe.pfe.model.AbonnementClinique;
import com.pfe.pfe.repository.AbonnementCliniqueRepository;

import lombok.RequiredArgsConstructor;

/**
 * Vérifie qu'un abonnement clinique ou cabinet est actif, payé et non expiré.
 * Cabinet et clinique sont indépendants (pas de lien entre les deux entités).
 */
@Service
@RequiredArgsConstructor
public class SubscriptionAccessService {

    public static final String STATUT_ACTIF = "ACTIF";

    private final AbonnementCliniqueRepository abonnementRepository;

    @Transactional(readOnly = true)
    public boolean hasActivePaidCliniqueSubscription(String cliniqueId) {
        return findActiveCliniqueSubscription(cliniqueId).isPresent();
    }

    @Transactional(readOnly = true)
    public boolean hasActivePaidCabinetSubscription(String medecinId) {
        return findActiveCabinetSubscription(medecinId).isPresent();
    }

    @Transactional(readOnly = true)
    public Optional<AbonnementClinique> findActiveCliniqueSubscription(String cliniqueId) {
        if (!StringUtils.hasText(cliniqueId)) {
            return Optional.empty();
        }
        LocalDate today = LocalDate.now();
        return abonnementRepository.findByCliniqueIdOrderByDateCreationDesc(cliniqueId).stream()
                .filter(a -> a.getMedecinCabinet() == null)
                .filter(this::isActiveAndPaid)
                .filter(a -> a.getDateFin() != null && !a.getDateFin().isBefore(today))
                .findFirst();
    }

    @Transactional(readOnly = true)
    public Optional<AbonnementClinique> findActiveCabinetSubscription(String medecinId) {
        if (!StringUtils.hasText(medecinId)) {
            return Optional.empty();
        }
        LocalDate today = LocalDate.now();
        return abonnementRepository.findByMedecinCabinetIdOrderByDateCreationDesc(medecinId).stream()
                .filter(a -> a.getClinique() == null)
                .filter(this::isActiveAndPaid)
                .filter(a -> a.getDateFin() != null && !a.getDateFin().isBefore(today))
                .findFirst();
    }

    /**
     * Abonnement « courant » le plus récent (tous statuts) — clinique uniquement.
     */
    @Transactional(readOnly = true)
    public Optional<AbonnementClinique> findLatestCliniqueSubscription(String cliniqueId) {
        if (!StringUtils.hasText(cliniqueId)) {
            return Optional.empty();
        }
        return abonnementRepository.findByCliniqueIdOrderByDateCreationDesc(cliniqueId).stream()
                .filter(a -> a.getMedecinCabinet() == null)
                .findFirst();
    }

    /**
     * Abonnement « courant » le plus récent (tous statuts) — cabinet uniquement.
     */
    @Transactional(readOnly = true)
    public Optional<AbonnementClinique> findLatestCabinetSubscription(String medecinId) {
        if (!StringUtils.hasText(medecinId)) {
            return Optional.empty();
        }
        return abonnementRepository.findByMedecinCabinetIdOrderByDateCreationDesc(medecinId).stream()
                .filter(a -> a.getClinique() == null)
                .findFirst();
    }

    public boolean isActiveAndPaid(AbonnementClinique a) {
        if (a == null || !STATUT_ACTIF.equalsIgnoreCase(a.getStatut())) {
            return false;
        }
        BigDecimal montant = a.getMontantPaye();
        boolean paid = montant != null && montant.signum() > 0;
        boolean stripeOk = StringUtils.hasText(a.getStripeSubscriptionId());
        return paid || stripeOk;
    }

    /**
     * Refuse une nouvelle souscription si un abonnement clinique actif et payé existe déjà.
     */
    public void assertCanSubscribeClinique(String cliniqueId) {
        if (hasActivePaidCliniqueSubscription(cliniqueId)) {
            throw new IllegalStateException(
                    "Un abonnement clinique est déjà actif et payé. Aucun nouveau paiement n'est nécessaire avant la fin de la période en cours.");
        }
    }

    /**
     * Refuse une nouvelle souscription si un abonnement cabinet actif et payé existe déjà.
     */
    public void assertCanSubscribeCabinet(String medecinId) {
        if (hasActivePaidCabinetSubscription(medecinId)) {
            throw new IllegalStateException(
                    "Un abonnement cabinet est déjà actif et payé. Aucun nouveau paiement n'est nécessaire avant la fin de la période en cours.");
        }
    }
}
