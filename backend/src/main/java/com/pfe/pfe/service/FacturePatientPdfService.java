package com.pfe.pfe.service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.model.FacturePatient;
import com.pfe.pfe.model.LigneFacturePatient;
import com.pfe.pfe.model.Patient;
import com.pfe.pfe.model.StatutFacturePatient;
import com.pfe.pfe.repository.FacturePatientRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FacturePatientPdfService {

    private final FacturePatientRepository facturePatientRepository;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final float MARGIN = 40f;

    public byte[] genererPdf(String factureId) {
        FacturePatient facture = facturePatientRepository.findByIdWithDetails(factureId)
            .orElseThrow(() -> new RuntimeException("Facture non trouvée"));

        if (facture.getStatut() == StatutFacturePatient.BROUILLON) {
            throw new IllegalStateException("Impossible de télécharger le PDF d'une facture au statut Brouillon. Émettez la facture d'abord.");
        }

        Patient patient = facture.getPatient();
        Clinique clinique = facture.getClinique();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, MARGIN, MARGIN, MARGIN, MARGIN);
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD, new Color(0x1a, 0x47, 0x72));
            Font headerFont = new Font(Font.HELVETICA, 10, Font.BOLD);
            Font cellFont = new Font(Font.HELVETICA, 10, Font.NORMAL);
            Font smallFont = new Font(Font.HELVETICA, 9, Font.NORMAL);

            Paragraph title = new Paragraph("FACTURE PATIENT", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(6f);
            document.add(title);

            Paragraph num = new Paragraph("N° " + facture.getNumeroFacture(), headerFont);
            num.setAlignment(Element.ALIGN_CENTER);
            num.setSpacingAfter(4f);
            document.add(num);

            Paragraph date = new Paragraph("Date : " + facture.getDateFacture().format(DATE_FORMAT), smallFont);
            date.setAlignment(Element.ALIGN_CENTER);
            date.setSpacingAfter(16f);
            document.add(date);

            PdfPTable info = new PdfPTable(2);
            info.setWidthPercentage(100f);
            info.setWidths(new float[] { 1f, 1f });
            info.setSpacingAfter(14f);

            StringBuilder patientBloc = new StringBuilder("Patient :\n");
            if (patient != null) {
                patientBloc.append(patient.getPrenom()).append(" ").append(patient.getNom()).append("\n");
                patientBloc.append("N° patient : ").append(patient.getNumeroPatient()).append("\n");
                if (patient.getTelephone() != null) {
                    patientBloc.append("Tél. : ").append(patient.getTelephone()).append("\n");
                }
                if (patient.getAdresse() != null) {
                    patientBloc.append(patient.getAdresse());
                }
            }
            info.addCell(cell(patientBloc.toString(), cellFont));

            StringBuilder cliniqueBloc = new StringBuilder("Établissement :\n");
            if (clinique != null) {
                cliniqueBloc.append(clinique.getNom()).append("\n");
                cliniqueBloc.append(clinique.getAdresse()).append("\n");
                if (clinique.getTelephone() != null) {
                    cliniqueBloc.append("Tél. : ").append(clinique.getTelephone());
                }
            }
            info.addCell(cell(cliniqueBloc.toString(), cellFont));
            document.add(info);

            if (facture.getNombreJours() != null && facture.getNombreJours() > 0) {
                Paragraph jours = new Paragraph(
                    "Séjour : " + facture.getNombreJours() + " jour(s)"
                        + (facture.getDateSortie() != null ? " — sortie le " + facture.getDateSortie().format(DATE_FORMAT) : ""),
                    smallFont);
                jours.setSpacingAfter(10f);
                document.add(jours);
            }

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100f);
            table.setWidths(new float[] { 1.2f, 3f, 0.8f, 1.2f, 1.2f });
            table.setSpacingAfter(12f);

            addHeader(table, "Code", headerFont);
            addHeader(table, "Acte / prestation", headerFont);
            addHeader(table, "Qté", headerFont);
            addHeader(table, "P.U. (TND)", headerFont);
            addHeader(table, "Montant", headerFont);

            for (LigneFacturePatient l : facture.getLignes()) {
                table.addCell(cell(l.getCodeActe(), cellFont));
                table.addCell(cell(l.getLibelle(), cellFont));
                table.addCell(cell(String.valueOf(l.getQuantite()), cellFont));
                table.addCell(cell(formatMontant(l.getPrixUnitaire()), cellFont));
                table.addCell(cell(formatMontant(l.getMontantLigne()), cellFont));
            }
            document.add(table);

            PdfPTable totaux = new PdfPTable(2);
            totaux.setWidthPercentage(55f);
            totaux.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totaux.setWidths(new float[] { 1.5f, 1f });

            addTotalRow(totaux, "Montant total", facture.getMontantTotal(), headerFont, cellFont);
            addTotalRow(totaux, "Montant remboursable (CNAM)", facture.getMontantRemboursable(), headerFont, cellFont);
            addTotalRow(totaux, "Ticket modérateur (patient)", facture.getTicketModerateur(), headerFont, cellFont);
            if (facture.getMontantPaye() != null && facture.getMontantPaye().compareTo(BigDecimal.ZERO) > 0) {
                addTotalRow(totaux, "Montant payé", facture.getMontantPaye(), headerFont, cellFont);
            }

            document.add(totaux);

            Paragraph footer = new Paragraph(
                "Document généré par Clinix — codes actes conformes nomenclature CNAM (simulation).",
                new Font(Font.HELVETICA, 8, Font.ITALIC, Color.GRAY));
            footer.setSpacingBefore(24f);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération PDF facture : " + e.getMessage(), e);
        }
    }

    private static void addHeader(PdfPTable table, String text, Font font) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setBackgroundColor(new Color(0xee, 0xf2, 0xf6));
        c.setPadding(6f);
        table.addCell(c);
    }

    private static PdfPCell cell(String text, Font font) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setPadding(5f);
        return c;
    }

    private static void addTotalRow(PdfPTable table, String label, BigDecimal montant, Font labelFont, Font valueFont) {
        table.addCell(cell(label, labelFont));
        table.addCell(cell(formatMontant(montant) + " TND", valueFont));
    }

    private static String formatMontant(BigDecimal m) {
        if (m == null) return "0,000";
        return m.setScale(3, java.math.RoundingMode.HALF_UP).toPlainString();
    }
}
