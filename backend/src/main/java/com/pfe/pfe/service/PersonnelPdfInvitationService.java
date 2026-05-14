package com.pfe.pfe.service;

import java.awt.Color;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.Ellipse2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import lombok.extern.slf4j.Slf4j;

/**
 * PDF d'invitation (clinux-identifiants-clinix.pdf) : identifiant, mot de passe provisoire, rôle et charte CLINIX.
 */
@Service
@Slf4j
public class PersonnelPdfInvitationService {

    /** Luna / CLINIX palette */
    private static final Color LUNA_DARK = new Color(0x02, 0x38, 0x59);
    private static final Color LUNA_TEAL = new Color(0x54, 0xAC, 0xBF);
    private static final Color LUNA_MIDNIGHT = new Color(0x01, 0x1C, 0x40);
    private static final Color MUTED = new Color(0x6C, 0x75, 0x7D);
    private static final Color PANEL_BG = new Color(0xF4, 0xF7, 0xF9);
    private static final Color BORDER = new Color(0xDE, 0xE2, 0xE6);

    /**
     * @param nomAffiche libellé affiché (peut être vide)
     * @param telephone  identifiant de connexion
     * @param motDePasse mot de passe provisoire en clair
     * @param roleCode   code rôle (ex. MEDECIN) pour libellé et pastille
     */
    public byte[] buildIdentifiantsPdf(String nomAffiche, String telephone, String motDePasse, String roleCode) {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, bos);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD, LUNA_DARK);
            Font body = new Font(Font.HELVETICA, 11, Font.NORMAL, LUNA_MIDNIGHT);
            Font bodyBold = new Font(Font.HELVETICA, 11, Font.BOLD, LUNA_MIDNIGHT);
            Font small = new Font(Font.HELVETICA, 9, Font.NORMAL, MUTED);
            Font valueFont = new Font(Font.COURIER, 12, Font.BOLD, LUNA_MIDNIGHT);
            Font tagFont = new Font(Font.HELVETICA, 10, Font.BOLD, LUNA_DARK);

            addClinixHeader(document);

            Paragraph title = new Paragraph("CLINIX — Vos identifiants de connexion", titleFont);
            title.setSpacingAfter(4f);
            document.add(title);

            PdfPTable bar = new PdfPTable(1);
            bar.setWidthPercentage(100);
            PdfPCell barCell = new PdfPCell();
            barCell.setFixedHeight(4f);
            barCell.setBorder(Rectangle.NO_BORDER);
            barCell.setBackgroundColor(LUNA_TEAL);
            bar.addCell(barCell);
            document.add(bar);
            document.add(new Paragraph(" ", small));

            String roleLibelle = roleLibelleFrancais(roleCode);
            PdfPTable roleRow = new PdfPTable(2);
            roleRow.setWidthPercentage(100);
            roleRow.setWidths(new float[] { 0.22f, 0.78f });
            PdfPCell iconCell = new PdfPCell();
            iconCell.setBorder(Rectangle.NO_BORDER);
            iconCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            iconCell.setPaddingBottom(8f);
            try {
                byte[] badge = renderRoleBadgePng(roleCode);
                Image ri = Image.getInstance(badge);
                ri.scaleToFit(28f, 28f);
                iconCell.addElement(ri);
            } catch (Exception e) {
                log.debug("Pastille rôle non générée: {}", e.getMessage());
            }
            roleRow.addCell(iconCell);

            Paragraph roleText = new Paragraph();
            roleText.add(new Phrase("Compte : ", body));
            roleText.add(new Phrase(roleLibelle, tagFont));
            roleText.setSpacingAfter(10f);
            PdfPCell textCell = new PdfPCell(roleText);
            textCell.setBorder(Rectangle.NO_BORDER);
            textCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            roleRow.addCell(textCell);
            document.add(roleRow);

            if (StringUtils.hasText(nomAffiche)) {
                Paragraph hello = new Paragraph();
                hello.add(new Phrase("Bonjour ", body));
                hello.add(new Phrase(nomAffiche.trim(), bodyBold));
                hello.add(new Phrase(",", body));
                hello.setSpacingAfter(10f);
                document.add(hello);
            }

            document.add(new Paragraph(
                    "Ce document résume votre identifiant (téléphone), votre mot de passe provisoire et votre rôle. "
                            + "Conservez-le de façon confidentielle.",
                    body));
            document.add(new Paragraph(" ", small));

            PdfPTable loginBox = new PdfPTable(1);
            loginBox.setWidthPercentage(100);
            PdfPCell loginTitle = cellPanel("Connexion à l'application CLINIX", bodyBold, PANEL_BG);
            loginTitle.setPadding(10);
            loginBox.addCell(loginTitle);

            PdfPTable inner = new PdfPTable(2);
            inner.setWidthPercentage(100);
            inner.setWidths(new float[] { 1.15f, 2.1f });
            addRow(inner, "Rôle", roleLibelle, body, valueFont);
            addRow(inner, "Téléphone (identifiant)", telephone != null ? telephone : "—", body, valueFont);
            addRow(inner, "Mot de passe provisoire", motDePasse != null ? motDePasse : "—", body, valueFont);
            PdfPCell innerWrap = new PdfPCell(inner);
            innerWrap.setBorder(Rectangle.BOX);
            innerWrap.setBorderColor(BORDER);
            innerWrap.setPadding(12);
            loginBox.addCell(innerWrap);
            document.add(loginBox);

            document.add(new Paragraph(" ", small));
            document.add(new Paragraph(
                    "Après votre première connexion, changez votre mot de passe. "
                            + "En cas de changement ou d'oubli de mot de passe, un code de vérification pourra vous être "
                            + "demandé par l'application (il ne figure pas sur ce PDF).",
                    small));

            document.add(new Paragraph(" ", small));
            document.add(new Paragraph(
                    "Fichier : clinux-identifiants-clinix.pdf — ouvrez ce document avec un lecteur PDF pour activer votre accès.",
                    small));
            document.add(new Paragraph(" ", small));
            document.add(new Paragraph("Document généré automatiquement — usage strictement personnel — CLINIX.", small));

            document.close();
            return bos.toByteArray();
        } catch (Exception e) {
            log.error("Erreur génération PDF identifiants", e);
            throw new IllegalStateException("Impossible de générer le PDF : " + e.getMessage());
        }
    }

    /**
     * Logo : {@code /images/clinix-logo.png}, puis {@code logo.png} / {@code logo.jpg}, sinon en-tête graphique généré.
     */
    private void addClinixHeader(Document document) throws Exception {
        String[] paths = { "/images/clinix-logo.png", "/images/logo.png", "/images/logo.jpg" };
        for (String path : paths) {
            try (InputStream is = getClass().getResourceAsStream(path)) {
                if (is == null) {
                    continue;
                }
                byte[] bytes = is.readAllBytes();
                if (bytes.length == 0) {
                    continue;
                }
                Image img = Image.getInstance(bytes);
                float maxHeight = 52f;
                if (img.getHeight() > maxHeight) {
                    img.scaleToFit(maxHeight * img.getWidth() / img.getHeight(), maxHeight);
                }
                img.setAlignment(Element.ALIGN_CENTER);
                img.setSpacingAfter(10f);
                document.add(img);
                return;
            } catch (Exception ignored) {
                // essai suivant
            }
        }
        byte[] wordmark = renderClinixWordmarkPng();
        Image img = Image.getInstance(wordmark);
        img.scaleToFit(280f, 56f);
        img.setAlignment(Element.ALIGN_CENTER);
        img.setSpacingAfter(10f);
        document.add(img);
    }

    private static byte[] renderClinixWordmarkPng() throws Exception {
        int w = 340;
        int h = 64;
        BufferedImage bi = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = bi.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        GradientPaint gp = new GradientPaint(0, 0, LUNA_DARK, w, h, LUNA_TEAL);
        g.setPaint(gp);
        g.fillRect(0, 0, w, h);
        g.setColor(Color.WHITE);
        g.setFont(new java.awt.Font(java.awt.Font.SANS_SERIF, java.awt.Font.BOLD, 30));
        g.drawString("CLINIX", 22, 44);
        g.setFont(new java.awt.Font(java.awt.Font.SANS_SERIF, java.awt.Font.PLAIN, 11));
        g.drawString("Plateforme médicale", 22, 58);
        g.dispose();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(bi, "png", baos);
        return baos.toByteArray();
    }

    private static byte[] renderRoleBadgePng(String roleCode) throws Exception {
        RoleBadge b = roleBadgeFor(roleCode);
        int size = 64;
        BufferedImage im = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = im.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setColor(b.fill);
        g.fill(new Ellipse2D.Float(2, 2, size - 4, size - 4));
        g.setColor(Color.WHITE);
        g.setFont(new java.awt.Font(java.awt.Font.SANS_SERIF, java.awt.Font.BOLD, 28));
        int sw = g.getFontMetrics().stringWidth(b.letter);
        g.drawString(b.letter, (size - sw) / 2, 44);
        g.dispose();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(im, "png", baos);
        return baos.toByteArray();
    }

    private record RoleBadge(String letter, Color fill) {}

    private static RoleBadge roleBadgeFor(String roleCode) {
        if (roleCode == null || roleCode.isBlank()) {
            return new RoleBadge("?", MUTED);
        }
        return switch (roleCode.trim().toUpperCase()) {
            case "MEDECIN" -> new RoleBadge("M", new Color(0x26, 0x65, 0x8C));
            case "INFIRMIER" -> new RoleBadge("I", new Color(0x0D, 0x94, 0x88));
            case "PHARMACIEN" -> new RoleBadge("P", new Color(0x7C, 0x3A, 0xED));
            case "SECRETAIRE" -> new RoleBadge("S", new Color(0xD9, 0x77, 0x06));
            case "RADIOLOGUE" -> new RoleBadge("R", new Color(0xDC, 0x26, 0x26));
            case "CHEF_PERSONNEL" -> new RoleBadge("C", new Color(0x43, 0x4F, 0x5E));
            case "TECHNICIEN_MAINTENANCE" -> new RoleBadge("T", new Color(0x65, 0x74, 0x30));
            case "ADMIN", "ADMIN_CLINIQUE", "SUPER_ADMIN" -> new RoleBadge("A", new Color(0xB4, 0x5B, 0x06));
            default -> new RoleBadge(String.valueOf(roleCode.charAt(0)).toUpperCase(), LUNA_TEAL);
        };
    }

    private static String roleLibelleFrancais(String roleNom) {
        if (roleNom == null) {
            return "Personnel";
        }
        return switch (roleNom.toUpperCase()) {
            case "MEDECIN" -> "Médecin";
            case "INFIRMIER" -> "Infirmier";
            case "PHARMACIEN" -> "Pharmacien";
            case "SECRETAIRE" -> "Secrétaire";
            case "RADIOLOGUE" -> "Radiologue";
            case "CHEF_PERSONNEL" -> "Chef du personnel";
            case "TECHNICIEN_MAINTENANCE" -> "Technicien maintenance";
            case "ADMIN" -> "Administrateur";
            case "ADMIN_CLINIQUE" -> "Administrateur clinique";
            case "SUPER_ADMIN" -> "Super administrateur";
            default -> roleNom;
        };
    }

    private static PdfPCell cellPanel(String text, Font font, Color bg) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setBorder(Rectangle.NO_BORDER);
        c.setBackgroundColor(bg);
        return c;
    }

    private static void addRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell l = new PdfPCell(new Phrase(label, labelFont));
        l.setBorder(Rectangle.NO_BORDER);
        l.setPadding(6);
        PdfPCell v = new PdfPCell(new Phrase(value, valueFont));
        v.setBorder(Rectangle.NO_BORDER);
        v.setPadding(6);
        table.addCell(l);
        table.addCell(v);
    }
}
