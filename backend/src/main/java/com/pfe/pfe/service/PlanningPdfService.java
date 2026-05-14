package com.pfe.pfe.service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.pfe.pfe.model.Garde;
import com.pfe.pfe.model.Planning;
import com.pfe.pfe.model.User;
import com.pfe.pfe.repository.GardeRepository;
import com.pfe.pfe.repository.PlanningRepository;
import com.pfe.pfe.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlanningPdfService {

    private final PlanningRepository planningRepository;
    private final GardeRepository gardeRepository;
    private final ServiceRepository serviceRepository;

    /**
     * Génère un PDF du planning. Un PDF = un seul infirmier.
     * @param utilisateurId si renseigné, le PDF ne contient que le planning de cet infirmier.
     *                      Si absent et plusieurs infirmiers dans le planning, une exception est levée.
     */
    public byte[] generatePlanningPdf(String planningId, String serviceId, String utilisateurId) {
        Planning planning = planningRepository.findById(planningId)
            .orElseThrow(() -> new RuntimeException("Planning non trouvé"));

        List<Garde> gardes = gardeRepository.findByPlanningIdWithUtilisateurAndService(planningId);
        if (serviceId != null && !serviceId.isBlank()) {
            gardes = gardes.stream()
                .filter(g -> g.getService() != null && serviceId.equals(g.getService().getId()))
                .collect(Collectors.toList());
        }

        if (utilisateurId != null && !utilisateurId.isBlank()) {
            gardes = gardes.stream()
                .filter(g -> g.getUtilisateur() != null && utilisateurId.equals(g.getUtilisateur().getId()))
                .collect(Collectors.toList());
        } else {
            List<String> distinctUserIds = gardes.stream()
                .map(g -> g.getUtilisateur() == null ? null : g.getUtilisateur().getId())
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .toList();
            if (distinctUserIds.size() > 1) {
                throw new RuntimeException(
                    "Ce planning contient plusieurs infirmiers. Générez un PDF par infirmier (précisez l'infirmier).");
            }
        }

        String serviceName = null;
        if (serviceId != null && !serviceId.isBlank()) {
            serviceName = serviceRepository.findById(serviceId)
                .map(s -> s.getNom())
                .orElse(null);
        }
        if (serviceName == null) {
            serviceName = gardes.stream()
                .map(g -> g.getService() == null ? null : g.getService().getNom())
                .filter(n -> n != null && !n.isBlank())
                .distinct()
                .reduce((a, b) -> "Services multiples")
                .orElse(null);
        }

        List<String> uniqueUsers = gardes.stream()
            .map(this::displayName)
            .filter(n -> n != null && !n.isBlank() && !"—".equals(n))
            .distinct()
            .sorted()
            .toList();

        String title = uniqueUsers.size() == 1 ? "Planning infirmier" : "Planning infirmiers";
        List<String> subtitleLines = new ArrayList<>();
        // Toujours écrire chaque infirmier dans le fichier PDF
        if (!uniqueUsers.isEmpty()) {
            subtitleLines.add("Infirmiers : " + String.join(", ", uniqueUsers));
        }
        if (serviceName != null && !serviceName.isBlank()) {
            subtitleLines.add("Service : " + serviceName);
        }
        String subtitle = subtitleLines.isEmpty() ? null : String.join("\n", subtitleLines);

        return buildWeekPdf(title, subtitle, planning.getDate(), gardes);
    }

    private byte[] buildWeekPdf(String title, String subtitle, LocalDate dateDebut, List<Garde> gardes) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            // Logo en haut du planning (si présent dans src/main/resources/images/)
            addLogoIfPresent(document);

            Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD);
            Font subtitleFont = new Font(Font.HELVETICA, 12, Font.NORMAL);
            Font headerFont = new Font(Font.HELVETICA, 12, Font.BOLD);
            Font cellFont = new Font(Font.HELVETICA, 10, Font.NORMAL);

            Paragraph pTitle = new Paragraph(title, titleFont);
            pTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(pTitle);

            if (subtitle != null && !subtitle.isBlank()) {
                Paragraph pSubtitle = new Paragraph(subtitle, subtitleFont);
                pSubtitle.setAlignment(Element.ALIGN_CENTER);
                document.add(pSubtitle);
            }

            Paragraph pPeriod = new Paragraph(
                "Semaine du " + dateDebut + " au " + dateDebut.plusDays(6),
                subtitleFont
            );
            pPeriod.setAlignment(Element.ALIGN_CENTER);
            pPeriod.setSpacingAfter(16f);
            document.add(pPeriod);

            PdfPTable table = new PdfPTable(new float[]{1.2f, 2.7f, 2.7f, 2.7f});
            table.setWidthPercentage(100f);

            addHeaderCell(table, "Jour", headerFont);
            addHeaderCell(table, "07:00 → 13:00 Matin", headerFont);
            addHeaderCell(table, "13:00 → 19:00 Soir", headerFont);
            addHeaderCell(table, "19:00 → 07:00 Garde", headerFont);

            Map<LocalDate, List<Garde>> byDay = gardes.stream()
                .sorted(Comparator.comparing(Garde::getDebut))
                .collect(Collectors.groupingBy(g -> g.getDebut().toLocalDate()));

            String[] labels = {"Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"};
            for (int i = 0; i < 7; i++) {
                LocalDate day = dateDebut.plusDays(i);
                List<Garde> dayGardes = byDay.getOrDefault(day, new ArrayList<>());

                List<String> matin = dayGardes.stream()
                    .filter(g -> g.getType() == Garde.TypeGarde.JOUR && g.getDebut().toLocalTime().equals(LocalTime.of(7, 0)))
                    .map(this::displayName)
                    .distinct()
                    .sorted()
                    .collect(Collectors.toList());

                List<String> soir = dayGardes.stream()
                    .filter(g -> g.getType() == Garde.TypeGarde.JOUR && g.getDebut().toLocalTime().equals(LocalTime.of(13, 0)))
                    .map(this::displayName)
                    .distinct()
                    .sorted()
                    .collect(Collectors.toList());

                List<String> nuit = dayGardes.stream()
                    .filter(g -> g.getType() == Garde.TypeGarde.NUIT && g.getDebut().toLocalTime().equals(LocalTime.of(19, 0)))
                    .map(this::displayName)
                    .distinct()
                    .sorted()
                    .collect(Collectors.toList());

                addCell(table, labels[i] + "\n" + day, cellFont);
                addCell(table, joinLines(matin), cellFont);
                addCell(table, joinLines(soir), cellFont);
                addCell(table, joinLines(nuit), cellFont);
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération PDF: " + e.getMessage(), e);
        }
    }

    private String displayName(Garde g) {
        User u = g.getUtilisateur();
        if (u == null) return "—";
        String nom = u.getNom() == null ? "" : u.getNom();
        String prenom = u.getPrenom() == null ? "" : u.getPrenom();
        String full = (nom + " " + prenom).trim();
        return full.isBlank() ? (u.getTelephone() == null ? "—" : u.getTelephone()) : full;
    }

    /**
     * Ajoute le logo en haut du PDF s'il existe dans classpath:/images/logo.png
     */
    private void addLogoIfPresent(Document document) {
        String[] paths = { "/images/logo.png", "/images/logo.jpg" };
        for (String path : paths) {
            try (InputStream is = getClass().getResourceAsStream(path)) {
                if (is == null) continue;
                byte[] bytes = is.readAllBytes();
                Image img = Image.getInstance(bytes);
                float maxHeight = 50f;
                if (img.getHeight() > maxHeight) {
                    img.scaleToFit(maxHeight * img.getWidth() / img.getHeight(), maxHeight);
                }
                img.setAlignment(Element.ALIGN_CENTER);
                img.setSpacingAfter(12f);
                document.add(img);
                return;
            } catch (Exception ignored) {
                // essayer le prochain chemin
            }
        }
    }

    private String joinLines(List<String> lines) {
        if (lines == null || lines.isEmpty()) return "—";
        return String.join("\n", lines);
    }

    private void addHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(8f);
        table.addCell(cell);
    }

    private void addCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setVerticalAlignment(Element.ALIGN_TOP);
        cell.setPadding(8f);
        table.addCell(cell);
    }
}
