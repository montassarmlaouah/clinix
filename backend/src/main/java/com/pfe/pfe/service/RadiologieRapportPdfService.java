package com.pfe.pfe.service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfWriter;
import com.pfe.pfe.model.ImagerieDICOM;
import com.pfe.pfe.model.Patient;
import com.pfe.pfe.model.RapportImagerie;
import com.pfe.pfe.model.Radiologue;
import com.pfe.pfe.repository.RapportImagerieRepository;

import lombok.RequiredArgsConstructor;

/**
 * Export PDF du compte rendu d'imagerie (signature électronique logique = bloc horodaté à la validation).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RadiologieRapportPdfService {

    private final RapportImagerieRepository rapportRepository;

    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public byte[] genererPdf(String rapportId, String radiologueId) {
        RapportImagerie r = rapportRepository.findById(rapportId)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé"));
        if (r.getRadiologue() == null || !radiologueId.equals(r.getRadiologue().getId())) {
            throw new RuntimeException("Seul le radiologue auteur peut exporter ce rapport");
        }
        ImagerieDICOM img = r.getImagerie();
        Patient p = img != null ? img.getPatient() : null;
        Radiologue rad = r.getRadiologue();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 48, 48, 48, 48);
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD, new Color(0x0d, 0x47, 0x6e));
            Font hFont = new Font(Font.HELVETICA, 11, Font.BOLD);
            Font bodyFont = new Font(Font.HELVETICA, 10, Font.NORMAL);
            Font smallFont = new Font(Font.HELVETICA, 9, Font.NORMAL, new Color(0x55, 0x55, 0x55));

            Paragraph t = new Paragraph("COMPTE RENDU D'IMAGERIE MÉDICALE", titleFont);
            t.setAlignment(Element.ALIGN_CENTER);
            t.setSpacingAfter(16f);
            document.add(t);

            String patientNom = p != null ? trim(p.getPrenom()) + " " + trim(p.getNom()) : "—";
            document.add(section("Patient", patientNom, hFont, bodyFont));
            document.add(section("Examen (demande)", img != null ? nullToDash(img.getType()) : "—", hFont, bodyFont));
            if (img != null && StringUtils.hasText(img.getTypeExamenRealise())) {
                document.add(section("Modalité réalisée", img.getTypeExamenRealise(), hFont, bodyFont));
            }
            document.add(section("Date du rapport", r.getDate() != null ? r.getDate().format(DF) : "—", hFont, bodyFont));

            String signataire = rad != null ? trim(rad.getPrenom()) + " " + trim(rad.getNom()) : "—";
            if (StringUtils.hasText(rad != null ? rad.getNumeroOrdre() : null)) {
                signataire += " — N° ordre : " + rad.getNumeroOrdre();
            }
            document.add(section("Radiologue", signataire, hFont, bodyFont));

            document.add(block("Observations", r.getObservations(), hFont, bodyFont));
            document.add(block("Analyse / interprétation", r.getAnalyse(), hFont, bodyFont));
            document.add(block("Conclusion", r.getConclusion(), hFont, bodyFont));
            document.add(block("Recommandations", r.getRecommandations(), hFont, bodyFont));
            document.add(block("Diagnostic différentiel", r.getDiagnosticDifferentiel(), hFont, bodyFont));
            document.add(block("Signes cliniques notables", r.getSignesCliniquesNotables(), hFont, bodyFont));

            Paragraph foot = new Paragraph();
            foot.setSpacingBefore(24f);
            if (Boolean.TRUE.equals(r.getValide()) && r.getDateSignatureElectronique() != null) {
                foot.add(new Phrase(
                        "Document validé — signature électronique (horodatage) : "
                                + r.getDateSignatureElectronique().format(DTF) + " UTC\n",
                        smallFont));
            } else {
                foot.add(new Phrase("Document en brouillon — non validé.\n", smallFont));
            }
            foot.add(new Phrase("Export généré par la plateforme — usage professionnel.", smallFont));
            document.add(foot);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Génération PDF impossible : " + e.getMessage());
        }
    }

    private static String trim(String s) {
        return s != null ? s.trim() : "";
    }

    private static String nullToDash(String s) {
        return StringUtils.hasText(s) ? s : "—";
    }

    private static Paragraph section(String label, String value, Font hFont, Font bodyFont) {
        Paragraph p = new Paragraph();
        p.add(new Phrase(label + "\n", hFont));
        p.add(new Phrase(nullToDash(value) + "\n\n", bodyFont));
        return p;
    }

    private static Paragraph block(String label, String text, Font hFont, Font bodyFont) {
        Paragraph p = new Paragraph();
        p.add(new Phrase(label + "\n", hFont));
        p.add(new Phrase(StringUtils.hasText(text) ? text : "—\n\n", bodyFont));
        return p;
    }
}
