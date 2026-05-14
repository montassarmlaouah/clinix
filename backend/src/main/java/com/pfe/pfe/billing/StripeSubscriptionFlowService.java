package com.pfe.pfe.billing;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pfe.pfe.billing.config.BillingAppProperties;
import com.pfe.pfe.model.AbonnementClinique;
import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.model.OffreAbonnement;
import com.pfe.pfe.repository.AbonnementCliniqueRepository;
import com.pfe.pfe.repository.CliniqueRepository;
import com.pfe.pfe.repository.OffreAbonnementRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.Invoice;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.checkout.SessionCreateParams;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StripeSubscriptionFlowService {

    private final CliniqueRepository cliniqueRepository;
    private final OffreAbonnementRepository offreRepository;
    private final AbonnementCliniqueRepository abonnementRepository;
    private final StripeCredentialsService stripeCredentialsService;
    private final StripeOfferSyncService stripeOfferSyncService;
    private final BillingAppProperties billingAppProperties;

    @Transactional
    public Session createCheckoutSession(String cliniqueId, String offreId, String interval, String successUrl,
            String cancelUrl) {
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

        if (!StringUtils.hasText(offre.getStripePriceMensuelId()) || !StringUtils.hasText(offre.getStripePriceAnnuelId())) {
            offre = stripeOfferSyncService.syncProductAndPrices(offre.getId());
        }

        String priceId = BillingConstants.INTERVAL_YEARLY.equalsIgnoreCase(interval)
                ? offre.getStripePriceAnnuelId()
                : offre.getStripePriceMensuelId();
        if (!StringUtils.hasText(priceId)) {
            throw new IllegalStateException("Prix Stripe manquant : exécutez la synchronisation depuis le super admin.");
        }

        String customerId = clinique.getStripeCustomerId();
        if (!StringUtils.hasText(customerId)) {
            try {
                CustomerCreateParams cps = CustomerCreateParams.builder()
                        .putMetadata("cliniqueId", clinique.getId())
                        .setName(clinique.getNom())
                        .build();
                Customer customer = Customer.create(cps);
                customerId = customer.getId();
                clinique.setStripeCustomerId(customerId);
                cliniqueRepository.save(clinique);
            } catch (StripeException e) {
                throw new IllegalStateException("Impossible de creer le client Stripe : " + e.getMessage(), e);
            }
        }

        Integer trialDaysValue = offre.getPeriodeEssaiJours();
        int trialDays = trialDaysValue != null && trialDaysValue > 0
                ? trialDaysValue
                : 0;
        Integer dureeMois = offre.getDureeMois();

        AbonnementClinique pending = new AbonnementClinique();
        pending.setClinique(clinique);
        pending.setOffre(offre);
        pending.setDateDebut(LocalDate.now());
        pending.setDateFin(LocalDate.now().plusMonths(dureeMois != null ? dureeMois : 1L));
        pending.setMontantPaye(BigDecimal.ZERO);
        pending.setStatut("EN_ATTENTE_PAIEMENT");
        pending.setStripeCustomerId(customerId);
        pending.setPeriodeFacturation(BillingConstants.INTERVAL_YEARLY.equalsIgnoreCase(interval)
                ? BillingConstants.INTERVAL_YEARLY
                : BillingConstants.INTERVAL_MONTHLY);
        pending = abonnementRepository.save(pending);

        SessionCreateParams.Builder b = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setCustomer(customerId)
                .setSuccessUrl(StringUtils.hasText(successUrl) ? successUrl : billingAppProperties.getSuccessUrl())
                .setCancelUrl(StringUtils.hasText(cancelUrl) ? cancelUrl : billingAppProperties.getCancelUrl())
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setPrice(priceId)
                        .setQuantity(1L)
                        .build())
                .putMetadata("abonnementId", pending.getId())
                .putMetadata("cliniqueId", cliniqueId)
                .putMetadata("offreId", offreId)
                .putMetadata("interval", interval);

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
        a.setStripeSessionId(session.getId());
        a.setStripeCustomerId(session.getCustomer());
        String subId = session.getSubscription();
        a.setStripeSubscriptionId(subId);
        a.setStatut("ACTIF");

        if (StringUtils.hasText(subId)) {
            Stripe.apiKey = stripeCredentialsService.resolveSecretKey();
            try {
                Subscription sub = Subscription.retrieve(subId);
                if (sub.getCurrentPeriodEnd() != null) {
                    LocalDate fin = Instant.ofEpochSecond(sub.getCurrentPeriodEnd())
                            .atZone(ZoneOffset.UTC)
                            .toLocalDate();
                    a.setDateFin(fin);
                }
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
        }
        abonnementRepository.save(a);
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
        if (invoice.getAmountPaid() != null) {
            BigDecimal amount = BigDecimal.valueOf(invoice.getAmountPaid());
            int frac = CurrencyFractionDigits.forStripe(invoice.getCurrency());
            if (frac > 0) {
                amount = amount.divide(BigDecimal.TEN.pow(frac), 2, java.math.RoundingMode.HALF_UP);
            }
            a.setMontantPaye(amount);
        }
        abonnementRepository.save(a);
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
