package com.pfe.pfe.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.billing.StripeCredentialsService;
import com.pfe.pfe.billing.StripeSubscriptionFlowService;
import com.pfe.pfe.model.StripeWebhookEventLog;
import com.pfe.pfe.repository.StripeWebhookEventLogRepository;
import com.stripe.model.Event;
import com.stripe.model.Invoice;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final StripeCredentialsService stripeCredentialsService;
    private final StripeSubscriptionFlowService stripeSubscriptionFlowService;
    private final StripeWebhookEventLogRepository stripeWebhookEventLogRepository;

    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripe(@RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader) {
        String secret = stripeCredentialsService.resolveWebhookSecret();
        if (secret == null || secret.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("Webhook secret non configuré");
        }
        if (sigHeader == null || sigHeader.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Signature Stripe manquante");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, secret);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Signature invalide");
        }

        String type = event.getType();
        if (stripeWebhookEventLogRepository.existsById(event.getId())) {
            return ResponseEntity.ok("duplicate");
        }

        try {
            Object dataObject = event.getDataObjectDeserializer().getObject().orElse(null);
            if (dataObject == null) {
                try {
                    dataObject = event.getDataObjectDeserializer().deserializeUnsafe();
                } catch (Exception ignored) {
                    /* fallback deserializeUnsafe */
                }
            }
            if (dataObject != null) {
                if ("checkout.session.completed".equals(type) && dataObject instanceof Session session) {
                    stripeSubscriptionFlowService.handleCheckoutCompleted(session);
                } else if ("checkout.session.expired".equals(type) && dataObject instanceof Session session) {
                    stripeSubscriptionFlowService.handleCheckoutExpired(session);
                } else if (("customer.subscription.updated".equals(type) || "customer.subscription.deleted".equals(type))
                        && dataObject instanceof Subscription subscription) {
                    stripeSubscriptionFlowService.handleSubscriptionUpdated(subscription);
                } else if ("invoice.paid".equals(type) && dataObject instanceof Invoice invoice) {
                    stripeSubscriptionFlowService.handleInvoicePaid(invoice);
                } else if ("invoice.payment_failed".equals(type) && dataObject instanceof Invoice invoice) {
                    stripeSubscriptionFlowService.handleInvoicePaymentFailed(invoice);
                }
            }
            stripeWebhookEventLogRepository.save(new StripeWebhookEventLog(event.getId(), type, java.time.LocalDateTime.now()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur traitement webhook");
        }

        return ResponseEntity.ok("ok");
    }
}
