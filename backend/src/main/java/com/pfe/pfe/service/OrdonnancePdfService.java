package com.pfe.pfe.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.pfe.pfe.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrdonnancePdfService {

    private final OrdonnanceService ordonnanceService;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final float MARGIN = 40f;
    private static final float CACHET_WIDTH = 180f;
    private static final float CACHET_PADDING = 10f;

    /**
     * Génère le PDF de l'ordonnance avec en-tête, tableau des médicaments et cachet de la clinique.
     */
    public byte[] genererPdf(String ordonnanceId) {
        Ordonnance ordonnance = ordonnanceService.getByIdWithPrescriptions(ordonnanceId)
            .orElseThrow(() -> new RuntimeException("Ordonnance non trouvée"));

        Patient patient = ordonnance.getPatientEffective();
        Medecin medecin = ordonnance.getMedecinEffective();
        Clinique clinique = medecin != null ? medecin.getClinique() : null;

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, MARGIN, MARGIN, MARGIN, MARGIN);
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 20, Font.BOLD, new Color(0x1a, 0x47, 0x72));
            Font subtitleFont = new Font(Font.HELVETICA, 11, Font.NORMAL);
            Font headerFont = new Font(Font.HELVETICA, 10, Font.BOLD);
            Font cellFont = new Font(Font.HELVETICA, 10, Font.NORMAL);
            Font smallFont = new Font(Font.HELVETICA, 9, Font.NORMAL);

            // ---- Cachet de la clinique (en haut à droite) ----
            if (clinique != null) {
                drawCachetClinique(document, clinique,
                    ordonnance.getNumeroOrdonnance() != null ? ordonnance.getNumeroOrdonnance() : ordonnance.getId(),
                    titleFont, smallFont);
            }

            // ---- Titre ----
            Paragraph pTitle = new Paragraph("ORDONNANCE MÉDICALE", titleFont);
            pTitle.setAlignment(Element.ALIGN_CENTER);
            pTitle.setSpacingAfter(8f);
            document.add(pTitle);

            String numero = ordonnance.getNumeroOrdonnance() != null ? ordonnance.getNumeroOrdonnance() : ("N° " + ordonnance.getId());
            Paragraph pNum = new Paragraph("Ordonnance N° : " + numero, new Font(Font.HELVETICA, 12, Font.BOLD));
            pNum.setAlignment(Element.ALIGN_CENTER);
            pNum.setSpacingAfter(4f);
            document.add(pNum);

            Paragraph pDate = new Paragraph("Date : " + ordonnance.getDate().format(DATE_FORMAT), subtitleFont);
            pDate.setAlignment(Element.ALIGN_CENTER);
            pDate.setSpacingAfter(20f);
            document.add(pDate);

            // ---- Bloc patient / médecin ----
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100f);
            infoTable.setWidths(new float[]{1f, 1f});
            infoTable.setSpacingAfter(16f);

            String patientText = "Patient :\n";
            if (patient != null) {
                patientText += (patient.getNom() != null ? patient.getNom() : "") + " " + (patient.getPrenom() != null ? patient.getPrenom() : "") + "\n";
                if (patient.getNumeroPatient() != null) patientText += "N° patient : " + patient.getNumeroPatient() + "\n";
                if (patient.getDateNaissance() != null) patientText += "Né(e) le : " + patient.getDateNaissance().format(DATE_FORMAT);
            } else {
                patientText += "—";
            }

            String medecinText = "Médecin prescripteur :\n";
            if (medecin != null) {
                medecinText += (medecin.getNom() != null ? medecin.getNom() : "") + " " + (medecin.getPrenom() != null ? medecin.getPrenom() : "") + "\n";
                if (medecin.getSpecialite() != null) medecinText += medecin.getSpecialite() + "\n";
                if (medecin.getNumeroOrdre() != null) medecinText += "N° ordre : " + medecin.getNumeroOrdre();
            } else {
                medecinText += "—";
            }

            addCell(infoTable, patientText, cellFont, false);
            addCell(infoTable, medecinText, cellFont, false);
            document.add(infoTable);

            // ---- Tableau des médicaments ----
            Paragraph pMed = new Paragraph("Médicaments prescrits", headerFont);
            pMed.setSpacingAfter(8f);
            document.add(pMed);

            PdfPTable table = new PdfPTable(new float[]{2.5f, 1.2f, 1.2f, 0.8f, 2.3f});
            table.setWidthPercentage(100f);
            addHeaderCell(table, "Médicament", headerFont);
            addHeaderCell(table, "Dosage", headerFont);
            addHeaderCell(table, "Fréquence", headerFont);
            addHeaderCell(table, "Durée", headerFont);
            addHeaderCell(table, "Instructions", headerFont);

            List<Prescription> prescriptions = ordonnance.getPrescriptions();
            if (prescriptions != null && !prescriptions.isEmpty()) {
                for (Prescription pr : prescriptions) {
                    table.addCell(new PdfPCell(new Phrase(pr.getMedicament() != null ? pr.getMedicament() : "—", cellFont)));
                    table.addCell(new PdfPCell(new Phrase(pr.getDosage() != null ? pr.getDosage() : "—", cellFont)));
                    table.addCell(new PdfPCell(new Phrase(pr.getFrequence() != null ? pr.getFrequence() : "—", cellFont)));
                    table.addCell(new PdfPCell(new Phrase(pr.getDuree() != null ? pr.getDuree() + " j" : "—", cellFont)));
                    table.addCell(new PdfPCell(new Phrase(pr.getInstructions() != null ? pr.getInstructions() : "—", cellFont)));
                }
            } else {
                PdfPCell empty = new PdfPCell(new Phrase("Aucun médicament prescrit.", cellFont));
                empty.setColspan(5);
                table.addCell(empty);
            }

            table.setSpacingAfter(24f);
            document.add(table);

            // ---- Signature / cachet en bas ----
            if (clinique != null) {
                Paragraph pCachet = new Paragraph("Cachet et signature du médecin", smallFont);
                pCachet.setSpacingBefore(20f);
                document.add(pCachet);
            }

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération PDF ordonnance : " + e.getMessage(), e);
        }
    }

    /**
     * Dessine le cachet de la société (clinique) en haut à droite : nom, téléphone, lieu.
     * Style inspiré d'un cachet rectangulaire avec bordure (nom clinique, tél, lieu).
     */
    private void drawCachetClinique(Document document, Clinique clinique, String numeroOrdonnance,
                                    Font titleFont, Font smallFont) throws DocumentException {
        Font cachetSmallFont = new Font(Font.HELVETICA, 9, Font.NORMAL);

        StringBuilder sb = new StringBuilder();
        sb.append(clinique.getNom() != null ? clinique.getNom().toUpperCase() : "CLINIQUE").append("\n\n");
        sb.append("Ordonnance N° : ").append(numeroOrdonnance).append("\n\n");
        if (clinique.getTelephone() != null && !clinique.getTelephone().isBlank()) {
            sb.append("Tél : ").append(clinique.getTelephone()).append("\n");
        }
        if (clinique.getAdresse() != null && !clinique.getAdresse().isBlank()) {
            sb.append("Lieu : ").append(clinique.getAdresse());
        }

        PdfPCell cell = new PdfPCell(new Phrase(sb.toString(), cachetSmallFont));
        cell.setBorder(Rectangle.BOX);
        cell.setBorderWidth(1.5f);
        cell.setPadding(CACHET_PADDING);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setFixedHeight(85f);

        PdfPTable cachet = new PdfPTable(1);
        cachet.setTotalWidth(CACHET_WIDTH);
        cachet.setLockedWidth(true);
        cachet.addCell(cell);

        PdfPTable wrapper = new PdfPTable(1);
        wrapper.setWidthPercentage(100f);
        wrapper.getDefaultCell().setHorizontalAlignment(Element.ALIGN_RIGHT);
        wrapper.getDefaultCell().setBorder(Rectangle.NO_BORDER);
        wrapper.addCell(cachet);
        wrapper.setSpacingAfter(16f);
        document.add(wrapper);
    }

    private void addCell(PdfPTable table, String text, Font font, boolean header) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(6f);
        if (header) {
            cell.setBackgroundColor(new Color(0xE8, 0xEE, 0xF4));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        }
        table.addCell(cell);
    }

    private void addHeaderCell(PdfPTable table, String text, Font font) {
        Font whiteFont = new Font(font.getFamily(), font.getSize(), font.getStyle(), Color.WHITE);
        PdfPCell cell = new PdfPCell(new Phrase(text, whiteFont));
        cell.setPadding(8f);
        cell.setBackgroundColor(new Color(0x1a, 0x47, 0x72));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }
}
