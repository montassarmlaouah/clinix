package com.pfe.pfe.service;

import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pfe.pfe.billing.CliniqueSmsQuotaService;
import com.pfe.pfe.dto.SmsSendOutcome;
import com.pfe.pfe.dto.tunisiesms.TunisieSmsApiDtos.DlrItem;
import com.pfe.pfe.dto.tunisiesms.TunisieSmsApiDtos.DlrRequest;
import com.pfe.pfe.dto.tunisiesms.TunisieSmsApiDtos.SendRequest;
import com.pfe.pfe.dto.tunisiesms.TunisieSmsApiDtos.SmsItem;

import lombok.extern.slf4j.Slf4j;

/**
 * Envoi SMS via l'API Rest JSON MyStudents — identique au flux du plugin jQuery
 * ({@code $.tunisiesms} / {@code .sender} / {@code .sms}), implémenté en Java (RestTemplate).
 *
 * <p>POST {@code tunisiesms.api.url} (défaut https://mystudents.tunisiesms.tn/api/sms)
 * <br>Authorization: {@code Bearer} + {@code tunisiesms.api.key} (même valeur que la clé plugin)
 * <br>Body: type = {@code tunisiesms.api.type} (51 = plugin jQuery officiel), sender, sms[] (+ {@code date_envoi} si activé)
 */
@Service
@Slf4j
public class TunisieSmsService {

    private static final ZoneId TUNIS = ZoneId.of("Africa/Tunis");
    /** Même format que {@code mystudents.tunisiesms.js} : année-mois-jour sans zéros superflus. */
    private static final DateTimeFormatter DATE_ENVOI_PLUGIN = DateTimeFormatter.ofPattern("yyyy-M-d");

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final CliniqueSmsQuotaService cliniqueSmsQuotaService;

    /**
     * Annotation {@code @Qualifier} sur le paramètre : avec Lombok {@code @RequiredArgsConstructor},
     * Spring injectait le bean {@code @Primary} et ignorait le bon RestTemplate (PKIX).
     */
    public TunisieSmsService(
            @Qualifier("tunisieSmsRestTemplate") RestTemplate restTemplate,
            ObjectMapper objectMapper,
            CliniqueSmsQuotaService cliniqueSmsQuotaService) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.cliniqueSmsQuotaService = cliniqueSmsQuotaService;
    }

    @Value("${tunisiesms.enabled:false}")
    private boolean enabled;

    @Value("${tunisiesms.auth.header.prefix:Bearer }")
    private String authHeaderPrefix;

    @Value("${tunisiesms.api.url:}")
    private String apiUrl;

    @Value("${tunisiesms.dlr.url:}")
    private String dlrUrl;

    @Value("${tunisiesms.api.key:}")
    private String globalApiKey;

    @Value("${tunisiesms.sender:MonApp}")
    private String globalSender;

    @Value("${tunisiesms.fail-on-error:false}")
    private boolean failOnError;

    @Value("${tunisiesms.rest.include-authorization-header:true}")
    private boolean includeAuthorizationHeader;

    /** Réduit les échecs JSON status 500 sur certains agrégateurs (encodage UCS-2 / UTF-8). */
    @Value("${tunisiesms.message.strip-accents:true}")
    private boolean stripAccentsForSmsBody;

    /** Remplace les sauts de ligne par des espaces (un seul SMS logique côté routeur). */
    @Value("${tunisiesms.message.single-line:false}")
    private boolean smsSingleLine;

    /**
     * Longueur maximale du SMS avant troncature. L'API TunisieSMS renvoie {@code status:500}
     * (au lieu du 440 documenté) pour tout message ≥ 160 caractères, donc on tronque à 159 par défaut.
     */
    @Value("${tunisiesms.message.max-length:159}")
    private int smsMaxLength;

    /** 55 = doc « API Rest JSON » (cle la plus courante côté backend) ; 51 = plugin jQuery (mystudents.tunisiesms.js). */
    @Value("${tunisiesms.api.type:55}")
    private String apiTypeRaw;

    /** Avec type 51, mettre true (comme le JS). Avec type 55, false en général. */
    @Value("${tunisiesms.api.include-date-envoi:false}")
    private boolean includeDateEnvoi;

    /** Si la réponse JSON indique 401, un second envoi avec l'autre type (51↔55) est tenté automatiquement. */
    @Value("${tunisiesms.api.retry-on-401-alternate-type:true}")
    private boolean retry401AlternateType;

    /**
     * Si la réponse JSON indique 500 (erreur interne agrégateur), réessai avec l'autre type (51↔55).
     * Certains comptes ne tolèrent qu'un des deux formats ; le 500 peut apparaître au lieu d'un 401.
     */
    @Value("${tunisiesms.api.retry-on-500-alternate-type:true}")
    private boolean retry500AlternateType;

    private int apiTypeInt = 55;

    @PostConstruct
    void logConfigurationAuDemarrage() {
        globalApiKey = sanitizeApiKeyString(globalApiKey);
        try {
            apiTypeInt = Integer.parseInt(apiTypeRaw.trim());
        } catch (NumberFormatException e) {
            log.warn("[TunisieSMS] tunisiesms.api.type invalide ({}) — utilisation de 55 (API Rest JSON).", apiTypeRaw);
            apiTypeInt = 55;
        }
        log.info("[TunisieSMS] Config — enabled={} apiUrl={} dlrUrl={} sender={} clePresente={} apercu={} apiType={} dateEnvoi={} retry401Alt={} retry500Alt={} stripAccents={} singleLine={}",
                enabled,
                StringUtils.hasText(apiUrl) ? apiUrl : "(vide)",
                StringUtils.hasText(dlrUrl) ? dlrUrl : "(vide)",
                globalSender,
                StringUtils.hasText(globalApiKey),
                maskKey(globalApiKey),
                apiTypeInt,
                includeDateEnvoi,
                retry401AlternateType,
                retry500AlternateType,
                stripAccentsForSmsBody,
                smsSingleLine);
        if (StringUtils.hasText(globalApiKey)) {
            log.info("[TunisieSMS] Cle API chargee — longueur={} caracteres (si 401, comparez au portail ; cle tronquee = mauvais fichier ou variable d'environnement vide).",
                    globalApiKey.length());
        }
        if (!enabled) {
            log.warn("[TunisieSMS] tunisiesms.enabled=false — aucun SMS ne sera envoye.");
        } else if (!StringUtils.hasText(globalApiKey)) {
            log.warn("[TunisieSMS] *** CLE API ABSENTE *** — Configurez tunisiesms.api.key.");
        } else if (!StringUtils.hasText(apiUrl)) {
            log.warn("[TunisieSMS] *** URL API ABSENTE *** — Configurez tunisiesms.api.url.");
        } else {
            log.info("[TunisieSMS] *** PRET A ENVOYER *** vers {}", apiUrl);
        }
    }

    private static String maskKey(String key) {
        if (!StringUtils.hasText(key)) return "(vide)";
        if (key.length() <= 10) return "****";
        return key.substring(0, 4) + "..." + key.substring(key.length() - 4);
    }

    /**
     * Évite clé tronquée ou illisible : trim, BOM UTF-8, guillemets résiduels ; à appliquer à chaque envoi (clé clinique incluse).
     */
    private static String sanitizeApiKeyString(String key) {
        if (key == null) {
            return "";
        }
        String s = key.trim();
        if (s.startsWith("\uFEFF")) {
            s = s.substring(1).trim();
        }
        if (s.length() >= 2 && s.charAt(0) == '"' && s.charAt(s.length() - 1) == '"') {
            s = s.substring(1, s.length() - 1).trim();
        }
        return s;
    }

    // ─── Public API ──────────────────────────────────────────────

    public boolean isGlobalKeyConfigured() {
        return StringUtils.hasText(globalApiKey);
    }

    public boolean isReadyForGlobalSend() {
        return enabled && StringUtils.hasText(globalApiKey) && StringUtils.hasText(apiUrl);
    }

    public String normalizeGsm(String raw) {
        if (raw == null) return null;
        String s = raw.replaceAll("\\s+", "").replace("+", "");
        if (s.startsWith("00")) s = s.substring(2);
        if (s.length() == 8 && s.matches("\\d{8}")) return "216" + s;
        if (s.length() == 9 && s.startsWith("0") && s.substring(1).matches("\\d{8}")) return "216" + s.substring(1);
        return s;
    }

    public String normalizeOtpStorageKey(String raw) {
        String g = normalizeGsm(raw);
        return StringUtils.hasText(g) ? g : (raw != null ? raw.trim() : "");
    }

    public String normalizeInternationalTunisia(String raw) {
        String g = normalizeGsm(raw);
        return StringUtils.hasText(g) ? g : (raw != null ? raw.trim() : "");
    }

    /**
     * Règle SMS (version unifiée) :
     * toutes les cliniques utilisent la même clé globale tunisiesms.api.key.
     */
    public void sendSmsForClinique(String cliniqueId, String phoneNumber, String message) {
        sendSmsForCliniqueWithOutcome(cliniqueId, phoneNumber, message);
    }

    /**
     * Comme {@link #sendSmsForClinique} mais avec la raison si aucun envoi ou échec API.
     */
    public SmsSendOutcome sendSmsForCliniqueWithOutcome(String cliniqueId, String phoneNumber, String message) {
        return sendSmsForCliniqueWithOutcome(cliniqueId, phoneNumber, message, "NOTIFICATION");
    }

    public SmsSendOutcome sendSmsForCliniqueWithOutcome(
            String cliniqueId, String phoneNumber, String message, String typeSms) {
        if (!enabled) {
            log.info("[TunisieSMS] Desactive — SMS non envoye vers {}", phoneNumber);
            return SmsSendOutcome.echec("TunisieSMS est désactivé (tunisiesms.enabled=false).");
        }
        if (!StringUtils.hasText(apiUrl)) {
            log.warn("[TunisieSMS] URL API manquante — SMS non envoye.");
            return SmsSendOutcome.echec("URL API TunisieSMS non configurée (tunisiesms.api.url).");
        }

        if (!StringUtils.hasText(globalApiKey)) {
            log.warn("[TunisieSMS] Aucune cle globale — SMS non envoye.");
            return SmsSendOutcome.echec("Clé API globale TunisieSMS absente (tunisiesms.api.key).");
        }

        if (StringUtils.hasText(cliniqueId)) {
            var quota = cliniqueSmsQuotaService.verifierQuota(cliniqueId);
            if (!quota.autorise()) {
                log.warn("[TunisieSMS] Quota SMS clinique {} — {}", cliniqueId, quota.message());
                cliniqueSmsQuotaService.enregistrerEnvoi(
                        cliniqueId, phoneNumber, message, "QUOTA_BLOCKED", typeSms);
                return SmsSendOutcome.echec(quota.message());
            }
        }

        String tag = StringUtils.hasText(cliniqueId) ? "global-clinique:" + cliniqueId : "global";
        SmsSendOutcome outcome = doSendWithOutcome(globalApiKey, globalSender, phoneNumber, message, tag);
        if (StringUtils.hasText(cliniqueId)) {
            cliniqueSmsQuotaService.enregistrerEnvoi(
                    cliniqueId,
                    phoneNumber,
                    message,
                    outcome.envoye() ? "SENT" : "FAILED",
                    typeSms);
        }
        return outcome;
    }

    /**
     * SMS création / réinitialisation administrateur clinique.
     * Utilise la clé globale plateforme — sans contrôle de quota abonnement
     * (l'onboarding admin doit fonctionner même si la clinique n'a pas encore d'abonnement actif).
     */
    public SmsSendOutcome sendSmsAdminCliniqueWithOutcome(
            String cliniqueId, String phoneNumber, String message, String typeSms) {
        if (!enabled) {
            log.info("[TunisieSMS] Desactive — SMS admin non envoye vers {}", phoneNumber);
            return SmsSendOutcome.echec("TunisieSMS est désactivé (tunisiesms.enabled=false).");
        }
        if (!StringUtils.hasText(apiUrl) || !StringUtils.hasText(globalApiKey)) {
            log.warn("[TunisieSMS] URL ou cle globale manquante — SMS admin non envoye.");
            return SmsSendOutcome.echec("URL API ou clé globale TunisieSMS absente.");
        }

        String tag = StringUtils.hasText(cliniqueId) ? "admin-clinique:" + cliniqueId : "admin-clinique";
        SmsSendOutcome outcome = doSendWithOutcome(globalApiKey, globalSender, phoneNumber, message, tag);
        if (StringUtils.hasText(cliniqueId)) {
            cliniqueSmsQuotaService.enregistrerEnvoi(
                    cliniqueId,
                    phoneNumber,
                    message,
                    outcome.envoye() ? "SENT" : "FAILED",
                    typeSms != null ? typeSms : "ADMIN_PROVISIONING");
        }
        return outcome;
    }

    public void sendSmsAdminClinique(String cliniqueId, String phoneNumber, String message) {
        sendSmsAdminCliniqueWithOutcome(cliniqueId, phoneNumber, message, "ADMIN_PROVISIONING");
    }

    public void sendSms(String phoneNumber, String message) {
        sendSmsForClinique(null, phoneNumber, message);
    }

    /**
     * Envoi avec la clé / expéditeur globaux ({@code tunisiesms.api.key}, {@code tunisiesms.sender}).
     *
     * @return résultat selon le JSON de réponse (status 200 par destinataire), pas seulement HTTP 2xx.
     */
    public SmsSendOutcome sendSmsWithGlobalKey(String phoneNumber, String message) {
        if (!enabled) {
            log.info("[TunisieSMS] Desactive — SMS non envoye vers {}", phoneNumber);
            return SmsSendOutcome.echec("TunisieSMS est désactivé (tunisiesms.enabled=false).");
        }
        if (!StringUtils.hasText(apiUrl) || !StringUtils.hasText(globalApiKey)) {
            log.warn("[TunisieSMS] URL ou cle globale manquante — SMS non envoye.");
            return SmsSendOutcome.echec("URL API ou clé globale absente.");
        }
        return doSendWithOutcome(globalApiKey, globalSender, phoneNumber, message, "global-forced");
    }

    // ─── Core : POST /api/sms ────────────────────────────────────

    private SmsSendOutcome doSendWithOutcome(String apiKey, String sender, String phoneNumber, String message, String tag) {
        apiKey = sanitizeApiKeyString(apiKey);
        String senderUsed = sender != null ? sender.trim() : "";
        String gsm = normalizeGsm(phoneNumber);
        String bodyText = prepareSmsBodyText(message);
        log.info("[TunisieSMS] [{}] Envoi vers gsm={} (raw={}) sender={}", tag, gsm, phoneNumber, senderUsed);

        SmsSendOutcome first = executeSmsPost(apiKey, senderUsed, gsm, bodyText, tag, apiTypeInt, includeDateEnvoi);
        if (first.envoye()) {
            return first;
        }
        if (shouldRetryAlternateApiType(first)) {
            int altType = apiTypeInt == 51 ? 55 : 51;
            boolean altDate = altType == 51;
            log.warn("[TunisieSMS] [{}] Echec (401 ou 500 JSON) avec type {} — reessai automatique avec type={} et date_envoi={}",
                    tag, apiTypeInt, altType, altDate);
            SmsSendOutcome second = executeSmsPost(apiKey, senderUsed, gsm, bodyText, tag, altType, altDate);
            if (second.envoye()) {
                log.info("[TunisieSMS] [{}] Reessai automatique reussi (type {}).", tag, altType);
            }
            return second.envoye() ? second : first;
        }
        return first;
    }

    /** Réessai 51↔55 si JSON 401 (clé) ou JSON 500 (souvent mauvais format type/date_envoi pour ce compte). */
    private boolean shouldRetryAlternateApiType(SmsSendOutcome outcome) {
        if (outcome == null || outcome.envoye()) {
            return false;
        }
        if (apiTypeInt != 51 && apiTypeInt != 55) {
            return false;
        }
        if (retry401AlternateType && isUnauthorizedSmsOutcome(outcome)) {
            return true;
        }
        return retry500AlternateType && isJsonInternalErrorSmsOutcome(outcome);
    }

    private static boolean isUnauthorizedSmsOutcome(SmsSendOutcome outcome) {
        String d = outcome.detail();
        if (!StringUtils.hasText(d)) {
            return false;
        }
        return d.contains("code 401") || d.contains("HTTP 401");
    }

    private static boolean isJsonInternalErrorSmsOutcome(SmsSendOutcome outcome) {
        String d = outcome.detail();
        if (!StringUtils.hasText(d)) {
            return false;
        }
        return d.contains("code 500");
    }

    /**
     * Un envoi HTTP POST /api/sms avec type et date_envoi explicites (pour reessai 51/55).
     */
    private SmsSendOutcome executeSmsPost(
            String apiKey,
            String senderUsed,
            String gsm,
            String bodyText,
            String tag,
            int typeInt,
            boolean withDateEnvoi) {
        SmsItem smsItem = withDateEnvoi
                ? new SmsItem(gsm, bodyText, dateEnvoiPluginCommeJquery())
                : new SmsItem(gsm, bodyText);
        SendRequest payload = new SendRequest(typeInt, senderUsed, List.of(smsItem));

        try {
            String json = objectMapper.writeValueAsString(payload);
            log.debug("[TunisieSMS] [{}] JSON (type={}): {}", tag, typeInt, json);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(new MediaType("application", "json", StandardCharsets.UTF_8));
            headers.setAccept(List.of(new MediaType("application", "json", StandardCharsets.UTF_8)));
            if (includeAuthorizationHeader) {
                headers.set("Authorization", authHeaderPrefix.trim() + " " + apiKey.trim());
            }
            headers.set("User-Agent", "PFE-Backend/1.0");

            HttpEntity<String> request = new HttpEntity<>(json, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, request, String.class);
            String body = response.getBody();

            log.info("[TunisieSMS] [{}] HTTP {} — reponse: {}", tag, response.getStatusCode().value(), truncate(body, 800));
            if (!response.getStatusCode().is2xxSuccessful()) {
                return SmsSendOutcome.echec("TunisieSMS a répondu HTTP " + response.getStatusCode().value() + ".");
            }
            return parseSendOutcome(tag, gsm, body);

        } catch (HttpStatusCodeException e) {
            log.error("[TunisieSMS] [{}] HTTP {} vers {} — {}", tag, e.getStatusCode().value(), gsm,
                    truncate(e.getResponseBodyAsString(), 1500));
            if (failOnError) throw new RuntimeException("TunisieSMS : " + e.getStatusCode(), e);
            return SmsSendOutcome.echec("Erreur HTTP " + e.getStatusCode().value()
                    + " vers TunisieSMS : " + truncate(e.getResponseBodyAsString(), 200));
        } catch (Exception e) {
            log.error("[TunisieSMS] [{}] Erreur vers {} : {}", tag, gsm, e.getMessage());
            if (failOnError) throw new RuntimeException("TunisieSMS : " + e.getMessage(), e);
            String msg = e.getMessage() != null ? e.getMessage() : "erreur inconnue";
            return SmsSendOutcome.echec("Erreur technique vers TunisieSMS : " + truncate(msg, 200));
        }
    }

    private SmsSendOutcome parseSendOutcome(String tag, String gsm, String body) {
        if (!StringUtils.hasText(body)) {
            return SmsSendOutcome.echec("Réponse vide de l'API TunisieSMS.");
        }
        try {
            JsonNode root = objectMapper.readTree(body.trim());
            List<JsonNode> rows = new java.util.ArrayList<>();
            if (root.isArray()) {
                root.forEach(rows::add);
            } else if (root.isObject()) {
                rows.add(root);
            } else {
                log.warn("[TunisieSMS] [{}] Corps JSON inattendu pour {} : {}", tag, gsm, truncate(body, 500));
                return SmsSendOutcome.echec("Réponse TunisieSMS : format JSON inattendu.");
            }

            boolean anyOk = false;
            Integer firstBadStatus = null;
            String messageIdStr = null;

            for (JsonNode row : rows) {
                int status = extractStatusCode(row);
                String mobileRow = row.hasNonNull("mobile") ? row.get("mobile").asText() : null;
                String msgId = extractMessageId(row);

                if (status == 200) {
                    anyOk = true;
                    messageIdStr = msgId;
                    log.info("[TunisieSMS] [{}] SUCCES — mobile={} message_id={}", tag, mobileRow, msgId);
                } else {
                    if (firstBadStatus == null && status != -999) {
                        firstBadStatus = status;
                    }
                    log.warn("[TunisieSMS] [{}] ECHEC — mobile={} status={} — {}", tag, mobileRow, status,
                            libelleStatutTunisie(status));
                }
            }

            if (anyOk) {
                String detail = messageIdStr != null
                        ? "SMS accepté par l'API (message_id=" + messageIdStr + "). Vérifiez le mobile / l'opérateur si rien n'arrive."
                        : "SMS accepté par l'API. Vérifiez le mobile / l'opérateur si rien n'arrive.";
                return SmsSendOutcome.ok(detail);
            }
            if (firstBadStatus != null) {
                return SmsSendOutcome.echec("TunisieSMS : code " + firstBadStatus + " — " + libelleStatutTunisie(firstBadStatus));
            }
            return SmsSendOutcome.echec("TunisieSMS n'a pas confirmé l'envoi (réponse inattendue). Corps : " + truncate(body, 300));
        } catch (Exception e) {
            log.warn("[TunisieSMS] [{}] Reponse non parsable pour {} : {} — corps: {}", tag, gsm, e.getMessage(),
                    truncate(body, 400));
            return SmsSendOutcome.echec("Réponse TunisieSMS illisible. Extrait : " + truncate(body, 200));
        }
    }

    /** Statut dans le JSON (nombre ou chaîne "200"). */
    private static int extractStatusCode(JsonNode row) {
        if (row == null || !row.has("status")) {
            return -999;
        }
        JsonNode st = row.get("status");
        if (st.isInt() || st.isLong()) {
            return st.asInt();
        }
        if (st.isTextual()) {
            try {
                return Integer.parseInt(st.asText().trim());
            } catch (NumberFormatException ignored) {
                return -999;
            }
        }
        return -999;
    }

    private static String extractMessageId(JsonNode row) {
        if (row == null || !row.has("message_id")) {
            return null;
        }
        JsonNode n = row.get("message_id");
        if (n == null || n.isNull()) {
            return null;
        }
        if (n.isNumber()) {
            return n.asText();
        }
        return n.asText();
    }

    /** Libellés doc MyStudents / API Rest JSON. */
    private static String libelleStatutTunisie(int code) {
        return switch (code) {
            case 200 -> "OK (accepté).";
            case 400 -> "Absence de la clé d'autorisation.";
            case 401 -> "Clé non autorisée ou expirée. Sur MyStudents : utilisez la clé de la même activation que votre "
                    + "type API (plugin jQuery + type 51 vs API Rest JSON + type 55), sans espace ni retour ligne. "
                    + "Vérifiez aussi qu'aucune variable TUNISIESMS_API_KEY vide n'écrase application.properties ; régénérez la clé si besoin.";
            case 402 -> "Crédit insuffisant.";
            case 420 -> "Quota journalier dépassé.";
            case 430 -> "Contenu du message manquant.";
            case 431 -> "Destination (numéro) manquante.";
            case 440 -> "Contenu trop long.";
            case 441 -> "Destination non autorisée.";
            case 442 -> "Sender non autorisé : dans MyStudents, ouvrez la liste des expéditeurs et copiez le libellé exact "
                    + "(casse, sans espace en trop) dans application.properties → tunisiesms.sender, "
                    + "ou définissez MYSTUDENTS_SMS_SENDER. "
                    + "Même valeur que $.tunisiesms.sender('...') dans le plugin jQuery.";
            case 500 -> "Erreur interne côté TunisieSMS — réessayez plus tard ou contactez leur support ; "
                    + "vérifiez aussi crédit et compte MyStudents.";
            default -> code == -999 ? "statut absent ou illisible dans la réponse" : "voir documentation codes TunisieSMS.";
        };
    }

    // ─── DLR : POST /api/dlr ─────────────────────────────────────

    public List<Map<String, Object>> queryDlrWithGlobalKey(List<String> messageIds) {
        if (!enabled || !StringUtils.hasText(globalApiKey) || !StringUtils.hasText(dlrUrl)) {
            return Collections.emptyList();
        }
        String keyForDlr = sanitizeApiKeyString(globalApiKey);
        if (messageIds == null || messageIds.isEmpty()) return Collections.emptyList();

        List<DlrItem> items = messageIds.stream()
                .filter(StringUtils::hasText)
                .map(id -> new DlrItem(id.trim()))
                .toList();
        if (items.isEmpty()) return Collections.emptyList();

        DlrRequest payload = new DlrRequest(apiTypeInt, items);

        try {
            String json = objectMapper.writeValueAsString(payload);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(new MediaType("application", "json", StandardCharsets.UTF_8));
            headers.setAccept(List.of(new MediaType("application", "json", StandardCharsets.UTF_8)));
            if (includeAuthorizationHeader) {
                headers.set("Authorization", authHeaderPrefix.trim() + " " + keyForDlr);
            }

            HttpEntity<String> request = new HttpEntity<>(json, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(dlrUrl, request, String.class);
            return parseDlrResponse(response.getBody());
        } catch (Exception e) {
            log.error("[TunisieSMS] [DLR] Erreur : {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseDlrResponse(String body) {
        if (!StringUtils.hasText(body)) return Collections.emptyList();
        try {
            String trimmed = body.trim();
            if (trimmed.startsWith("[")) {
                return objectMapper.readValue(trimmed, new TypeReference<List<Map<String, Object>>>() {});
            }
            return List.of(objectMapper.readValue(trimmed, new TypeReference<Map<String, Object>>() {}));
        } catch (Exception e) {
            log.warn("[TunisieSMS] [DLR] Parse error: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

    /**
     * Prépare le corps du SMS pour l'API (accents / retours ligne selon configuration).
     */
    /** Équivalent JS : {@code getFullYear()+"-"+(getMonth()+1)+"-"+getDate()} en fuseau Tunis. */
    private String dateEnvoiPluginCommeJquery() {
        return LocalDate.now(TUNIS).format(DATE_ENVOI_PLUGIN);
    }

    private String prepareSmsBodyText(String message) {
        if (message == null) {
            return "";
        }
        String t = message;
        if (smsSingleLine) {
            t = t.replace("\r\n", " ").replace('\n', ' ').replace('\r', ' ').replaceAll("\\s+", " ").trim();
        }
        if (stripAccentsForSmsBody) {
            String n = Normalizer.normalize(t, Normalizer.Form.NFD);
            t = n.replaceAll("\\p{M}+", "");
        }
        if (smsMaxLength > 0 && t.length() > smsMaxLength) {
            log.warn("[TunisieSMS] Message tronque {} -> {} caracteres (l'API renvoie status:500 au-dela de 159).",
                    t.length(), smsMaxLength);
            t = t.substring(0, smsMaxLength);
        }
        return t;
    }
}
