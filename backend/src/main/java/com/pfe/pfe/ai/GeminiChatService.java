package com.pfe.pfe.ai;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class GeminiChatService {

    /** Modèles encore servis par l'API Google AI (éviter gemini-1.5-* : arrêtés). */
    private static final List<String> MODEL_FALLBACKS = List.of(
            "gemini-2.5-flash",
            "gemini-2.0-flash-lite",
            "gemini-2.0-flash");

    private final RestTemplate restTemplate;
    private final Environment environment;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    private static final String SYSTEM_PROMPT =
            "Tu es Clinix, assistant médical virtuel pour médecins en cabinet. "
                    + "Réponds en français, de façon claire et concise. "
                    + "Ne pose pas de diagnostic définitif : rappelle de consulter un professionnel de santé. "
                    + "Aide sur l'utilisation de l'application (patients, rendez-vous, dossiers).";

    public GeminiChatService(RestTemplate restTemplate, Environment environment) {
        this.restTemplate = restTemplate;
        this.environment = environment;
    }

    private String resolveApiKey() {
        String fromProps = environment.getProperty("gemini.api-key");
        if (StringUtils.hasText(fromProps)) {
            return fromProps.trim();
        }
        String fromEnvVar = environment.getProperty("GEMINI_API_KEY");
        if (StringUtils.hasText(fromEnvVar)) {
            return fromEnvVar.trim();
        }
        String fromOs = System.getenv("GEMINI_API_KEY");
        return StringUtils.hasText(fromOs) ? fromOs.trim() : "";
    }

    public String ask(String message) {
        String apiKey = resolveApiKey();
        if (!StringUtils.hasText(apiKey)) {
            throw new IllegalStateException(
                    "Clé Gemini non configurée. Ajoutez gemini.api-key dans gemini-local.properties ou GEMINI_API_KEY.");
        }
        String msg = String.valueOf(message == null ? "" : message).trim();
        if (msg.isEmpty()) {
            return "";
        }

        List<String> models = modelsToTry();
        HttpStatusCodeException lastQuota = null;
        HttpStatusCodeException lastError = null;

        for (String m : models) {
            try {
                String reply = callGemini(apiKey, m, msg);
                if (StringUtils.hasText(reply)) {
                    return reply;
                }
                log.warn("Gemini modèle {} : réponse vide, essai suivant", m);
            } catch (HttpStatusCodeException ex) {
                int code = ex.getStatusCode().value();
                log.warn("Gemini modèle {} : HTTP {} — {}", m, code, shorten(ex.getResponseBodyAsString()));
                if (code == 429) {
                    lastQuota = ex;
                    continue;
                }
                if (code == 400 || code == 404) {
                    lastError = ex;
                    continue;
                }
                throw toFriendlyException(ex);
            }
        }

        if (lastQuota != null) {
            throw new GeminiApiException(
                    "Limite gratuite Gemini atteinte. Attendez une minute puis réessayez.",
                    HttpStatus.TOO_MANY_REQUESTS);
        }
        if (lastError != null) {
            throw new GeminiApiException(
                    "Aucun modèle Gemini disponible avec votre clé. Essayez gemini.model=gemini-2.5-flash dans gemini-local.properties.",
                    HttpStatus.BAD_REQUEST);
        }
        throw new GeminiApiException("Impossible d'obtenir une réponse de Gemini.", HttpStatus.BAD_GATEWAY);
    }

    private static String shorten(String s) {
        if (s == null) {
            return "";
        }
        return s.length() > 120 ? s.substring(0, 120) + "…" : s;
    }

    private List<String> modelsToTry() {
        Set<String> ordered = new LinkedHashSet<>();
        if (StringUtils.hasText(model)) {
            ordered.add(model.trim());
        }
        ordered.addAll(MODEL_FALLBACKS);
        return new ArrayList<>(ordered);
    }

    private String callGemini(String apiKey, String modelName, String msg) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + modelName + ":generateContent";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        Map<String, Object> payload = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", SYSTEM_PROMPT))),
                "contents", List.of(
                        Map.of("role", "user", "parts", List.of(Map.of("text", msg)))),
                "generationConfig", Map.of(
                        "temperature", 0.3,
                        "maxOutputTokens", 512));

        @SuppressWarnings("unchecked")
        Map<String, Object> res = restTemplate.postForObject(url, new HttpEntity<>(payload, headers), Map.class);
        return extractText(res);
    }

    private GeminiApiException toFriendlyException(HttpStatusCodeException ex) {
        int code = ex.getStatusCode().value();
        if (code == 429) {
            return new GeminiApiException(
                    "Limite d'appels Gemini atteinte. Réessayez dans une minute.",
                    HttpStatus.TOO_MANY_REQUESTS);
        }
        return new GeminiApiException(
                "Erreur du service Gemini (" + code + "). Réessayez plus tard.",
                HttpStatus.BAD_GATEWAY);
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> res) {
        if (res == null) {
            return "";
        }
        Object candidatesObj = res.get("candidates");
        if (!(candidatesObj instanceof List<?> candidates) || candidates.isEmpty()) {
            return "";
        }
        Object first = candidates.get(0);
        if (!(first instanceof Map<?, ?> c0)) {
            return "";
        }
        Object contentObj = c0.get("content");
        if (!(contentObj instanceof Map<?, ?> content)) {
            return "";
        }
        Object partsObj = content.get("parts");
        if (!(partsObj instanceof List<?> parts) || parts.isEmpty()) {
            return "";
        }
        Object p0 = parts.get(0);
        if (!(p0 instanceof Map<?, ?> part0)) {
            return "";
        }
        Object text = part0.get("text");
        return text != null ? String.valueOf(text) : "";
    }
}
