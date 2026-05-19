package com.pfe.pfe.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.billing.BillingConstants;
import com.pfe.pfe.billing.BillingManagementService;
import com.pfe.pfe.billing.CliniqueSmsQuotaService;
import com.pfe.pfe.billing.StripeCredentialsService;
import com.pfe.pfe.billing.StripeSubscriptionFlowService;
import com.pfe.pfe.billing.crypto.FieldCipher;
import com.pfe.pfe.model.OffreAbonnement;
import com.pfe.pfe.model.PlatformStripeConfig;
import com.pfe.pfe.security.services.CustomUserDetails;
import com.stripe.model.checkout.Session;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingManagementService billingManagementService;
    private final CliniqueSmsQuotaService cliniqueSmsQuotaService;
    private final StripeSubscriptionFlowService stripeSubscriptionFlowService;
    private final StripeCredentialsService stripeCredentialsService;
    private final FieldCipher fieldCipher;

    @Value("${STRIPE_SECRET_KEY:}")
    private String envSecretKey;

    @Value("${STRIPE_WEBHOOK_SECRET:}")
    private String envWebhookSecret;

    @GetMapping("/offres")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public List<Map<String, Object>> listAll() {
        return billingManagementService.listAllOffers().stream().map(this::toOffreMap).collect(Collectors.toList());
    }

    @GetMapping("/offres/actives")
    @PreAuthorize("hasAnyRole('ADMIN_CLINIQUE','SECRETAIRE','SUPER_ADMIN')")
    public List<Map<String, Object>> listActives() {
        return billingManagementService.listActiveClinicOffers().stream().map(this::toOffreMap).collect(Collectors.toList());
    }

    /** Forfaits actifs pour cabinet médical (médecin sans clinique). */
    @GetMapping("/offres/actives-cabinet")
    @PreAuthorize("hasAnyRole('MEDECIN','SUPER_ADMIN')")
    public List<Map<String, Object>> listActivesCabinet() {
        return billingManagementService.listActiveCabinetOffers().stream().map(this::toOffreMap).collect(Collectors.toList());
    }

    @PostMapping("/offres")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> createOffer(@RequestBody OffreAbonnement body) {
        try {
            OffreAbonnement saved = billingManagementService.createOffer(body);
            return ResponseEntity.ok(toOffreMap(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/offres/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> patchOffer(@PathVariable String id, @RequestBody OffreAbonnement body) {
        try {
            OffreAbonnement saved = billingManagementService.updateOffer(id, body);
            return ResponseEntity.ok(toOffreMap(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/offres/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> deleteOffer(@PathVariable String id) {
        billingManagementService.deleteOffer(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/offres/{id}/sync-stripe")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> syncStripe(@PathVariable String id) {
        try {
            OffreAbonnement o = billingManagementService.syncStripePrices(id);
            return ResponseEntity.ok(toOffreMap(o));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** Admin clinique : démarre Stripe Checkout (URL de redirection hébergée par Stripe). */
    @PostMapping("/checkout")
    @PreAuthorize("hasAnyRole('ADMIN_CLINIQUE','SECRETAIRE','MEDECIN')")
    public ResponseEntity<?> checkout(@AuthenticationPrincipal CustomUserDetails user, @RequestBody Map<String, String> req) {
        try {
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Utilisateur non authentifié."));
            }
            String offreId = req.get("offreId");
            String interval = req.getOrDefault("interval", BillingConstants.INTERVAL_MONTHLY);
            String successUrl = req.get("successUrl");
            String cancelUrl = req.get("cancelUrl");
            Session session;
            if (resolveBillingScope(user, req.get("scope")) == BillingScope.CABINET) {
                session = stripeSubscriptionFlowService.createCheckoutSessionForMedecinCabinet(
                        user.getId(), offreId, interval, successUrl, cancelUrl);
            } else {
                String cliniqueId = user.getCliniqueId();
                if (!StringUtils.hasText(cliniqueId)) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Aucune clinique liée au compte."));
                }
                session = stripeSubscriptionFlowService.createCheckoutSession(cliniqueId, offreId, interval, successUrl,
                        cancelUrl);
            }
            Map<String, Object> payload = new HashMap<>();
            payload.put("checkoutUrl", session.getUrl());
            payload.put("sessionId", session.getId());
            return ResponseEntity.ok(payload);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/souscription-simulee")
    @PreAuthorize("hasAnyRole('ADMIN_CLINIQUE','SECRETAIRE','MEDECIN')")
    public ResponseEntity<?> simule(@AuthenticationPrincipal CustomUserDetails user, @RequestBody Map<String, String> req) {
        try {
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Utilisateur non authentifié."));
            }
            String offreId = req.get("offreId");
            String interval = req.getOrDefault("interval", BillingConstants.INTERVAL_MONTHLY);
            if (resolveBillingScope(user, req.get("scope")) == BillingScope.CABINET) {
                billingManagementService.simulateSubscribeCabinet(user.getId(), offreId, interval);
            } else {
                String cliniqueId = user.getCliniqueId();
                if (!StringUtils.hasText(cliniqueId)) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Aucune clinique liée."));
                }
                billingManagementService.simulateSubscribe(cliniqueId, offreId, interval);
            }
            return ResponseEntity.ok(Map.of("message", "Abonnement enregistré (simulation sans paiement)."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** Quota SMS — clinique du compte connecté (admin clinique). */
    @GetMapping("/sms-quota")
    @PreAuthorize("hasRole('ADMIN_CLINIQUE')")
    public ResponseEntity<?> smsQuotaCourant(@AuthenticationPrincipal CustomUserDetails user) {
        if (user == null || !StringUtils.hasText(user.getCliniqueId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Aucune clinique liée au compte."));
        }
        return ResponseEntity.ok(toSmsQuotaMap(cliniqueSmsQuotaService.verifierQuota(user.getCliniqueId())));
    }

    /** Quota SMS de l'offre active (clinique par id — super admin). */
    @GetMapping("/clinique/{cliniqueId}/sms-quota")
    @PreAuthorize("hasAnyRole('ADMIN_CLINIQUE','SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> smsQuota(@PathVariable String cliniqueId) {
        return ResponseEntity.ok(toSmsQuotaMap(cliniqueSmsQuotaService.verifierQuota(cliniqueId)));
    }

    /**
     * Abonnement courant : admin clinique / secrétaire (clinique) ou médecin cabinet (sans clinique).
     */
    @GetMapping("/abonnement-courant")
    @PreAuthorize("hasAnyRole('ADMIN_CLINIQUE','SECRETAIRE','MEDECIN')")
    public ResponseEntity<?> currentSubscription(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(name = "scope", required = false) String scope) {
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Utilisateur non authentifié."));
        }
        if (resolveBillingScope(user, scope) == BillingScope.CABINET) {
            return billingManagementService.getCurrentSubscriptionForMedecinCabinet(user.getId())
                    .<ResponseEntity<?>>map(a -> ResponseEntity.ok(toAbonnementMap(a)))
                    .orElseGet(() -> ResponseEntity.noContent().build());
        }
        if (!StringUtils.hasText(user.getCliniqueId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Aucune clinique liée au compte."));
        }

        return billingManagementService.getCurrentSubscription(user.getCliniqueId())
                .<ResponseEntity<?>>map(a -> ResponseEntity.ok(toAbonnementMap(a)))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /**
     * Super admin : abonnements au statut Actif (toutes cliniques).
     */
    @GetMapping("/abonnements/actifs")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public List<Map<String, Object>> listActiveSubscriptionsSuperAdmin() {
        return billingManagementService.listActiveSubscriptionsForSuperAdmin().stream()
                .map(this::toAbonnementMap)
                .collect(Collectors.toList());
    }

    /**
     * Super admin : liste des abonnements avec montant payé strictement positif (toutes cliniques).
     */
    @GetMapping("/abonnements/payes")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public List<Map<String, Object>> listPaidSubscriptionsSuperAdmin() {
        return billingManagementService.listPaidSubscriptionsForSuperAdmin().stream()
                .map(this::toAbonnementMap)
                .collect(Collectors.toList());
    }

    /**
     * Historique des souscriptions : clinique ou cabinet médical selon le compte.
     */
    @GetMapping("/abonnements/historique")
    @PreAuthorize("hasAnyRole('ADMIN_CLINIQUE','SECRETAIRE','MEDECIN')")
    public ResponseEntity<?> subscriptionHistory(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(name = "scope", required = false) String scope) {
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Utilisateur non authentifié."));
        }

        List<com.pfe.pfe.model.AbonnementClinique> rows;
        if (resolveBillingScope(user, scope) == BillingScope.CABINET) {
            rows = billingManagementService.getSubscriptionHistoryForMedecinCabinet(user.getId());
        } else if (StringUtils.hasText(user.getCliniqueId())) {
            rows = billingManagementService.getSubscriptionHistory(user.getCliniqueId());
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Aucune clinique liée au compte."));
        }

        List<Map<String, Object>> payload = rows.stream().map(this::toAbonnementMap).collect(Collectors.toList());
        return ResponseEntity.ok(payload);
    }

    @GetMapping("/stripe-config")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Map<String, Object> stripeConfigAdmin() {
        PlatformStripeConfig row = billingManagementService.getStripeConfigForAdmin();

        Map<String, Object> map = new HashMap<>();
        map.put("mode", row.getModeFacturation());

        boolean secretFromEnv = StringUtils.hasText(envSecretKey);
        boolean whFromEnv = StringUtils.hasText(envWebhookSecret);
        boolean enc = fieldCipher.isEnabled();

        String pub = stripeCredentialsService.resolvePublishableKey();
        map.put("publishableKeyMasked", maskPublishable(pub));
        map.put("publishableConfigured", StringUtils.hasText(pub));
        map.put("stripeSecretConfigured", stripeCredentialsService.hasSecretKey());

        map.put("secretResolvedFromEnvironment", secretFromEnv);
        map.put("webhookConfigured", StringUtils.hasText(stripeCredentialsService.resolveWebhookSecret()));
        map.put("webhookFromEnvironment", whFromEnv);
        map.put("fieldCipherEnabled", enc);

        map.put(
                "remarqueStripeTest",
                "Cartes recommandées (mode test Stripe) : 4242424242424242 (succès Visa), 4000056655665556 (Mastercard)."
                        + " Voir documentation officielle : https://stripe.com/docs/testing");
        map.put(
                "securiteCle",
                "Ne jamais committer sk_live_/sk_test_ dans Git. En production : STRIPE_FIELD_ENCRYPTION_SECRET unique + clés côté hébergeur. "
                        + "En local, une phrase par défaut permet le stockage chiffré super admin si vous ne passez pas par les variables d'environnement.");

        return map;
    }

    /** Mise à jour mode Test/Live + clés Stripe (persistées si chiffrement configuré ; sinon utilisez uniquement les variables d'environnement). */
    @PostMapping("/stripe-config")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateStripeConfig(@RequestBody Map<String, String> body) {
        try {
            String mode = body.get("modeFacturation");
            String publishableKey = body.get("publishableKey");
            String secretKey = body.get("secretKey");
            String webhookSecret = body.get("webhookSecret");
            PlatformStripeConfig saved = billingManagementService.updateStripeConfig(mode, publishableKey, secretKey,
                    webhookSecret);
            Map<String, Object> resp = new HashMap<>();
            resp.put("mode", saved.getModeFacturation());
            resp.put("publishableKeyMasked", maskPublishable(saved.getPublishableKey()));
            resp.put("secretStoredEncrypted", StringUtils.hasText(saved.getSecretKeyEnc()));
            resp.put("webhookStoredEncrypted", StringUtils.hasText(saved.getWebhookSecretEnc()));
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private Map<String, Object> toOffreMap(OffreAbonnement o) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", o.getId());
        m.put("nom", o.getNom());
        m.put("description", o.getDescription());
        m.put("prixMensuel", o.getPrixMensuel());
        m.put("prixAnnuel", o.getPrixAnnuel());
        m.put("smsGratuitsInclus", o.getSmsGratuitsInclus());
        m.put("nombreChambresMax", o.getNombreChambresMax());
        m.put("nombrePersonnelMax", o.getNombrePersonnelMax());
        m.put("nombrePatientsMax", o.getNombrePatientsMax());
        m.put("nombreRendezVousMax", o.getNombreRendezVousMax());
        m.put("dureeMois", o.getDureeMois());
        m.put("popular", o.getPopular());
        m.put("ordreAffichage", o.getOrdreAffichage());
        m.put("actif", o.getActif());
        m.put("categorie", o.getCategorie());
        m.put("periodeEssaiJours", o.getPeriodeEssaiJours());
        m.put("stripeProductId", o.getStripeProductId());
        m.put("stripePriceMensuelId", o.getStripePriceMensuelId());
        m.put("stripePriceAnnuelId", o.getStripePriceAnnuelId());
        boolean synced = StringUtils.hasText(o.getStripePriceMensuelId()) && StringUtils.hasText(o.getStripePriceAnnuelId());
        m.put("stripeSynchronise", synced);
        long monthly = yearlySaving(o.getPrixMensuel(), o.getPrixAnnuel());
        m.put("economieAnnuelleEstimee", monthly);
        return m;
    }

    private Map<String, Object> toAbonnementMap(com.pfe.pfe.model.AbonnementClinique a) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", a.getId());
        m.put("statut", a.getStatut());
        m.put("dateDebut", a.getDateDebut());
        m.put("dateFin", a.getDateFin());
        m.put("dateCreation", a.getDateCreation());
        m.put("montantPaye", a.getMontantPaye());
        m.put("periodeFacturation", a.getPeriodeFacturation());
        m.put("stripeCustomerId", a.getStripeCustomerId());
        m.put("stripeSubscriptionId", a.getStripeSubscriptionId());
        m.put("stripeSessionId", a.getStripeSessionId());
        if (a.getOffre() != null) {
            m.put("offreId", a.getOffre().getId());
            m.put("offreNom", a.getOffre().getNom());
            m.put("offreCategorie", a.getOffre().getCategorie());
        }
        if (a.getClinique() != null) {
            m.put("cliniqueId", a.getClinique().getId());
            m.put("cliniqueNom", a.getClinique().getNom());
        }
        if (a.getMedecinCabinet() != null) {
            m.put("medecinCabinetId", a.getMedecinCabinet().getId());
            String prenom = a.getMedecinCabinet().getPrenom() != null ? a.getMedecinCabinet().getPrenom() : "";
            String nom = a.getMedecinCabinet().getNom() != null ? a.getMedecinCabinet().getNom() : "";
            m.put("medecinCabinetNom", (prenom + " " + nom).trim());
        }
        return m;
    }

    private enum BillingScope {
        CLINIQUE, CABINET
    }

    /**
     * Médecin : cabinet si pas de clinique ou scope=cabinet ; clinique si scope=clinique ou clinique rattachée.
     * Admin / secrétaire : toujours clinique.
     */
    private BillingScope resolveBillingScope(CustomUserDetails user, String scopeParam) {
        if (!isMedecinRole(user)) {
            return BillingScope.CLINIQUE;
        }
        if (StringUtils.hasText(scopeParam)) {
            if ("cabinet".equalsIgnoreCase(scopeParam.trim())) {
                return BillingScope.CABINET;
            }
            if ("clinique".equalsIgnoreCase(scopeParam.trim())) {
                return BillingScope.CLINIQUE;
            }
        }
        if (!StringUtils.hasText(user.getCliniqueId())) {
            return BillingScope.CABINET;
        }
        return BillingScope.CLINIQUE;
    }

    private boolean isMedecinRole(CustomUserDetails user) {
        if (user == null) {
            return false;
        }
        String role = user.getRole();
        if (!StringUtils.hasText(role)) {
            return false;
        }
        String r = role.toUpperCase().replace("-", "_");
        if (r.startsWith("ROLE_")) {
            r = r.substring(5);
        }
        return "MEDECIN".equals(r);
    }

    /**
     * Estimation simple : 12 × mensuel − annuel affichée (pour l’UI “Économisez X DT”).
     */
    private long yearlySaving(java.math.BigDecimal monthly, java.math.BigDecimal yearly) {
        if (monthly == null || yearly == null) {
            return 0L;
        }
        java.math.BigDecimal twelveM = monthly.multiply(java.math.BigDecimal.valueOf(12));
        java.math.BigDecimal savings = twelveM.subtract(yearly).setScale(0, java.math.RoundingMode.HALF_UP);
        return Math.max(savings.longValue(), 0L);
    }

    private String maskPublishable(String pk) {
        if (!StringUtils.hasText(pk) || pk.length() < 12) {
            return pk != null ? "…" : "";
        }
        return pk.substring(0, 10) + "…" + pk.substring(pk.length() - 6);
    }

    private Map<String, Object> toSmsQuotaMap(com.pfe.pfe.billing.CliniqueSmsQuotaService.SmsQuotaStatus q) {
        Map<String, Object> m = new HashMap<>();
        m.put("autorise", q.autorise());
        m.put("message", q.message());
        m.put("limite", q.limite());
        m.put("utilises", q.utilises());
        m.put("restants", q.restants());
        m.put("offreNom", q.offreNom());
        m.put("periodeDebut", q.periodeDebut());
        m.put("periodeFin", q.periodeFin());
        return m;
    }
}
