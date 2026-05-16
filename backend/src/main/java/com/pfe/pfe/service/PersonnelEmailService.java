package com.pfe.pfe.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class PersonnelEmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.mail.from:}")
    private String appMailFrom;

    public boolean isMailConfigured() {
        return mailSender != null
                && StringUtils.hasText(mailHost)
                && StringUtils.hasText(mailUsername)
                && StringUtils.hasText(mailPassword)
                && StringUtils.hasText(resolveFrom());
    }

    private String resolveFrom() {
        if (StringUtils.hasText(appMailFrom)) {
            return appMailFrom.trim();
        }
        return mailUsername != null ? mailUsername.trim() : "";
    }

    public void sendTextEmail(String to, String subject, String body) {
        if (!isMailConfigured()) {
            throw new IllegalStateException(
                    "E-mail non configuré : renseignez spring.mail.host, spring.mail.username et un mot de passe d'application (ou app.mail.from).");
        }
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(resolveFrom());
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(body);
        mailSender.send(msg);
    }

    public void sendEmailWithPdfAttachment(String to, String subject, String body, byte[] pdfBytes, String attachmentName) {
        sendHtmlEmailWithPdfAttachment(to, null, subject, null, body, pdfBytes, attachmentName);
    }

    /**
     * E-mail HTML + texte brut de secours ; copie cachée optionnelle (BCC).
     */
    public void sendHtmlTextEmail(String to, String bccOptional, String subject, String htmlBody, String plainTextFallback) {
        if (!isMailConfigured()) {
            throw new IllegalStateException(
                    "E-mail non configuré : renseignez spring.mail.* dans application.properties.");
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // multipart=true obligatoire pour setText(plain, html) (alternative/html) — Spring 6.2+
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(resolveFrom());
            helper.setTo(to);
            if (StringUtils.hasText(bccOptional)) {
                helper.setBcc(bccOptional.trim());
            }
            helper.setSubject(subject);
            if (StringUtils.hasText(htmlBody)) {
                helper.setText(plainTextFallback != null ? plainTextFallback : "", htmlBody);
            } else {
                helper.setText(plainTextFallback != null ? plainTextFallback : "", false);
            }
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Erreur envoi e-mail HTML", e);
            throw new IllegalStateException("Impossible d'envoyer l'e-mail : " + e.getMessage());
        }
    }

    public void sendHtmlEmailWithPdfAttachment(
            String to,
            String bccOptional,
            String subject,
            String htmlBody,
            String plainTextFallback,
            byte[] pdfBytes,
            String attachmentName) {
        if (!isMailConfigured()) {
            throw new IllegalStateException(
                    "E-mail non configuré : renseignez spring.mail.* dans application.properties.");
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(resolveFrom());
            helper.setTo(to);
            if (StringUtils.hasText(bccOptional)) {
                helper.setBcc(bccOptional.trim());
            }
            helper.setSubject(subject);
            if (StringUtils.hasText(htmlBody)) {
                helper.setText(plainTextFallback != null ? plainTextFallback : "", htmlBody);
            } else {
                helper.setText(plainTextFallback != null ? plainTextFallback : "", false);
            }
            helper.addAttachment(attachmentName, new ByteArrayResource(pdfBytes));
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Erreur envoi e-mail avec pièce jointe", e);
            throw new IllegalStateException("Impossible d'envoyer l'e-mail : " + e.getMessage());
        }
    }
}
