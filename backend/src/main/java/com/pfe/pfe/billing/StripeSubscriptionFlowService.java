package com.pfe.pfe.billing;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pfe.pfe.billing.config.BillingAppProperties;
import com.pfe.pfe.model.AbonnementClinique;
import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.model.Medecin;
import com.pfe.pfe.model.OffreAbonnement;
import com.pfe.pfe.repository.AbonnementCliniqueRepository;
import com.pfe.pfe.repository.CliniqueRepository;
import com.pfe.pfe.repository.MedecinRepository;
import com.pfe.pfe.repository.OffreAbonnementRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.Invoice;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.param.checkout.SessionRetrieveParams;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StripeSubscriptionFlowService {

    private final CliniqueRepository cliniqueRepository;
    private final MedecinRepository medecinRepository;
    private final OffreAbonnementRepository offreRepository;
    private final AbonnementCliniqueRepository abonnementRepository;
    private final StripeCredentialsService stripeCredentialsService;
    private final StripeOfferSyncService stripeOfferSyncService;
    private final BillingAppProperties billingAppProperties;
    private final SubscriptionAccessService subscriptionAccessService;

    @Transactional
    public Session createCheckoutSession(String cliniqueId, String offreId, String interval, String successUrl,
            String cancelUrl) {
        subscriptionAccessService.assertCanSubscribeClinique(cliniqueId);
        Stripe.apiKey = stripeCredentialsService.resolveSecretKey();

        Clinique clinique = cliniqueRepository.findById(cliniqueId)
                .orElseThrow(() -> new IllegalArgumentException("Clinique introuvable"));
        OffreAbonnement offre = offreRepository.findById(offreId)
                .orElseThrow(() -> new IllegalArgumentException("Offre introuvable"));
        if (!Boolean.TRUE.equals(offre.getActif())) {
            throw new IllegalStateException("Offre inactive");
        }
        if (!BillingConstants.CAT_CLINIQUE.equals(offre.getCategorie())) {
            throw new IllegalStateException("Cette offre n'est pas destinée aux cliniques");
        }

        annulerAbonnementsEnAttenteClinique(cliniqueId);
        offre = ensureStripePrices(offre);
        String priceId = resolvePriceId(offre, interval);
        String customerId = resolveOrCreateCliniqueCustomer(clinique);
        AbonnementClinique pending = buildPendingSubscription(offre, interval, customerId);
        pending.setClinique(clinique);
        pending = abonnementRepository.save(pending);

        return createStripeSession(pending, customerId, priceId, offre, interval, successUrl, cancelUrl, Map.of(
                "cliniqueId", cliniqueId,
                "offreId", offreId,
                "interval", interval != null ? interval : BillingConstants.INTERVAL_MONTHLY));
    }

    @Transactional
    public Session createCheckoutSessionForMedecinCabinet(String medecinId, String offreId, String interval,
            String successUrl, String cancelUrl) {
        subscriptionAccessService.assertCanSubscribeCabinet(medecinId);
        Stripe.apiKey = stripeCredentialsService.resolveSecretKey();

        Medecin medecin = medecinRepository.findById(medecinId)
                .orElseThrow(() -> new IllegalArgumentException("Médecin introuvable"));
        OffreAbonnement offre = offreRepository.findById(offreId)
                .orElseThrow(() -> new IllegalArgumentException("Offre introuvable"));
        if (!Boolean.TRUE.equals(offre.getActif())) {
            throw new IllegalStateException("Offre inactive");
        }
        if (!BillingConstants.CAT_CABINET_MEDICAL.equals(offre.getCategorie())) {
            throw new IllegalStateException("Cette offre n'est pas destinée aux cabinets médicaux");
        }

        annulerAbonnementsEnAttenteCabinet(medecinId);
        offre = ensureStripePrices(offre);
        String priceId = resolvePriceId(offre, interval);
        String customerId = resolveOrCreateMedecinCustomer(medecin);
        AbonnementClinique pending = buildPendingSubscription(offre, interval, customerId);
        pending.setMedecinCabinet(medecin);
        pending = abonnementRepository.save(pending);

        return createStripeSession(pending, customerId, priceId, offre, interval, successUrl, cancelUrl, Map.of(
                "medecinCabinetId", medecinId,
                "offreId", offreId,
                "interval", interval != null ? interval : BillingConstants.INTERVAL_MONTHLY));
    }

    private OffreAbonnement ensureStripePrices(OffreAbonnement offre) {
        if (!StringUtils.hasText(offre.getStripePriceMensuelId()) || !StringUtils.hasText(offre.getStripePriceAnnuelId())) {
            return stripeOfferSyncService.syncProductAndPrices(offre.getId());
        }
        return offre;
    }

    private String resolvePriceId(OffreAbonnement offre, String interval) {
        String priceId = BillingConstants.INTERVAL_YEARLY.equalsIgnoreCase(interval)
                ? offre.getStripePriceAnnuelId()
                : offre.getStripePriceMensuelId();
        if (!StringUtils.hasText(priceId)) {
            throw new IllegalStateException("Prix Stripe manquant : synchronisez l'offre depuis le super admin.");
        }
        return priceId;
    }

    private String resolveOrCreateCliniqueCustomer(Clinique clinique) {
        String customerId = clinique.getStripeCustomerId();
        if (StringUtils.hasText(customerId)) {
            return customerId;
        }
        try {
            CustomerCreateParams cps = CustomerCreateParams.builder()
                    .putMetadata("cliniqueId", clinique.getId())
                    .setName(clinique.getNom())
                    .build();
            Customer customer = Customer.create(cps);
            clinique.setStripeCustomerId(customer.getId());
            cliniqueRepository.save(clinique);
            return customer.getId();
        } catch (StripeException e) {
            throw new IllegalStateException("Impossible de créer le client Stripe : " + e.getMessage(), e);
        }
    }

    private String resolveOrCreateMedecinCustomer(Medecin medecin) {
        String customerId = medecin.getStripeCustomerId();
        if (StringUtils.hasText(customerId)) {
            return customerId;
        }
        try {
            String label = (StringUtils.hasText(medecin.getPrenom()) ? medecin.getPrenom() + " " : "")
                    + (medecin.getNom() != null ? medecin.getNom() : "Cabinet médical");
            CustomerCreateParams cps = CustomerCreateParams.builder()
                    .putMetadata("medecinCabinetId", medecin.getId())
                    .setName(label.trim())
                    .build();
            Customer customer = Customer.create(cps);
            medecin.setStripeCustomerId(customer.getId());
            medecinRepository.save(medecin);
            return customer.getId();
        } catch (StripeException e) {
            throw new IllegalStateException("Impossible de créer le client Stripe : " + e.getMessage(), e);
        }
    }

    private AbonnementClinique buildPendingSubscription(OffreAbonnement offre, String interval, String customerId) {
        Integer dureeMois = offre.getDureeMois();
        AbonnementClinique pending = new AbonnementClinique();
        pending.setOffre(offre);
        long mois = dureeMois != null ? dureeMois.longValue() : 1L;
        pending.setDateDebut(LocalDate.now());
        pending.setDateFin(LocalDate.now().plusMonths(mois));
        pending.setDatePremierPaiement(null);
        pending.setMontantPaye(BigDecimal.ZERO);
        pending.setStatut("EN_ATTENTE_PAIEMENT");
        pending.setStripeCustomerId(customerId);
        pending.setPeriodeFacturation(BillingConstants.INTERVAL_YEARLY.equalsIgnoreCase(interval)
                ? BillingConstants.INTERVAL_YEARLY
                : BillingConstants.INTERVAL_MONTHLY);
        return pending;
    }

    private Session createStripeSession(AbonnementClinique pending, String customerId, String priceId,
            OffreAbonnement offre, String interval, String successUrl, String cancelUrl,
            java.util.Map<String, String> extraMetadata) {
        int trialDays = offre.getPeriodeEssaiJours() != null && offre.getPeriodeEssaiJours() > 0
                ? offre.getPeriodeEssaiJours()
                : 0;

        SessionCreateParams.Builder b = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setCustomer(customerId)
                .setSuccessUrl(StringUtils.hasText(successUrl) ? successUrl : billingAppProperties.getSuccessUrl())
                .setCancelUrl(StringUtils.hasText(cancelUrl) ? cancelUrl : billingAppProperties.getCancelUrl())
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setPrice(priceId)
                        .setQuantity(1L)
                        .build())
                .putMetadata("abonnementId", pending.getId());

        extraMetadata.forEach(b::putMetadata);

        if (trialDays > 0) {
            b.setSubscriptionData(SessionCreateParams.SubscriptionData.builder()
                    .setTrialPeriodDays((long) trialDays)
                    .build());
        }

        try {
            Session session = Session.create(b.build());
            pending.setStripeSessionId(session.getId());
            abonnementRepository.save(pending);
            return session;
        } catch (StripeException e) {
            pending.setStatut("ANNULE");
            abonnementRepository.save(pending);
            throw new IllegalStateException("Stripe Checkout indisponible : " + e.getMessage(), e);
        }
    }

    /**
     * Confirmation explicite après retour Stripe (ne dépend pas du webhook local).
     *
     * @param utilisateurId       id du compte connecté (médecin, admin clinique, etc.)
     * @param cliniqueUtilisateurId clinique du JWT (admin / secrétaire / médecin rattaché)
     */
    @Transactional
    public AbonnementClinique confirmCheckoutSession(String sessionId, String utilisateurId, String cliniqueUtilisateurId) {
        if (!StringUtils.hasText(sessionId)) {
            throw new IllegalArgumentException("sessionId Stripe requis");
        }
        Stripe.apiKey = stripeCredentialsService.resolveSecretKey();
        Session session;
        try {
            SessionRetrieveParams params = SessionRetrieveParams.builder()
                    .addExpand("subscription")
                    .addExpand("subscription.latest_invoice")
                    .build();
            session = Session.retrieve(sessionId, params, null);
        } catch (StripeException e) {
            throw new IllegalStateException("Session Stripe introuvable : " + e.getMessage(), e);
        }
        verifierProprietaireSession(session, utilisateurId, cliniqueUtilisateurId);
        if (!paiementStripeFinalise(session)) {
            throw new IllegalStateException(
                    "Paiement Stripe non finalisé. Statut session : " + session.getStatus()
                            + ", paiement : " + session.getPaymentStatus());
        }
        handleCheckoutCompleted(session);
        String abonnementId = session.getMetadata() != null ? session.getMetadata().get("abonnementId") : null;
        return abonnementRepository.findByIdWithDetails(abonnementId)
                .orElseThrow(() -> new IllegalStateException("Abonnement introuvable après confirmation"));
    }

    private boolean paiementStripeFinalise(Session session) {
        if (session == null) {
            return false;
        }
        String paymentStatus = session.getPaymentStatus();
        if (StringUtils.hasText(paymentStatus)) {
            String ps = paymentStatus.trim();
            if ("paid".equalsIgnoreCase(ps) || "no_payment_required".equalsIgnoreCase(ps)) {
                return true;
            }
        }
        return "complete".equalsIgnoreCase(session.getStatus());
    }

    private void verifierProprietaireSession(Session session, String utilisateurId, String cliniqueUtilisateurId) {
        String abonnementId = session.getMetadata() != null ? session.getMetadata().get("abonnementId") : null;
        if (!StringUtils.hasText(abonnementId)) {
            throw new IllegalStateException("Session Stripe sans abonnement associé");
        }
        AbonnementClinique a = abonnementRepository.findByIdWithDetails(abonnementId)
                .orElseThrow(() -> new IllegalArgumentException("Abonnement introuvable"));

        if (a.getMedecinCabinet() != null) {
            String ownerMedecinId = a.getMedecinCabinet().getId();
            if (!StringUtils.hasText(utilisateurId) || !utilisateurId.equals(ownerMedecinId)) {
                throw new IllegalStateException("Cette session Stripe concerne un abonnement cabinet médical. "
                        + "Connectez-vous avec le compte médecin ayant effectué le paiement.");
            }
            return;
        }

        if (a.getClinique() != null) {
            String ownerCliniqueId = a.getClinique().getId();
            if (!StringUtils.hasText(cliniqueUtilisateurId) || !cliniqueUtilisateurId.equals(ownerCliniqueId)) {
                throw new IllegalStateException("Cette session Stripe n'appartient pas à votre clinique");
            }
        }
    }

    @Transactional
    public void handleCheckoutCompleted(Session session) {
        String abonnementId = session.getMetadata() != null ? session.getMetadata().get("abonnementId") : null;
        if (!StringUtils.hasText(abonnementId)) {
            return;
        }
        AbonnementClinique a = abonnementRepository.findById(abonnementId).orElse(null);
        if (a == null) {
            return;
        }
        if ("ACTIF".equalsIgnoreCase(a.getStatut())
                && a.getMontantPaye() != null
                && a.getMontantPaye().signum() > 0
                && session.getId().equals(a.getStripeSessionId())) {
            return;
        }
        a.setStripeSessionId(session.getId());
        a.setStripeCustomerId(session.getCustomer());
        String subId = session.getSubscription();
        a.setStripeSubscriptionId(subId);
        a.setStatut("ACTIF");

        if (StringUtils.hasText(subId)) {
            Stripe.apiKey = stripeCredentialsService.resolveSecretKey();
            try {
                Subscription sub = Subscription.retrieve(subId);
                appliquerDatesPremierPaiement(a, sub);
                if (!sub.getItems().getData().isEmpty()
                        && sub.getItems().getData().get(0).getPrice() != null
                        && sub.getItems().getData().get(0).getPrice().getUnitAmount() != null) {
                    BigDecimal amt = BigDecimal.valueOf(sub.getItems().getData().get(0).getPrice().getUnitAmount());
                    int frac = CurrencyFractionDigits.forStripe(sub.getItems().getData().get(0).getPrice().getCurrency());
                    if (frac > 0) {
                        amt = amt.divide(BigDecimal.TEN.pow(frac), 2, java.math.RoundingMode.HALF_UP);
                    }
                    a.setMontantPaye(amt);
                }
            } catch (StripeException ignored) {
                // La souscription existe déjà ; fin de période peut être mise à jour par webhook ultérieur
            }
        } else {
            appliquerDatesPremierPaiement(a, null);
        }
        if (a.getMontantPaye() == null || a.getMontantPaye().signum() <= 0) {
            appliquerMontantDepuisOffre(a);
        }
        activerAccesCabinetSiMedecin(a);
        abonnementRepository.save(a);
    }

    private void appliquerMontantDepuisOffre(AbonnementClinique a) {
        if (a.getOffre() == null) {
            return;
        }
        BigDecimal montant = BillingConstants.INTERVAL_YEARLY.equalsIgnoreCase(a.getPeriodeFacturation())
                && a.getOffre().getPrixAnnuel() != null
                && a.getOffre().getPrixAnnuel().signum() > 0
                ? a.getOffre().getPrixAnnuel()
                : a.getOffre().getPrixMensuel();
        if (montant != null && montant.signum() > 0) {
            a.setMontantPaye(montant);
        }
    }

    private void annulerAbonnementsEnAttenteCabinet(String medecinId) {
        abonnementRepository.findByMedecinCabinetIdOrderByDateCreationDesc(medecinId).stream()
                .filter(a -> "EN_ATTENTE_PAIEMENT".equalsIgnoreCase(a.getStatut()))
                .forEach(a -> {
                    a.setStatut("ANNULE");
                    abonnementRepository.save(a);
                });
    }

    private void annulerAbonnementsEnAttenteClinique(String cliniqueId) {
        abonnementRepository.findByCliniqueIdOrderByDateCreationDesc(cliniqueId).stream()
                .filter(a -> a.getMedecinCabinet() == null)
                .filter(a -> "EN_ATTENTE_PAIEMENT".equalsIgnoreCase(a.getStatut()))
                .forEach(a -> {
                    a.setStatut("ANNULE");
                    abonnementRepository.save(a);
                });
    }

    private void activerAccesCabinetSiMedecin(AbonnementClinique a) {
        if (a.getMedecinCabinet() == null) {
            return;
        }
        Medecin m = a.getMedecinCabinet();
        if (!Boolean.TRUE.equals(m.getAccesCabinet())) {
            m.setAccesCabinet(true);
            medecinRepository.save(m);
        }
    }

    @Transactional
    public void handleInvoicePaid(Invoice invoice) {
        String subId = invoice.getSubscription();
        if (!StringUtils.hasText(subId)) {
            return;
        }

        AbonnementClinique a = abonnementRepository.findByStripeSubscriptionId(subId).orElse(null);
        if (a == null) {
            return;
        }

        a.setStatut("ACTIF");
        if (a.getDatePremierPaiement() == null) {
            LocalDate datePaiement = extraireDatePaiementFacture(invoice);
            a.setDatePremierPaiement(datePaiement);
            a.setDateDebut(datePaiement);
        }
        if (invoice.getAmountPaid() != null) {
            BigDecimal amount = BigDecimal.valueOf(invoice.getAmountPaid());
            int frac = CurrencyFractionDigits.forStripe(invoice.getCurrency());
            if (frac > 0) {
                amount = amount.divide(BigDecimal.TEN.pow(frac), 2, java.math.RoundingMode.HALF_UP);
            }
            a.setMontantPaye(amount);
        }
        Stripe.apiKey = stripeCredentialsService.resolveSecretKey();
        try {
            Subscription sub = Subscription.retrieve(subId);
            if (sub.getCurrentPeriodEnd() != null) {
                a.setDateFin(Instant.ofEpochSecond(sub.getCurrentPeriodEnd())
                        .atZone(ZoneOffset.UTC)
                        .toLocalDate());
            }
        } catch (StripeException ignored) {
            /* période Stripe optionnelle */
        }
        activerAccesCabinetSiMedecin(a);
        abonnementRepository.save(a);
    }

    private void appliquerDatesPremierPaiement(AbonnementClinique a, Subscription sub) {
        if (a.getDatePremierPaiement() != null) {
            if (sub != null && sub.getCurrentPeriodEnd() != null) {
                a.setDateFin(Instant.ofEpochSecond(sub.getCurrentPeriodEnd())
                        .atZone(ZoneOffset.UTC)
                        .toLocalDate());
            }
            return;
        }
        LocalDate datePaiement = LocalDate.now();
        if (sub != null && sub.getCurrentPeriodStart() != null) {
            datePaiement = Instant.ofEpochSecond(sub.getCurrentPeriodStart())
                    .atZone(ZoneOffset.UTC)
                    .toLocalDate();
        }
        a.setDatePremierPaiement(datePaiement);
        a.setDateDebut(datePaiement);
        if (sub != null && sub.getCurrentPeriodEnd() != null) {
            a.setDateFin(Instant.ofEpochSecond(sub.getCurrentPeriodEnd())
                    .atZone(ZoneOffset.UTC)
                    .toLocalDate());
        }
    }

    private LocalDate extraireDatePaiementFacture(Invoice invoice) {
        if (invoice.getStatusTransitions() != null && invoice.getStatusTransitions().getPaidAt() != null) {
            return Instant.ofEpochSecond(invoice.getStatusTransitions().getPaidAt())
                    .atZone(ZoneOffset.UTC)
                    .toLocalDate();
        }
        if (invoice.getCreated() != null) {
            return Instant.ofEpochSecond(invoice.getCreated())
                    .atZone(ZoneOffset.UTC)
                    .toLocalDate();
        }
        return LocalDate.now();
    }

    @Transactional
    public void handleInvoicePaymentFailed(Invoice invoice) {
        String subId = invoice.getSubscription();
        if (!StringUtils.hasText(subId)) {
            return;
        }

        AbonnementClinique a = abonnementRepository.findByStripeSubscriptionId(subId).orElse(null);
        if (a == null) {
            return;
        }

        a.setStatut("IMPAYE");
        abonnementRepository.save(a);
    }

    @Transactional
    public void handleCheckoutExpired(Session session) {
        String abonnementId = session.getMetadata() != null ? session.getMetadata().get("abonnementId") : null;
        if (!StringUtils.hasText(abonnementId)) {
            return;
        }

        AbonnementClinique a = abonnementRepository.findById(abonnementId).orElse(null);
        if (a == null) {
            return;
        }

        a.setStatut("ANNULE");
        abonnementRepository.save(a);
    }

    @Transactional
    public void handleSubscriptionUpdated(Subscription subscription) {
        String subId = subscription.getId();
        AbonnementClinique a = abonnementRepository.findByStripeSubscriptionId(subId).orElse(null);
        if (a == null) {
            return;
        }
        String st = subscription.getStatus();
        if (st != null) {
            switch (st) {
                case "canceled", "unpaid" -> a.setStatut("ANNULE");
                case "past_due" -> a.setStatut("IMPAYE");
                default -> a.setStatut("ACTIF");
            }
        } else {
            a.setStatut("ACTIF");
        }
        if (subscription.getCurrentPeriodEnd() != null) {
            LocalDate fin = Instant.ofEpochSecond(subscription.getCurrentPeriodEnd())
                    .atZone(ZoneOffset.UTC)
                    .toLocalDate();
            a.setDateFin(fin);
        }
        abonnementRepository.save(a);
    }

    /**
     * Devise Stripe → décimales (approximation locale pour affichage/montant).
     */
    private static final class CurrencyFractionDigits {

        static int forStripe(String currency) {
            if (currency == null) {
                return 2;
            }
            try {
                return java.util.Currency.getInstance(currency.toUpperCase()).getDefaultFractionDigits();
            } catch (Exception e) {
                return 2;
            }
        }
    }
}
