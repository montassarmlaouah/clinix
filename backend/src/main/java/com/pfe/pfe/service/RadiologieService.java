package com.pfe.pfe.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pfe.pfe.dto.RadiologueWorkspaceStatsDto;
import com.pfe.pfe.model.ImagerieDICOM;
import com.pfe.pfe.model.Medecin;
import com.pfe.pfe.model.Patient;
import com.pfe.pfe.model.Radiologue;
import com.pfe.pfe.model.RapportImagerie;
import com.pfe.pfe.repository.DossierMedicalRepository;
import com.pfe.pfe.repository.ImagerieDICOMRepository;
import com.pfe.pfe.repository.MedecinRepository;
import com.pfe.pfe.repository.PatientRepository;
import com.pfe.pfe.repository.RadiologueRepository;
import com.pfe.pfe.repository.RapportImagerieRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RadiologieService {

    private final ImagerieDICOMRepository imagerieRepository;
    private final RapportImagerieRepository rapportRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final RadiologueRepository radiologueRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final NotificationMetierService notificationMetierService;
    private final RadiologieRapportPdfService radiologieRapportPdfService;

    // ==================== DEMANDES D'EXAMEN ====================

    public ImagerieDICOM demanderExamen(String patientId, String medecinId, String type, String motif) {
        return demanderExamenEtendu(patientId, medecinId, type, motif, null, null, null, "NORMALE");
    }

    /**
     * Demande d'examen (médecin → radiologie) : type, motif, urgence, questions, pièces jointes (références texte).
     */
    public ImagerieDICOM demanderExamenEtendu(
            String patientId,
            String medecinId,
            String type,
            String motif,
            String indicationsCliniques,
            String questionsMedecin,
            String piecesJointes,
            String niveauUrgence) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        Medecin medecin = medecinRepository.findById(medecinId)
                .orElseThrow(() -> new RuntimeException("Médecin non trouvé"));

        var dossier = dossierMedicalRepository.findByPatientId(patientId).orElse(null);

        ImagerieDICOM imagerie = new ImagerieDICOM();
        imagerie.setDate(LocalDate.now());
        imagerie.setType(type != null ? type.trim() : "");
        imagerie.setMotif(motif != null ? motif.trim() : "");
        imagerie.setFichier("");
        imagerie.setStatut(ImagerieDICOM.StatutImagerie.EN_ATTENTE);
        imagerie.setPatient(patient);
        imagerie.setMedecinDemandeur(medecin);
        imagerie.setDossierMedical(dossier);
        imagerie.setIndicationsCliniques(StringUtils.hasText(indicationsCliniques) ? indicationsCliniques.trim() : null);
        imagerie.setQuestionsMedecin(StringUtils.hasText(questionsMedecin) ? questionsMedecin.trim() : null);
        imagerie.setPiecesJointes(StringUtils.hasText(piecesJointes) ? piecesJointes.trim() : null);
        imagerie.setNiveauUrgence(normaliserUrgence(niveauUrgence));
        imagerie.setDateMiseAJour(LocalDateTime.now());

        ImagerieDICOM saved = imagerieRepository.save(imagerie);
        notifierRadiologuesDemandePrioritaire(saved);
        return saved;
    }

    private void notifierRadiologuesDemandePrioritaire(ImagerieDICOM imagerie) {
        String u = imagerie.getNiveauUrgence();
        if (u == null || (!"URGENTE".equalsIgnoreCase(u) && !"HAUTE".equalsIgnoreCase(u))) {
            return;
        }
        String cid = null;
        if (imagerie.getPatient() != null && imagerie.getPatient().getClinique() != null) {
            cid = imagerie.getPatient().getClinique().getId();
        }
        if (!StringUtils.hasText(cid) && imagerie.getMedecinDemandeur() != null
                && imagerie.getMedecinDemandeur().getClinique() != null) {
            cid = imagerie.getMedecinDemandeur().getClinique().getId();
        }
        if (!StringUtils.hasText(cid)) {
            return;
        }
        String nomPatient = "";
        if (imagerie.getPatient() != null) {
            nomPatient = (imagerie.getPatient().getPrenom() != null ? imagerie.getPatient().getPrenom() : "").trim()
                    + " " + (imagerie.getPatient().getNom() != null ? imagerie.getPatient().getNom() : "").trim();
        }
        String msg = "Nouvelle demande " + imagerie.getType() + " — priorité " + u + ". Patient : " + nomPatient.trim();
        for (Radiologue rad : radiologueRepository.findByCliniqueId(cid)) {
            if (Boolean.FALSE.equals(rad.getActif())) {
                continue;
            }
            try {
                notificationMetierService.notifyRadiologueDemandeImageriePrioritaire(rad.getId(), msg);
            } catch (Exception e) {
                log.warn("Notification radiologue demande prioritaire non envoyée: {}", e.getMessage());
            }
        }
    }

    private static String normaliserUrgence(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "NORMALE";
        }
        String u = raw.trim().toUpperCase();
        if ("NORMAL".equals(u)) {
            return "NORMALE";
        }
        if ("URGENT".equals(u)) {
            return "URGENTE";
        }
        return switch (u) {
            case "BASSE", "NORMALE", "HAUTE", "URGENTE" -> u;
            default -> "NORMALE";
        };
    }

    private static int rangUrgence(String niveau) {
        if (niveau == null) {
            return 9;
        }
        return switch (niveau.toUpperCase()) {
            case "URGENTE" -> 0;
            case "HAUTE" -> 1;
            case "NORMALE" -> 2;
            case "BASSE" -> 3;
            default -> 5;
        };
    }

    private static boolean memeClinique(ImagerieDICOM i, String cliniqueId) {
        if (!StringUtils.hasText(cliniqueId)) {
            return false;
        }
        if (i.getPatient() != null && i.getPatient().getClinique() != null
                && cliniqueId.equals(i.getPatient().getClinique().getId())) {
            return true;
        }
        if (i.getMedecinDemandeur() != null && i.getMedecinDemandeur().getClinique() != null
                && cliniqueId.equals(i.getMedecinDemandeur().getClinique().getId())) {
            return true;
        }
        return false;
    }

    /**
     * Tableau de bord radiologue : demandes en attente (même clinique, non assignées) + examens assignés au radiologue.
     */
    public List<ImagerieDICOM> listImagerieWorkspacePourRadiologue(String radiologueId) {
        Radiologue r = radiologueRepository.findById(radiologueId)
                .orElseThrow(() -> new RuntimeException("Radiologue non trouvé"));
        String cid = r.getClinique() != null ? r.getClinique().getId() : null;

        List<ImagerieDICOM> assignes = imagerieRepository.findByRadiologueIdFetched(radiologueId);
        Map<String, ImagerieDICOM> map = new LinkedHashMap<>();
        for (ImagerieDICOM x : assignes) {
            map.put(x.getId(), x);
        }

        if (StringUtils.hasText(cid)) {
            List<ImagerieDICOM> file = imagerieRepository.findEnAttenteSansRadiologueFetched(ImagerieDICOM.StatutImagerie.EN_ATTENTE);
            for (ImagerieDICOM x : file) {
                if (memeClinique(x, cid)) {
                    map.putIfAbsent(x.getId(), x);
                }
            }
        }

        List<ImagerieDICOM> out = new ArrayList<>(map.values());
        out.sort(Comparator
                .comparingInt((ImagerieDICOM i) -> rangUrgence(i.getNiveauUrgence()))
                .thenComparing(ImagerieDICOM::getDate, Comparator.nullsLast(Comparator.reverseOrder())));
        return out;
    }

    /**
     * Compteurs pour le tableau de bord radiologue (sans requête supplémentaire lourde).
     */
    public RadiologueWorkspaceStatsDto workspaceStats(String radiologueId) {
        List<ImagerieDICOM> items = listImagerieWorkspacePourRadiologue(radiologueId);
        long file = items.stream()
                .filter(i -> i.getStatut() == ImagerieDICOM.StatutImagerie.EN_ATTENTE && i.getRadiologue() == null)
                .count();
        long enCours = items.stream()
                .filter(i -> radiologueAssigne(i, radiologueId) && i.getStatut() == ImagerieDICOM.StatutImagerie.EN_COURS)
                .count();
        long aFinaliser = items.stream()
                .filter(i -> radiologueAssigne(i, radiologueId)
                        && i.getStatut() == ImagerieDICOM.StatutImagerie.TERMINE
                        && (i.getRapport() == null || !Boolean.TRUE.equals(i.getRapport().getValide())))
                .count();
        long valides = items.stream()
                .filter(i -> radiologueAssigne(i, radiologueId) && i.getStatut() == ImagerieDICOM.StatutImagerie.VALIDE)
                .count();
        return new RadiologueWorkspaceStatsDto(file, enCours, aFinaliser, valides);
    }

    private static boolean radiologueAssigne(ImagerieDICOM i, String radiologueId) {
        return i.getRadiologue() != null && radiologueId.equals(i.getRadiologue().getId());
    }

    public List<ImagerieDICOM> obtenirDemandesEnAttente() {
        return imagerieRepository.findByStatut(ImagerieDICOM.StatutImagerie.EN_ATTENTE);
    }

    public List<ImagerieDICOM> obtenirDemandesParRadiologue(String radiologueId) {
        return imagerieRepository.findByRadiologueId(radiologueId);
    }

    public List<ImagerieDICOM> obtenirDemandesParMedecin(String medecinId) {
        return imagerieRepository.findByMedecinDemandeurId(medecinId);
    }

    public List<ImagerieDICOM> obtenirImageriesParPatient(String patientId) {
        return imagerieRepository.findByPatientId(patientId);
    }

    // ==================== PRISE EN CHARGE RADIOLOGUE ====================

    public ImagerieDICOM prendreEnCharge(String imagerieId, String radiologueId) {
        ImagerieDICOM imagerie = imagerieRepository.findById(imagerieId)
                .orElseThrow(() -> new RuntimeException("Imagerie non trouvée"));
        Radiologue radiologue = radiologueRepository.findById(radiologueId)
                .orElseThrow(() -> new RuntimeException("Radiologue non trouvé"));

        if (imagerie.getStatut() != ImagerieDICOM.StatutImagerie.EN_ATTENTE) {
            throw new RuntimeException("Cet examen n'est plus en attente");
        }

        String cid = radiologue.getClinique() != null ? radiologue.getClinique().getId() : null;
        if (StringUtils.hasText(cid) && !memeClinique(imagerie, cid)) {
            throw new RuntimeException("Cette demande ne concerne pas votre clinique");
        }

        imagerie.setRadiologue(radiologue);
        imagerie.setStatut(ImagerieDICOM.StatutImagerie.EN_COURS);
        imagerie.setDateMiseAJour(LocalDateTime.now());
        return imagerieRepository.save(imagerie);
    }

    public ImagerieDICOM refuserDemande(String imagerieId, String radiologueId, String motifRefus) {
        ImagerieDICOM imagerie = imagerieRepository.findById(imagerieId)
                .orElseThrow(() -> new RuntimeException("Imagerie non trouvée"));
        Radiologue radiologue = radiologueRepository.findById(radiologueId)
                .orElseThrow(() -> new RuntimeException("Radiologue non trouvé"));

        if (imagerie.getStatut() != ImagerieDICOM.StatutImagerie.EN_ATTENTE) {
            throw new RuntimeException("Seules les demandes en attente peuvent être refusées");
        }
        String cid = radiologue.getClinique() != null ? radiologue.getClinique().getId() : null;
        if (StringUtils.hasText(cid) && !memeClinique(imagerie, cid)) {
            throw new RuntimeException("Cette demande ne concerne pas votre clinique");
        }

        imagerie.setStatut(ImagerieDICOM.StatutImagerie.REFUSE);
        imagerie.setCommentaireStatut(StringUtils.hasText(motifRefus) ? motifRefus.trim() : "Refusé par le service de radiologie");
        imagerie.setRadiologue(null);
        imagerie.setDateMiseAJour(LocalDateTime.now());
        imagerieRepository.save(imagerie);

        Medecin m = imagerie.getMedecinDemandeur();
        if (m != null && StringUtils.hasText(m.getId())) {
            String msg = "Demande d'imagerie (" + imagerie.getType() + ") refusée pour le patient "
                    + (imagerie.getPatient() != null ? imagerie.getPatient().getNom() : "") + " : "
                    + imagerie.getCommentaireStatut();
            try {
                notificationMetierService.notifyMedecinDemandeImagerieRefusee(m.getId(), msg);
            } catch (Exception e) {
                log.warn("Notification refus imagerie non envoyée: {}", e.getMessage());
            }
        }
        return imagerie;
    }

    /**
     * Planifie une date prévue et optionnellement un créneau horaire (même périmètre que le détail radiologue).
     */
    public ImagerieDICOM planifierDatePrevue(String imagerieId, String radiologueId, LocalDate datePrevue, LocalTime heurePrevue) {
        ImagerieDICOM imagerie = obtenirImageriePourRadiologue(imagerieId, radiologueId);
        if (imagerie.getStatut() != ImagerieDICOM.StatutImagerie.EN_ATTENTE
                && imagerie.getStatut() != ImagerieDICOM.StatutImagerie.EN_COURS) {
            throw new RuntimeException("Impossible de planifier cet examen dans son état actuel");
        }
        imagerie.setDatePrevue(datePrevue);
        if (heurePrevue != null) {
            imagerie.setHeurePrevue(heurePrevue);
        }
        imagerie.setDateMiseAJour(LocalDateTime.now());
        return imagerieRepository.save(imagerie);
    }

    /** Ajuste la priorité (NORMALE / HAUTE / URGENTE / BASSE) sur une demande visible par le radiologue. */
    public ImagerieDICOM majNiveauUrgence(String imagerieId, String radiologueId, String niveauUrgence) {
        ImagerieDICOM imagerie = obtenirImageriePourRadiologue(imagerieId, radiologueId);
        if (imagerie.getStatut() == ImagerieDICOM.StatutImagerie.REFUSE
                || imagerie.getStatut() == ImagerieDICOM.StatutImagerie.VALIDE) {
            throw new RuntimeException("Priorité non modifiable pour cet examen");
        }
        imagerie.setNiveauUrgence(normaliserUrgence(niveauUrgence));
        imagerie.setDateMiseAJour(LocalDateTime.now());
        ImagerieDICOM saved = imagerieRepository.save(imagerie);
        notifierRadiologuesDemandePrioritaire(saved);
        return saved;
    }

    /** Type d'examen réellement réalisé (modalité). */
    public ImagerieDICOM majTypeExamenRealise(String imagerieId, String radiologueId, String typeExamenRealise) {
        ImagerieDICOM imagerie = obtenirImageriePourRadiologue(imagerieId, radiologueId);
        if (imagerie.getStatut() == ImagerieDICOM.StatutImagerie.REFUSE
                || imagerie.getStatut() == ImagerieDICOM.StatutImagerie.VALIDE) {
            throw new RuntimeException("Modalité non modifiable pour cet examen");
        }
        imagerie.setTypeExamenRealise(StringUtils.hasText(typeExamenRealise) ? typeExamenRealise.trim() : null);
        imagerie.setDateMiseAJour(LocalDateTime.now());
        return imagerieRepository.save(imagerie);
    }

    /** Ajoute une ligne de référence fichier (DICOM, PDF, URL image…). */
    public ImagerieDICOM ajouterFichierSupplementaire(String imagerieId, String radiologueId, String ligne) {
        ImagerieDICOM imagerie = assertRadiologueAssigne(imagerieId, radiologueId);
        if (!StringUtils.hasText(ligne)) {
            throw new RuntimeException("Référence fichier vide");
        }
        String add = ligne.trim();
        String prev = imagerie.getFichiersSupplementaires() != null ? imagerie.getFichiersSupplementaires().trim() : "";
        imagerie.setFichiersSupplementaires(prev.isEmpty() ? add : prev + "\n" + add);
        imagerie.setDateMiseAJour(LocalDateTime.now());
        return imagerieRepository.save(imagerie);
    }

    public ImagerieDICOM majCommentairesImages(String imagerieId, String radiologueId, String commentaires) {
        ImagerieDICOM imagerie = assertRadiologueAssigne(imagerieId, radiologueId);
        imagerie.setCommentairesImages(StringUtils.hasText(commentaires) ? commentaires.trim() : null);
        imagerie.setDateMiseAJour(LocalDateTime.now());
        return imagerieRepository.save(imagerie);
    }

    public byte[] exporterRapportPdf(String rapportId, String radiologueId) {
        return radiologieRapportPdfService.genererPdf(rapportId, radiologueId);
    }

    /** Protocole d'examen : même périmètre de visibilité que le détail (file ou assigné). */
    public ImagerieDICOM majProtocoleExamen(String imagerieId, String radiologueId, String protocole) {
        ImagerieDICOM imagerie = obtenirImageriePourRadiologue(imagerieId, radiologueId);
        if (imagerie.getStatut() == ImagerieDICOM.StatutImagerie.REFUSE) {
            throw new RuntimeException("Examen refusé, protocole non modifiable");
        }
        imagerie.setProtocoleExamen(StringUtils.hasText(protocole) ? protocole.trim() : null);
        imagerie.setDateMiseAJour(LocalDateTime.now());
        return imagerieRepository.save(imagerie);
    }

    /**
     * Historique imagerie d'un patient (même clinique que le radiologue), du plus récent au plus ancien.
     */
    public List<ImagerieDICOM> listHistoriqueImageriesPatientPourRadiologue(String radiologueId, String patientId) {
        Radiologue r = radiologueRepository.findById(radiologueId)
                .orElseThrow(() -> new RuntimeException("Radiologue non trouvé"));
        String cid = r.getClinique() != null ? r.getClinique().getId() : null;
        if (!StringUtils.hasText(cid)) {
            throw new RuntimeException("Radiologue sans clinique : historique indisponible");
        }
        Patient p = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        if (p.getClinique() == null || !cid.equals(p.getClinique().getId())) {
            throw new RuntimeException("Patient hors de votre clinique");
        }
        List<ImagerieDICOM> list = new ArrayList<>(imagerieRepository.findByPatientId(patientId));
        list.sort(Comparator.comparing(ImagerieDICOM::getDate, Comparator.nullsLast(Comparator.reverseOrder())));
        return list;
    }

    public ImagerieDICOM majNotesCooperationPatient(String imagerieId, String radiologueId, String notes) {
        ImagerieDICOM imagerie = assertRadiologueAssigne(imagerieId, radiologueId);
        imagerie.setNotesCooperationPatient(StringUtils.hasText(notes) ? notes.trim() : null);
        imagerie.setDateMiseAJour(LocalDateTime.now());
        return imagerieRepository.save(imagerie);
    }

    private ImagerieDICOM assertRadiologueAssigne(String imagerieId, String radiologueId) {
        ImagerieDICOM imagerie = imagerieRepository.findById(imagerieId)
                .orElseThrow(() -> new RuntimeException("Imagerie non trouvée"));
        if (imagerie.getRadiologue() == null || !Objects.equals(imagerie.getRadiologue().getId(), radiologueId)) {
            throw new RuntimeException("Cet examen n'est pas assigné à ce radiologue");
        }
        return imagerie;
    }

    public ImagerieDICOM terminerExamen(String imagerieId, String fichier) {
        ImagerieDICOM imagerie = imagerieRepository.findById(imagerieId)
                .orElseThrow(() -> new RuntimeException("Imagerie non trouvée"));

        if (imagerie.getStatut() != ImagerieDICOM.StatutImagerie.EN_COURS) {
            throw new RuntimeException("Cet examen n'est pas en cours");
        }

        imagerie.setFichier(fichier != null ? fichier : "");
        imagerie.setStatut(ImagerieDICOM.StatutImagerie.TERMINE);
        imagerie.setDateMiseAJour(LocalDateTime.now());
        return imagerieRepository.save(imagerie);
    }

    /** Termine l'examen en vérifiant que le radiologue connecté est bien assigné. */
    public ImagerieDICOM terminerExamenPourRadiologue(String imagerieId, String radiologueId, String fichier) {
        ImagerieDICOM imagerie = assertRadiologueAssigne(imagerieId, radiologueId);
        if (imagerie.getStatut() != ImagerieDICOM.StatutImagerie.EN_COURS) {
            throw new RuntimeException("Cet examen n'est pas en cours");
        }
        imagerie.setFichier(fichier != null ? fichier : "");
        imagerie.setStatut(ImagerieDICOM.StatutImagerie.TERMINE);
        imagerie.setDateMiseAJour(LocalDateTime.now());
        return imagerieRepository.save(imagerie);
    }

    // ==================== RAPPORT ====================

    public RapportImagerie creerRapport(
            String imagerieId,
            String radiologueId,
            String observations,
            String analyse,
            String conclusion,
            String recommandations,
            String diagnosticDifferentiel,
            String signesCliniquesNotables) {
        ImagerieDICOM imagerie = imagerieRepository.findById(imagerieId)
                .orElseThrow(() -> new RuntimeException("Imagerie non trouvée"));
        Radiologue radiologue = radiologueRepository.findById(radiologueId)
                .orElseThrow(() -> new RuntimeException("Radiologue non trouvé"));

        if (imagerie.getRadiologue() == null || !radiologueId.equals(imagerie.getRadiologue().getId())) {
            throw new RuntimeException("Seul le radiologue assigné peut rédiger le rapport");
        }

        if (rapportRepository.findByImagerieId(imagerieId).isPresent()) {
            throw new RuntimeException("Un rapport existe déjà pour cet examen");
        }

        RapportImagerie rapport = new RapportImagerie();
        rapport.setDate(LocalDate.now());
        rapport.setObservations(observations);
        rapport.setAnalyse(analyse);
        rapport.setConclusion(conclusion);
        rapport.setRecommandations(recommandations);
        rapport.setValide(false);
        rapport.setImagerie(imagerie);
        rapport.setRadiologue(radiologue);

        return rapportRepository.save(rapport);
    }

    public RapportImagerie mettreAJourRapportBrouillon(
            String rapportId,
            String radiologueId,
            String observations,
            String analyse,
            String conclusion,
            String recommandations,
            String diagnosticDifferentiel,
            String signesCliniquesNotables) {
        RapportImagerie rapport = rapportRepository.findById(rapportId)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé"));
        if (!rapport.getRadiologue().getId().equals(radiologueId)) {
            throw new RuntimeException("Seul le radiologue auteur peut modifier ce rapport");
        }
        if (Boolean.TRUE.equals(rapport.getValide())) {
            throw new RuntimeException("Le rapport est déjà validé");
        }
        if (observations != null) {
            rapport.setObservations(observations);
        }
        if (analyse != null) {
            rapport.setAnalyse(analyse);
        }
        if (conclusion != null) {
            rapport.setConclusion(conclusion);
        }
        if (recommandations != null) {
            rapport.setRecommandations(recommandations);
        }
        if (diagnosticDifferentiel != null) {
            rapport.setDiagnosticDifferentiel(StringUtils.hasText(diagnosticDifferentiel) ? diagnosticDifferentiel.trim() : null);
        }
        if (signesCliniquesNotables != null) {
            rapport.setSignesCliniquesNotables(StringUtils.hasText(signesCliniquesNotables) ? signesCliniquesNotables.trim() : null);
        }
        return rapportRepository.save(rapport);
    }

    public RapportImagerie validerRapport(String rapportId, String radiologueId) {
        RapportImagerie rapport = rapportRepository.findById(rapportId)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé"));

        if (!rapport.getRadiologue().getId().equals(radiologueId)) {
            throw new RuntimeException("Seul le radiologue auteur peut valider ce rapport");
        }

        rapport.setValide(true);
        rapport.setDateSignatureElectronique(LocalDateTime.now());

        ImagerieDICOM imagerie = rapport.getImagerie();
        imagerie.setStatut(ImagerieDICOM.StatutImagerie.VALIDE);
        imagerie.setDateMiseAJour(LocalDateTime.now());
        imagerieRepository.save(imagerie);

        RapportImagerie saved = rapportRepository.save(rapport);

        Medecin m = imagerie.getMedecinDemandeur();
        if (m != null && StringUtils.hasText(m.getId())) {
            String nomPatient = imagerie.getPatient() != null
                    ? (imagerie.getPatient().getPrenom() + " " + imagerie.getPatient().getNom()).trim()
                    : "";
            String msg = "Le rapport d'imagerie (" + imagerie.getType() + ") pour " + nomPatient + " est disponible et validé.";
            try {
                notificationMetierService.notifyMedecinRapportImagerieDisponible(m.getId(), msg);
            } catch (Exception e) {
                log.warn("Notification rapport imagerie non envoyée: {}", e.getMessage());
            }
        }

        return saved;
    }

    public RapportImagerie obtenirRapportParImagerie(String imagerieId) {
        return rapportRepository.findByImagerieId(imagerieId)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé pour cet examen"));
    }

    public java.util.Optional<RapportImagerie> trouverRapportParImagerie(String imagerieId) {
        return rapportRepository.findByImagerieId(imagerieId);
    }

    public List<RapportImagerie> obtenirRapportsParRadiologue(String radiologueId) {
        return rapportRepository.findByRadiologueId(radiologueId);
    }

    public ImagerieDICOM obtenirImagerieParId(String id) {
        return imagerieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Imagerie non trouvée"));
    }

    /**
     * Détail d'une imagerie pour le radiologue : assignée à lui, ou en attente sans assignation (même clinique).
     */
    public ImagerieDICOM obtenirImageriePourRadiologue(String imagerieId, String radiologueId) {
        ImagerieDICOM i = obtenirImagerieParId(imagerieId);
        Radiologue r = radiologueRepository.findById(radiologueId)
                .orElseThrow(() -> new RuntimeException("Radiologue non trouvé"));
        if (i.getRadiologue() != null && radiologueId.equals(i.getRadiologue().getId())) {
            return i;
        }
        String cid = r.getClinique() != null ? r.getClinique().getId() : null;
        if (i.getStatut() == ImagerieDICOM.StatutImagerie.EN_ATTENTE && i.getRadiologue() == null
                && StringUtils.hasText(cid) && memeClinique(i, cid)) {
            return i;
        }
        throw new RuntimeException("Accès non autorisé à cet examen");
    }
}
