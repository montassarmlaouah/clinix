package com.pfe.pfe.service;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Predicate;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pfe.pfe.model.ChefPersonnel;
import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.model.Infirmier;
import com.pfe.pfe.model.Medecin;
import com.pfe.pfe.model.Pharmacien;
import com.pfe.pfe.model.Radiologue;
import com.pfe.pfe.model.Role;
import com.pfe.pfe.model.Secretaire;
import com.pfe.pfe.model.TechnicienMaintenance;
import com.pfe.pfe.model.User;
import com.pfe.pfe.repository.ChefPersonnelRepository;
import com.pfe.pfe.repository.CliniqueRepository;
import com.pfe.pfe.repository.InfirmierRepository;
import com.pfe.pfe.repository.MedecinRepository;
import com.pfe.pfe.repository.PharmacienRepository;
import com.pfe.pfe.repository.RadiologueRepository;
import com.pfe.pfe.repository.RoleRepository;
import com.pfe.pfe.repository.SecretaireRepository;
import com.pfe.pfe.repository.TechnicienMaintenanceRepository;
import com.pfe.pfe.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service unifié pour la gestion du personnel de la clinique.
 * L'admin crée le compte : mot de passe généré et envoyé par SMS (TunisieSMS).
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PersonnelService {
    
    private final MedecinRepository medecinRepository;
    private final InfirmierRepository infirmierRepository;
    private final RadiologueRepository radiologueRepository;
    private final PharmacienRepository pharmacienRepository;
    private final SecretaireRepository secretaireRepository;
    private final ChefPersonnelRepository chefPersonnelRepository;
    private final TechnicienMaintenanceRepository technicienMaintenanceRepository;
    private final CliniqueRepository cliniqueRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final NotificationMetierService notificationMetierService;
    private final PasswordGeneratorService passwordGenerator;
    private final TunisieSmsService tunisieSmsService;
    private final PersonnelPdfInvitationService personnelPdfInvitationService;
    private final PersonnelEmailService personnelEmailService;

    /**
     * Étape 1: Admin Clinique crée un membre du personnel avec téléphone uniquement
     */
    public Map<String, Object> creerPersonnel(CreerPersonnelDTO dto, String cliniqueId) {
        PersonnelCredentialsMode mode = PersonnelCredentialsMode.fromDto(dto.getModeEnvoiCredentials());
        validerModeEtChamps(dto, mode);

        if (dto.getRole() != null && "MEDECIN".equalsIgnoreCase(dto.getRole().trim())
                && StringUtils.hasText(dto.getMedecinExistantId())) {
            return lierMedecinExistantEtEnvoyerCredentials(dto, cliniqueId, mode);
        }

        validerCinObligatoireNouveauCompte(dto);

        String[] nomPrenom = resoudreNomPrenom(dto);
        String nomFinal = nomPrenom[0];
        String prenomFinal = nomPrenom[1];

        String telephone = tunisieSmsService.normalizeInternationalTunisia(dto.getTelephone());
        if (!StringUtils.hasText(telephone) || telephone.length() < 11) {
            throw new RuntimeException("Numéro de téléphone invalide (format tunisien attendu, ex. 216XXXXXXXX)");
        }
        if (userRepository.findByTelephone(telephone).isPresent()) {
            throw new RuntimeException("Un utilisateur avec ce numéro de téléphone existe déjà");
        }

        if (StringUtils.hasText(dto.getNumeroPieceIdentite())) {
            String cin = dto.getNumeroPieceIdentite().trim();
            if (userRepository.existsByNumeroPieceIdentite(cin)) {
                throw new RuntimeException("Ce numéro de carte d'identité est déjà enregistré.");
            }
        }

        Clinique clinique = null;
        if (cliniqueId != null && !cliniqueId.trim().isEmpty()) {
            clinique = cliniqueRepository.findById(cliniqueId)
                .orElseThrow(() -> new RuntimeException("Clinique non trouvée"));
        }

        String roleNom = dto.getRole().toUpperCase();
        User personnel;
        
        switch (roleNom) {
            case "MEDECIN":
                Medecin medecin = new Medecin();
                medecin.setTelephone(telephone);
                medecin.setNom(nomFinal);
                medecin.setPrenom(prenomFinal);
                medecin.setSpecialite(dto.getSpecialite() != null && !dto.getSpecialite().trim().isEmpty()
                        ? dto.getSpecialite().trim()
                        : "Non spécifiée");
                medecin.setNumeroOrdre(genererNumeroOrdreUnique("MED", medecinRepository.count(), medecinRepository::existsByNumeroOrdre));
                if (clinique != null) {
                    medecin.setClinique(clinique);
                }
                medecin.setDateCreation(LocalDateTime.now());
                medecin.setActif(false);
                personnel = medecinRepository.save(medecin);
                break;
                
            case "INFIRMIER":
                if (clinique == null) {
                    throw new RuntimeException("La clinique est obligatoire pour ce rôle");
                }
                Infirmier infirmier = new Infirmier();
                infirmier.setTelephone(telephone);
                infirmier.setNom(nomFinal);
                infirmier.setPrenom(prenomFinal);
                infirmier.setNumeroOrdre(genererNumeroOrdreUnique("INF", infirmierRepository.count(), infirmierRepository::existsByNumeroOrdre));
                infirmier.setClinique(clinique);
                infirmier.setDateCreation(LocalDateTime.now());
                infirmier.setActif(false);
                personnel = infirmierRepository.save(infirmier);
                break;
                
            case "RADIOLOGUE":
                if (clinique == null) {
                    throw new RuntimeException("La clinique est obligatoire pour ce rôle");
                }
                Radiologue radiologue = new Radiologue();
                radiologue.setTelephone(telephone);
                radiologue.setNom(nomFinal);
                radiologue.setPrenom(prenomFinal);
                radiologue.setNumeroOrdre(genererNumeroOrdreUnique("RAD", radiologueRepository.count(), radiologueRepository::existsByNumeroOrdre));
                radiologue.setClinique(clinique);
                radiologue.setDateCreation(LocalDateTime.now());
                radiologue.setActif(false);
                personnel = radiologueRepository.save(radiologue);
                break;
                
            case "PHARMACIEN":
                if (clinique == null) {
                    throw new RuntimeException("La clinique est obligatoire pour ce rôle");
                }
                Pharmacien pharmacien = new Pharmacien();
                pharmacien.setTelephone(telephone);
                pharmacien.setNom(nomFinal);
                pharmacien.setPrenom(prenomFinal);
                pharmacien.setNumeroOrdre(genererNumeroOrdreUnique("PHA", pharmacienRepository.count(), pharmacienRepository::existsByNumeroOrdre));
                pharmacien.setClinique(clinique);
                pharmacien.setDateCreation(LocalDateTime.now());
                pharmacien.setActif(false);
                personnel = pharmacienRepository.save(pharmacien);
                break;
                
            case "SECRETAIRE":
                if (clinique == null) {
                    throw new RuntimeException("La clinique est obligatoire pour ce rôle");
                }
                Secretaire secretaire = new Secretaire();
                secretaire.setTelephone(telephone);
                secretaire.setNom(dto.getNom());
                secretaire.setPrenom(dto.getPrenom());
                secretaire.setNumeroOrdre(genererNumeroOrdreUnique("SEC", secretaireRepository.count(), secretaireRepository::existsByNumeroOrdre));
                secretaire.setClinique(clinique);
                secretaire.setDateCreation(LocalDateTime.now());
                secretaire.setActif(false);
                personnel = secretaireRepository.save(secretaire);
                break;
                
            case "CHEF_PERSONNEL":
                if (clinique == null) {
                    throw new RuntimeException("La clinique est obligatoire pour ce rôle");
                }
                ChefPersonnel chef = new ChefPersonnel();
                chef.setTelephone(telephone);
                chef.setNom(nomFinal);
                chef.setPrenom(prenomFinal);
                chef.setNumeroOrdre(genererNumeroOrdreUnique("CHF", chefPersonnelRepository.count(), chefPersonnelRepository::existsByNumeroOrdre));
                chef.setClinique(clinique);
                chef.setDateCreation(LocalDateTime.now());
                chef.setActif(false);
                personnel = chefPersonnelRepository.save(chef);
                break;
                
            case "TECHNICIEN_MAINTENANCE":
                if (clinique == null) {
                    throw new RuntimeException("La clinique est obligatoire pour ce rôle");
                }
                TechnicienMaintenance technicien = new TechnicienMaintenance();
                technicien.setTelephone(telephone);
                technicien.setNom(nomFinal);
                technicien.setPrenom(prenomFinal);
                technicien.setNumeroOrdre(genererNumeroOrdreUnique("TEC", technicienMaintenanceRepository.count(), technicienMaintenanceRepository::existsByNumeroOrdre));
                technicien.setClinique(clinique);
                technicien.setDateCreation(LocalDateTime.now());
                technicien.setActif(false);
                personnel = technicienMaintenanceRepository.save(technicien);
                break;
                
            default:
                throw new RuntimeException("Rôle non reconnu: " + roleNom);
        }

        // Assigner le rôle
        Role role = roleRepository.findByNom("ROLE_" + roleNom)
            .orElseGet(() -> {
                Role newRole = new Role();
                newRole.setNom("ROLE_" + roleNom);
                newRole.setDescription("Rôle " + roleNom);
                return roleRepository.save(newRole);
            });
        personnel.getRoles().add(role);

        String rawPassword = passwordGenerator.generate();
        personnel.setMotDePasse(passwordEncoder.encode(rawPassword));
        personnel.setActif(true);

        appliquerEmailEtCin(personnel, dto);

        /* PDF + e-mail : plus de code dans le PDF ; onboarding par code désactivé à la création. */
        personnel.setOnboardingCodeHash(null);
        personnel.setOnboardingCodeExpiresAt(null);

        personnel = userRepository.save(personnel);

        // Notifications métier : médecin reçoit une notification de création de compte
        if ("MEDECIN".equals(roleNom)) {
            try {
                notificationMetierService.notifyMedecinCreationCompte(null, personnel.getId(),
                        clinique != null ? clinique.getNom() : null);
            } catch (Exception e) {
                log.warn("Notification création compte médecin non envoyée: {}", e.getMessage());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", personnel.getId());
        response.put("telephone", personnel.getTelephone());
        response.put("role", roleNom);
        response.put("cliniqueId", clinique != null ? clinique.getId() : null);
        response.put("modeEnvoiCredentials", mode.name());

        envoyerIdentifiants(personnel, clinique, roleNom, rawPassword, mode, response,
                StringUtils.hasText(dto.getEmailCopieInvitation()) ? dto.getEmailCopieInvitation().trim() : null);

        return response;
    }

    private String[] resoudreNomPrenom(CreerPersonnelDTO dto) {
        if (Boolean.TRUE.equals(dto.getProfilInvitationMinimal())) {
            return new String[] { "À compléter", "Profil" };
        }
        if (!StringUtils.hasText(dto.getNom()) || !StringUtils.hasText(dto.getPrenom())) {
            throw new RuntimeException(
                    "Le nom et le prénom sont obligatoires (ou cochez « invitation sans profil complet »).");
        }
        return new String[] { dto.getNom().trim(), dto.getPrenom().trim() };
    }

    /**
     * Valide les champs requis selon le mode d'envoi des identifiants.
     * L'absence de configuration SMTP ne bloque plus la création : si l'e-mail ne peut pas partir,
     * {@link #envoyerIdentifiants} joint un PDF d'identifiants à la réponse ({@code pdfBase64}) et renseigne {@code mailSkipped}.
     */
    private void validerModeEtChamps(CreerPersonnelDTO dto, PersonnelCredentialsMode mode) {
        if (mode == PersonnelCredentialsMode.EMAIL || mode == PersonnelCredentialsMode.PDF_CODE) {
            if (!StringUtils.hasText(dto.getEmail())) {
                throw new RuntimeException("L'adresse e-mail est obligatoire pour le mode " + mode.name() + ".");
            }
        }
    }

    /** CIN obligatoire pour toute création de compte neuf (hors rattachement médecin existant). */
    private void validerCinObligatoireNouveauCompte(CreerPersonnelDTO dto) {
        if (!StringUtils.hasText(dto.getNumeroPieceIdentite()) || dto.getNumeroPieceIdentite().trim().isEmpty()) {
            throw new RuntimeException("Le numéro de carte d'identité (CIN) est obligatoire.");
        }
    }

    private void appliquerEmailEtCin(User personnel, CreerPersonnelDTO dto) {
        if (StringUtils.hasText(dto.getEmail())) {
            personnel.setEmail(dto.getEmail().trim());
        }
        if (StringUtils.hasText(dto.getNumeroPieceIdentite())) {
            personnel.setNumeroPieceIdentite(dto.getNumeroPieceIdentite().trim());
        }
    }

    private Map<String, Object> lierMedecinExistantEtEnvoyerCredentials(CreerPersonnelDTO dto, String cliniqueId,
            PersonnelCredentialsMode mode) {
        Clinique clinique = null;
        if (cliniqueId != null && !cliniqueId.trim().isEmpty()) {
            clinique = cliniqueRepository.findById(cliniqueId.trim())
                    .orElseThrow(() -> new RuntimeException("Clinique non trouvée"));
        }

        Medecin m = medecinRepository.findById(dto.getMedecinExistantId().trim())
                .orElseThrow(() -> new RuntimeException("Médecin introuvable"));

        if (StringUtils.hasText(dto.getNumeroPieceIdentite())) {
            String cin = dto.getNumeroPieceIdentite().trim();
            if (userRepository.existsByNumeroPieceIdentiteAndIdNot(cin, m.getId())) {
                throw new RuntimeException("Ce numéro de carte d'identité est déjà utilisé par un autre utilisateur.");
            }
            m.setNumeroPieceIdentite(cin);
        }
        if (StringUtils.hasText(dto.getEmail())) {
            m.setEmail(dto.getEmail().trim());
        }
        if (clinique != null) {
            m.setClinique(clinique);
        }
        if (StringUtils.hasText(dto.getSpecialite())) {
            m.setSpecialite(dto.getSpecialite().trim());
        }

        String rawPassword = passwordGenerator.generate();
        m.setMotDePasse(passwordEncoder.encode(rawPassword));
        m.setActif(true);

        m.setOnboardingCodeHash(null);
        m.setOnboardingCodeExpiresAt(null);

        userRepository.save(m);

        Map<String, Object> response = new HashMap<>();
        response.put("id", m.getId());
        response.put("telephone", m.getTelephone());
        response.put("role", "MEDECIN");
        response.put("cliniqueId", clinique != null ? clinique.getId() : null);
        response.put("medecinRattache", true);
        response.put("modeEnvoiCredentials", mode.name());

        envoyerIdentifiants(m, clinique, "MEDECIN", rawPassword, mode, response,
                StringUtils.hasText(dto.getEmailCopieInvitation()) ? dto.getEmailCopieInvitation().trim() : null);
        return response;
    }

    /** PDF d'identifiants (téléphone + mot de passe) encodé en base64 — utilisé si SMTP absent (mode EMAIL). */
    private void joindrePdfIdentifiantsReponse(User personnel, String roleNom, String rawPassword, Map<String, Object> response) {
        String nomAffiche = (personnel.getPrenom() != null ? personnel.getPrenom() + " " : "")
                + (personnel.getNom() != null ? personnel.getNom() : "");
        if (nomAffiche.trim().isEmpty()) {
            nomAffiche = personnel.getTelephone();
        }
        byte[] pdf = personnelPdfInvitationService.buildIdentifiantsPdf(
                nomAffiche.trim(),
                personnel.getTelephone(),
                rawPassword,
                roleNom);
        response.put("pdfBase64", Base64.getEncoder().encodeToString(pdf));
        response.put("pdfFileName", "clinux-identifiants-clinix.pdf");
    }

    private void envoyerIdentifiants(User personnel, Clinique clinique, String roleNom, String rawPassword,
            PersonnelCredentialsMode mode, Map<String, Object> response, String emailCopieBcc) {
        String nomAffiche = (personnel.getPrenom() != null ? personnel.getPrenom() + " " : "")
                + (personnel.getNom() != null ? personnel.getNom() : "");
        if (nomAffiche.trim().isEmpty()) {
            nomAffiche = personnel.getTelephone();
        }
        String roleLibelle = roleLibelleFrancais(roleNom);
        String cliniqueNom = clinique != null ? clinique.getNom() : null;

        switch (mode) {
            case TUNISIE_SMS -> {
                String messageSms = "Clinux - Bienvenue " + nomAffiche
                        + ". Compte " + roleNom + " pret. ID: " + personnel.getTelephone()
                        + " MDP: " + rawPassword + ". App Clinux.";
                try {
                    tunisieSmsService.sendSmsForClinique(clinique != null ? clinique.getId() : null,
                            personnel.getTelephone(), messageSms);
                } catch (Exception e) {
                    log.warn("SMS TunisieSMS non envoye pour personnel {} : {}", personnel.getTelephone(), e.getMessage());
                }
                response.put("message", "Personnel créé avec succès. Mot de passe envoyé par SMS (TunisieSMS).");
            }
            case EMAIL -> {
                String plain = buildBienvenuePlain(nomAffiche.trim(), roleLibelle, personnel.getTelephone(), rawPassword,
                        cliniqueNom, false);
                String html = buildBienvenueHtml(nomAffiche.trim(), roleLibelle, personnel.getTelephone(), rawPassword,
                        cliniqueNom, false);
                if (personnelEmailService.isMailConfigured()) {
                    personnelEmailService.sendHtmlTextEmail(personnel.getEmail(), emailCopieBcc,
                            "CLINIX — Bienvenue, vos identifiants", html, plain);
                    response.put("message", "Personnel créé. Identifiants envoyés par e-mail.");
                } else {
                    log.warn(
                            "SMTP non configuré (spring.mail.* / app.mail.from) : e-mail non envoyé pour {} — PDF d'identifiants joint à la réponse.",
                            personnel.getEmail());
                    joindrePdfIdentifiantsReponse(personnel, roleNom, rawPassword, response);
                    response.put("mailSkipped", Boolean.TRUE);
                    response.put("mailSkippedReason",
                            "E-mail non envoyé : SMTP non configuré. Renseignez spring.mail.username, spring.mail.password et app.mail.from (voir application.properties), ou téléchargez le PDF ci-dessous.");
                    response.put("message",
                            "Personnel créé. E-mail non envoyé (serveur mail non configuré). Utilisez le PDF d'identifiants fourni dans la réponse.");
                }
            }
            case PDF_CODE -> {
                byte[] pdf = personnelPdfInvitationService.buildIdentifiantsPdf(
                        nomAffiche.trim(),
                        personnel.getTelephone(),
                        rawPassword,
                        roleNom);
                String plain = buildBienvenuePlain(nomAffiche.trim(), roleLibelle, personnel.getTelephone(), rawPassword,
                        cliniqueNom, true);
                String html = buildBienvenueHtml(nomAffiche.trim(), roleLibelle, personnel.getTelephone(), rawPassword,
                        cliniqueNom, true);
                response.put("pdfBase64", Base64.getEncoder().encodeToString(pdf));
                response.put("pdfFileName", "clinux-identifiants-clinix.pdf");
                if (personnelEmailService.isMailConfigured()) {
                    personnelEmailService.sendHtmlEmailWithPdfAttachment(personnel.getEmail(), emailCopieBcc,
                            "CLINIX — Vos identifiants (PDF)", html, plain, pdf, "clinux-identifiants-clinix.pdf");
                    response.put("message",
                            "Personnel créé. Un e-mail avec le PDF (téléphone et mot de passe uniquement) a été envoyé. "
                                    + "Vous pouvez aussi enregistrer le PDF depuis la réponse API.");
                } else {
                    log.warn(
                            "SMTP non configuré : e-mail avec PDF non envoyé pour {} — PDF disponible dans la réponse.",
                            personnel.getEmail());
                    response.put("mailSkipped", Boolean.TRUE);
                    response.put("mailSkippedReason",
                            "E-mail non envoyé : SMTP non configuré. Le PDF est disponible dans la réponse (pdfBase64).");
                    response.put("message",
                            "Personnel créé. E-mail non envoyé (serveur mail non configuré). Le PDF d'identifiants est disponible dans la réponse.");
                }
            }
            case PDF_ONLY -> {
                byte[] pdf = personnelPdfInvitationService.buildIdentifiantsPdf(
                        nomAffiche.trim(),
                        personnel.getTelephone(),
                        rawPassword,
                        roleNom);
                response.put("pdfBase64", Base64.getEncoder().encodeToString(pdf));
                response.put("pdfFileName", "clinux-identifiants-clinix.pdf");
                response.put("message",
                        "Personnel créé. PDF d’identifiants généré (aucun e-mail envoyé). Téléchargez ou ouvrez le fichier depuis l’interface.");
            }
            default -> response.put("message", "Personnel créé.");
        }
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
            default -> roleNom;
        };
    }

    private static String buildBienvenuePlain(String nomAffiche, String roleLibelle, String telephone, String rawPassword,
            String cliniqueNom, boolean avecPdf) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bonjour ").append(nomAffiche).append(",\n\n");
        sb.append("Bienvenue sur CLINIX. Votre compte (").append(roleLibelle).append(") est prêt.\n");
        if (StringUtils.hasText(cliniqueNom)) {
            sb.append("Clinique : ").append(cliniqueNom.trim()).append("\n");
        }
        sb.append("\nIdentifiant (téléphone) : ").append(telephone).append("\n");
        sb.append("Mot de passe provisoire : ").append(rawPassword).append("\n\n");
        if (avecPdf) {
            sb.append("Le PDF joint contient uniquement votre téléphone (identifiant) et votre mot de passe provisoire.\n");
            sb.append("Un code de vérification pourra vous être demandé par l'application lors d'un changement de mot de passe "
                    + "ou via « mot de passe oublié » — il n'est pas imprimé dans ce PDF.\n\n");
        }
        sb.append("Connectez-vous à l'application puis changez votre mot de passe.\n\n— CLINIX");
        return sb.toString();
    }

    private static String buildBienvenueHtml(String nomAffiche, String roleLibelle, String telephone, String rawPassword,
            String cliniqueNom, boolean avecPdf) {
        String cliniqueBlock = StringUtils.hasText(cliniqueNom)
                ? "<p style=\"margin:12px 0 0;color:#6c757d;font-size:13px;\">Clinique associée</p>"
                        + "<p style=\"margin:4px 0 16px;font-size:16px;font-weight:700;color:#0066cc;\">"
                        + escapeHtml(cliniqueNom.trim()) + "</p>"
                : "";
        String pdfNote = avecPdf
                ? "<p style=\"margin:16px 0 0;font-size:14px;line-height:1.55;color:#333;\">Un <strong>document PDF</strong> est joint : "
                        + "il reprend <strong>uniquement</strong> votre numéro de téléphone (identifiant) et votre "
                        + "<strong>mot de passe provisoire</strong> (aucun code de vérification dans le fichier).</p>"
                        + "<p style=\"margin:10px 0 0;font-size:13px;line-height:1.5;color:#6c757d;\">"
                        + "Lors d'un <strong>changement de mot de passe</strong> ou de la procédure "
                        + "<strong>« mot de passe oublié »</strong>, l'application pourra vous envoyer ou vous demander un "
                        + "<strong>code de vérification</strong> séparé.</p>"
                : "";
        return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head><body style=\"margin:0;padding:24px;"
                + "background:#f4f6f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;\">"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tr><td align=\"center\">"
                + "<table role=\"presentation\" width=\"600\" cellspacing=\"0\" cellpadding=\"0\" "
                + "style=\"max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;"
                + "box-shadow:0 8px 24px rgba(0,0,0,.08);\">"
                + "<tr><td style=\"background:linear-gradient(90deg,#0066cc,#0099cc);padding:20px 24px;\">"
                + "<div style=\"color:#fff;font-size:20px;font-weight:700;\">CLINIX</div>"
                + "<div style=\"color:#e8f4ff;font-size:13px;margin-top:4px;\">Bienvenue sur la plateforme</div></td></tr>"
                + "<tr><td style=\"padding:24px 28px 8px;\">"
                + "<p style=\"margin:0;font-size:16px;color:#212529;\">Bonjour <strong>" + escapeHtml(nomAffiche)
                + "</strong>,</p>"
                + "<p style=\"margin:12px 0 0;font-size:15px;line-height:1.5;color:#495057;\">"
                + "Votre compte <strong>" + escapeHtml(roleLibelle) + "</strong> a été créé par votre administrateur.</p>"
                + cliniqueBlock
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" "
                + "style=\"margin-top:20px;border:1px solid #e9ecef;border-radius:8px;background:#f8f9fa;\">"
                + "<tr><td style=\"padding:16px 18px;\">"
                + "<div style=\"font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6c757d;\">"
                + "Identifiant</div>"
                + "<div style=\"font-size:16px;font-weight:600;color:#212529;margin-top:4px;\">"
                + escapeHtml(telephone) + "</div>"
                + "<div style=\"font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6c757d;"
                + "margin-top:14px;\">Mot de passe provisoire</div>"
                + "<div style=\"font-size:16px;font-weight:600;color:#212529;margin-top:4px;font-family:monospace;\">"
                + escapeHtml(rawPassword) + "</div>"
                + "</td></tr></table>"
                + pdfNote
                + "<p style=\"margin:24px 0 0;font-size:14px;color:#495057;\">"
                + "Pour votre sécurité, changez ce mot de passe dès votre première connexion.</p>"
                + "</td></tr><tr><td style=\"padding:16px 28px 24px;border-top:1px solid #e9ecef;"
                + "font-size:12px;color:#adb5bd;\">Message automatique — ne pas répondre.</td></tr>"
                + "</table></td></tr></table></body></html>";
    }

    private static String escapeHtml(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private void verifierCodeInvitationSiRequis(User user, RegisterPersonnelDTO dto) {
        if (user.getOnboardingCodeHash() == null || user.getOnboardingCodeHash().isBlank()) {
            return;
        }
        if (!StringUtils.hasText(dto.getCodeInvitationPdf())) {
            throw new RuntimeException(
                    "Un code d'invitation PDF est requis pour ce compte (voir le document reçu par e-mail).");
        }
        if (user.getOnboardingCodeExpiresAt() != null && LocalDateTime.now().isAfter(user.getOnboardingCodeExpiresAt())) {
            throw new RuntimeException("Le code d'invitation a expiré. Contactez votre administrateur.");
        }
        if (!passwordEncoder.matches(dto.getCodeInvitationPdf().trim(), user.getOnboardingCodeHash())) {
            throw new RuntimeException("Code d'invitation invalide.");
        }
        user.setOnboardingCodeHash(null);
        user.setOnboardingCodeExpiresAt(null);
    }

    /**
     * Confirme le code figurant dans le PDF (mode PDF_CODE), après connexion avec le mot de passe provisoire.
     */
    public void confirmerCodeInvitationPdf(String telephone, String role, String code) {
        String telNorm = tunisieSmsService.normalizeInternationalTunisia(telephone);
        if (!StringUtils.hasText(telNorm)) {
            throw new RuntimeException("Téléphone invalide");
        }
        RegisterPersonnelDTO dto = new RegisterPersonnelDTO();
        dto.setCodeInvitationPdf(code);
        User u = chargerUtilisateurParTelephoneEtRole(telNorm, role.toUpperCase());
        verifierCodeInvitationSiRequis(u, dto);
        userRepository.save(u);
    }

    public boolean aCodeInvitationEnAttente(String telephone, String role) {
        String telNorm = tunisieSmsService.normalizeInternationalTunisia(telephone);
        try {
            User u = chargerUtilisateurParTelephoneEtRole(telNorm, role.toUpperCase());
            return u.getOnboardingCodeHash() != null && !u.getOnboardingCodeHash().isBlank();
        } catch (RuntimeException e) {
            return false;
        }
    }

    private User chargerUtilisateurParTelephoneEtRole(String telNorm, String roleNom) {
        return switch (roleNom) {
            case "MEDECIN" -> medecinRepository.findByTelephone(telNorm)
                    .map(m -> (User) m)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
            case "INFIRMIER" -> infirmierRepository.findByTelephone(telNorm)
                    .map(i -> (User) i)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
            case "RADIOLOGUE" -> radiologueRepository.findByTelephone(telNorm)
                    .map(r -> (User) r)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
            case "PHARMACIEN" -> pharmacienRepository.findByTelephone(telNorm)
                    .map(p -> (User) p)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
            case "SECRETAIRE" -> secretaireRepository.findByTelephone(telNorm)
                    .map(s -> (User) s)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
            case "CHEF_PERSONNEL" -> chefPersonnelRepository.findByTelephone(telNorm)
                    .map(c -> (User) c)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
            case "TECHNICIEN_MAINTENANCE" -> technicienMaintenanceRepository.findByTelephone(telNorm)
                    .map(t -> (User) t)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
            default -> throw new RuntimeException("Rôle non reconnu: " + roleNom);
        };
    }

    public List<Map<String, Object>> rechercherMedecinsPourRattachement(String q, String cin) {
        if (q == null || q.trim().length() < 2) {
            return List.of();
        }
        String qt = q.trim();
        String cinParam = StringUtils.hasText(cin) ? cin.trim() : "";
        List<Medecin> found = medecinRepository.rechercherPourRattachement(qt, cinParam, PageRequest.of(0, 25));
        return found.stream().map(m -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id", m.getId());
            row.put("nom", m.getNom());
            row.put("prenom", m.getPrenom());
            row.put("telephone", m.getTelephone());
            row.put("specialite", m.getSpecialite());
            row.put("numeroPieceIdentite", m.getNumeroPieceIdentite());
            row.put("cliniqueNom", m.getClinique() != null ? m.getClinique().getNom() : null);
            return row;
        }).toList();
    }

    /**
     * Étape 2: Personnel complète son inscription
     */
    public Map<String, Object> registerPersonnel(RegisterPersonnelDTO dto) {
        String roleNom = dto.getRole().toUpperCase();
        String telNorm = tunisieSmsService.normalizeInternationalTunisia(dto.getTelephone());
        if (!StringUtils.hasText(telNorm)) {
            throw new RuntimeException("Numéro de téléphone invalide");
        }

        // Validation du mot de passe
        if (!dto.getMotDePasse().equals(dto.getConfirmationMotDePasse())) {
            throw new RuntimeException("Les mots de passe ne correspondent pas");
        }

        String encodedPassword = passwordEncoder.encode(dto.getMotDePasse());
        String numeroOrdre;
        User personnel;
        
        switch (roleNom) {
            case "MEDECIN":
                Medecin medecin = medecinRepository.findByTelephone(telNorm)
                    .orElseThrow(() -> new RuntimeException("Aucun compte médecin en attente pour ce téléphone"));
                
                if (medecin.getMotDePasse() != null) {
                    throw new RuntimeException("Ce compte a déjà été complété");
                }
                
                numeroOrdre = medecin.getNumeroOrdre() != null ? medecin.getNumeroOrdre()
                        : genererNumeroOrdreUnique("MED", medecinRepository.count(), medecinRepository::existsByNumeroOrdre);
                appliquerNomPrenomSiRenseigne(medecin, dto);
                medecin.setMotDePasse(encodedPassword);
                medecin.setActif(true);
                medecin.setNumeroOrdre(numeroOrdre);
                if (dto.getSpecialite() != null && !dto.getSpecialite().trim().isEmpty()) {
                    medecin.setSpecialite(dto.getSpecialite().trim());
                } else if (medecin.getSpecialite() == null) {
                    medecin.setSpecialite("Non spécifiée");
                }
                personnel = medecinRepository.save(medecin);
                break;
                
            case "INFIRMIER":
                Infirmier infirmier = infirmierRepository.findByTelephone(telNorm)
                    .orElseThrow(() -> new RuntimeException("Aucun compte infirmier en attente pour ce téléphone"));
                
                if (infirmier.getMotDePasse() != null) {
                    throw new RuntimeException("Ce compte a déjà été complété");
                }
                
                numeroOrdre = infirmier.getNumeroOrdre() != null ? infirmier.getNumeroOrdre()
                        : genererNumeroOrdreUnique("INF", infirmierRepository.count(), infirmierRepository::existsByNumeroOrdre);
                appliquerNomPrenomSiRenseigne(infirmier, dto);
                infirmier.setMotDePasse(encodedPassword);
                infirmier.setActif(true);
                infirmier.setNumeroOrdre(numeroOrdre);
                personnel = infirmierRepository.save(infirmier);
                break;
                
            case "RADIOLOGUE":
                Radiologue radiologue = radiologueRepository.findByTelephone(telNorm)
                    .orElseThrow(() -> new RuntimeException("Aucun compte radiologue en attente pour ce téléphone"));
                
                if (radiologue.getMotDePasse() != null) {
                    throw new RuntimeException("Ce compte a déjà été complété");
                }
                
                numeroOrdre = radiologue.getNumeroOrdre() != null ? radiologue.getNumeroOrdre()
                        : genererNumeroOrdreUnique("RAD", radiologueRepository.count(), radiologueRepository::existsByNumeroOrdre);
                appliquerNomPrenomSiRenseigne(radiologue, dto);
                radiologue.setMotDePasse(encodedPassword);
                radiologue.setActif(true);
                radiologue.setNumeroOrdre(numeroOrdre);
                personnel = radiologueRepository.save(radiologue);
                break;
                
            case "PHARMACIEN":
                Pharmacien pharmacien = pharmacienRepository.findByTelephone(telNorm)
                    .orElseThrow(() -> new RuntimeException("Aucun compte pharmacien en attente pour ce téléphone"));
                
                if (pharmacien.getMotDePasse() != null) {
                    throw new RuntimeException("Ce compte a déjà été complété");
                }
                
                numeroOrdre = pharmacien.getNumeroOrdre() != null ? pharmacien.getNumeroOrdre()
                        : genererNumeroOrdreUnique("PHA", pharmacienRepository.count(), pharmacienRepository::existsByNumeroOrdre);
                appliquerNomPrenomSiRenseigne(pharmacien, dto);
                pharmacien.setMotDePasse(encodedPassword);
                pharmacien.setActif(true);
                pharmacien.setNumeroOrdre(numeroOrdre);
                personnel = pharmacienRepository.save(pharmacien);
                break;
                
            case "SECRETAIRE":
                Secretaire secretaire = secretaireRepository.findByTelephone(telNorm)
                    .orElseThrow(() -> new RuntimeException("Aucun compte secrétaire en attente pour ce téléphone"));
                
                if (secretaire.getMotDePasse() != null) {
                    throw new RuntimeException("Ce compte a déjà été complété");
                }
                
                numeroOrdre = secretaire.getNumeroOrdre() != null ? secretaire.getNumeroOrdre()
                        : genererNumeroOrdreUnique("SEC", secretaireRepository.count(), secretaireRepository::existsByNumeroOrdre);
                appliquerNomPrenomSiRenseigne(secretaire, dto);
                secretaire.setMotDePasse(encodedPassword);
                secretaire.setActif(true);
                secretaire.setNumeroOrdre(numeroOrdre);
                personnel = secretaireRepository.save(secretaire);
                break;
                
            case "CHEF_PERSONNEL":
                ChefPersonnel chef = chefPersonnelRepository.findByTelephone(telNorm)
                    .orElseThrow(() -> new RuntimeException("Aucun compte chef personnel en attente pour ce téléphone"));
                
                if (chef.getMotDePasse() != null) {
                    throw new RuntimeException("Ce compte a déjà été complété");
                }
                
                numeroOrdre = chef.getNumeroOrdre() != null ? chef.getNumeroOrdre()
                        : genererNumeroOrdreUnique("CHF", chefPersonnelRepository.count(), chefPersonnelRepository::existsByNumeroOrdre);
                appliquerNomPrenomSiRenseigne(chef, dto);
                chef.setMotDePasse(encodedPassword);
                chef.setActif(true);
                chef.setNumeroOrdre(numeroOrdre);
                personnel = chefPersonnelRepository.save(chef);
                break;
                
            case "TECHNICIEN_MAINTENANCE":
                TechnicienMaintenance technicien = technicienMaintenanceRepository.findByTelephone(telNorm)
                    .orElseThrow(() -> new RuntimeException("Aucun compte technicien en attente pour ce téléphone"));
                
                if (technicien.getMotDePasse() != null) {
                    throw new RuntimeException("Ce compte a déjà été complété");
                }
                
                numeroOrdre = technicien.getNumeroOrdre() != null ? technicien.getNumeroOrdre()
                        : genererNumeroOrdreUnique("TEC", technicienMaintenanceRepository.count(), technicienMaintenanceRepository::existsByNumeroOrdre);
                appliquerNomPrenomSiRenseigne(technicien, dto);
                technicien.setMotDePasse(encodedPassword);
                technicien.setActif(true);
                technicien.setNumeroOrdre(numeroOrdre);
                personnel = technicienMaintenanceRepository.save(technicien);
                break;
                
            default:
                throw new RuntimeException("Rôle non reconnu: " + roleNom);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", personnel.getId());
        response.put("telephone", personnel.getTelephone());
        response.put("nom", personnel.getNom());
        response.put("prenom", personnel.getPrenom());
        response.put("role", roleNom);
        response.put("message", "Inscription réussie. Vous pouvez maintenant vous connecter.");
        
        return response;
    }

    private void appliquerNomPrenomSiRenseigne(User personnel, RegisterPersonnelDTO dto) {
        String nom = dto.getNom() != null ? dto.getNom().trim() : "";
        String prenom = dto.getPrenom() != null ? dto.getPrenom().trim() : "";
        if (!nom.isEmpty()) {
            personnel.setNom(nom);
        }
        if (!prenom.isEmpty()) {
            personnel.setPrenom(prenom);
        }
    }

    /**
     * Vérifie si un compte en attente existe pour ce téléphone et rôle
     */
    public boolean existeCompteEnAttente(String telephone, String role) {
        String roleNom = role.toUpperCase();
        
        switch (roleNom) {
            case "MEDECIN":
                return medecinRepository.findByTelephone(telephone)
                    .map(m -> m.getMotDePasse() == null)
                    .orElse(false);
            case "INFIRMIER":
                return infirmierRepository.findByTelephone(telephone)
                    .map(i -> i.getMotDePasse() == null)
                    .orElse(false);
            case "RADIOLOGUE":
                return radiologueRepository.findByTelephone(telephone)
                    .map(r -> r.getMotDePasse() == null)
                    .orElse(false);
            case "PHARMACIEN":
                return pharmacienRepository.findByTelephone(telephone)
                    .map(p -> p.getMotDePasse() == null)
                    .orElse(false);
            case "SECRETAIRE":
                return secretaireRepository.findByTelephone(telephone)
                    .map(s -> s.getMotDePasse() == null)
                    .orElse(false);
            case "CHEF_PERSONNEL":
                return chefPersonnelRepository.findByTelephone(telephone)
                    .map(c -> c.getMotDePasse() == null)
                    .orElse(false);
            case "TECHNICIEN_MAINTENANCE":
                return technicienMaintenanceRepository.findByTelephone(telephone)
                    .map(t -> t.getMotDePasse() == null)
                    .orElse(false);
            default:
                return false;
        }
    }

    /**
     * Trouver le rôle du personnel en attente pour un téléphone
     */
    public Optional<String> trouverRoleEnAttente(String telephone) {
        if (estCompteEnAttente(medecinRepository.findByTelephone(telephone).orElse(null))) {
            return Optional.of("MEDECIN");
        }
        if (estCompteEnAttente(infirmierRepository.findByTelephone(telephone).orElse(null))) {
            return Optional.of("INFIRMIER");
        }
        if (estCompteEnAttente(radiologueRepository.findByTelephone(telephone).orElse(null))) {
            return Optional.of("RADIOLOGUE");
        }
        if (estCompteEnAttente(pharmacienRepository.findByTelephone(telephone).orElse(null))) {
            return Optional.of("PHARMACIEN");
        }
        if (estCompteEnAttente(secretaireRepository.findByTelephone(telephone).orElse(null))) {
            return Optional.of("SECRETAIRE");
        }
        if (estCompteEnAttente(chefPersonnelRepository.findByTelephone(telephone).orElse(null))) {
            return Optional.of("CHEF_PERSONNEL");
        }
        if (estCompteEnAttente(technicienMaintenanceRepository.findByTelephone(telephone).orElse(null))) {
            return Optional.of("TECHNICIEN_MAINTENANCE");
        }
        return Optional.empty();
    }

    /**
     * Trouver le rôle du personnel pour un téléphone
     */
    public Optional<String> trouverRoleParTelephone(String telephone) {
        if (medecinRepository.findByTelephone(telephone).isPresent()) {
            return Optional.of("MEDECIN");
        }
        if (infirmierRepository.findByTelephone(telephone).isPresent()) {
            return Optional.of("INFIRMIER");
        }
        if (radiologueRepository.findByTelephone(telephone).isPresent()) {
            return Optional.of("RADIOLOGUE");
        }
        if (pharmacienRepository.findByTelephone(telephone).isPresent()) {
            return Optional.of("PHARMACIEN");
        }
        if (secretaireRepository.findByTelephone(telephone).isPresent()) {
            return Optional.of("SECRETAIRE");
        }
        if (chefPersonnelRepository.findByTelephone(telephone).isPresent()) {
            return Optional.of("CHEF_PERSONNEL");
        }
        if (technicienMaintenanceRepository.findByTelephone(telephone).isPresent()) {
            return Optional.of("TECHNICIEN_MAINTENANCE");
        }
        return Optional.empty();
    }

    private boolean estCompteEnAttente(User user) {
        if (user == null) {
            return false;
        }
        boolean motDePasseNonDefini = user.getMotDePasse() == null || user.getMotDePasse().isEmpty();
        boolean inactif = user.getActif() == null || !user.getActif();
        return motDePasseNonDefini || inactif;
    }

    /**
     * Génère un numéro d'ordre automatiquement
     * Format: PREFIX-ANNEE-NUMERO (ex: MED-2025-001)
     */
    private String genererNumeroOrdreUnique(String prefix, long count, Predicate<String> exists) {
        int year = Year.now().getValue();
        long next = count + 1;
        String numeroOrdre;
        do {
            String numero = String.format("%03d", next);
            numeroOrdre = prefix + "-" + year + "-" + numero;
            next++;
        } while (exists.test(numeroOrdre));
        return numeroOrdre;
    }
}
