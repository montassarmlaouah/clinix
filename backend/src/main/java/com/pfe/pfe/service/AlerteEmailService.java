package com.pfe.pfe.service;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * E-mails d'alerte métier (palette Luna en HTML inline pour les clients mail).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AlerteEmailService {

    private static final String LUNA_BG = "#011C40";
    private static final String LUNA_CARD = "#023859";
    private static final String LUNA_ACCENT = "#54ACBF";
    private static final String LUNA_LIGHT = "#A7EBF2";

    private final PersonnelEmailService personnelEmailService;

    public void envoyerAlerteSiPossible(String destinataireEmail, String sujet, String titre, String corpsTexte) {
        if (!StringUtils.hasText(destinataireEmail) || !personnelEmailService.isMailConfigured()) {
            return;
        }
        try {
            String html = buildHtml(titre, corpsTexte);
            personnelEmailService.sendHtmlTextEmail(destinataireEmail.trim(), null, sujet, html, corpsTexte);
        } catch (Exception e) {
            log.warn("E-mail d'alerte non envoyé à {} : {}", destinataireEmail, e.getMessage());
        }
    }

    private static String buildHtml(String titre, String corpsTexte) {
        String safeTitle = escape(titre);
        String body = escape(corpsTexte).replace("\n", "<br/>");
        return """
                <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
                <body style="margin:0;background:%s;font-family:Segoe UI,Roboto,sans-serif;">
                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:%s;padding:24px 12px;">
                  <tr><td align="center">
                    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:%s;border-radius:16px;overflow:hidden;border:1px solid %s;">
                      <tr><td style="background:linear-gradient(135deg,%s,%s);padding:18px 22px;color:#fff;font-size:18px;font-weight:700;">%s</td></tr>
                      <tr><td style="padding:22px;color:%s;font-size:15px;line-height:1.55;">%s</td></tr>
                      <tr><td style="padding:0 22px 20px;color:%s;font-size:12px;">Clinix — notification automatique</td></tr>
                    </table>
                  </td></tr>
                </table></body></html>
                """.formatted(LUNA_BG, LUNA_BG, LUNA_CARD, LUNA_ACCENT, LUNA_ACCENT, LUNA_BG, safeTitle, LUNA_LIGHT, body, LUNA_ACCENT);
    }

    private static String escape(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
