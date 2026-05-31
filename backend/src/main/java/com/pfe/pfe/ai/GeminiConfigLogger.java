package com.pfe.pfe.ai;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class GeminiConfigLogger {

    private final Environment environment;

    @EventListener(ApplicationReadyEvent.class)
    public void logGeminiStatus() {
        String key = firstNonBlank(
                environment.getProperty("gemini.api-key"),
                environment.getProperty("GEMINI_API_KEY"),
                System.getenv("GEMINI_API_KEY"));
        String model = environment.getProperty("gemini.model", "gemini-2.5-flash");
        if (StringUtils.hasText(key)) {
            log.info("Chatbot Gemini : configuré (modèle={}, clé présente)", model);
        } else {
            log.warn(
                    "Chatbot Gemini : NON configuré — renseignez gemini.api-key dans "
                            + "src/main/resources/gemini-local.properties puis redémarrez le backend.");
        }
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return "";
        }
        for (String v : values) {
            if (StringUtils.hasText(v)) {
                return v.trim();
            }
        }
        return "";
    }
}
