package com.pfe.pfe.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pfe.pfe.dto.CreerAdministrateurCliniqueDTO;
import com.pfe.pfe.dto.LoginAdminCliniqueDTO;
import com.pfe.pfe.dto.RegisterAdminCliniqueDTO;
import com.pfe.pfe.dto.SmsSendOutcome;
import com.pfe.pfe.model.AdministrateurClinique;
import com.pfe.pfe.repository.AdministrateurCliniqueRepository;
import com.pfe.pfe.repository.CliniqueRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AdministrateurCliniqueService {

    private final AdministrateurCliniqueRepository adminCliniqueRepository;
    private final CliniqueRepository cliniqueRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordGeneratorService passwordGenerator;
    private final TunisieSmsService tunisieSmsService;

    private static final String PHONE_PATTERN = "^[+]?[0-9]{9,15}$";
    private static final Pattern phonePattern = Pattern.compile(PHONE_PATTERN);

    /**
     * Obtenir TOUS les administrateurs de clinique
     */
    public List<AdministrateurClinique> obtenirTousLesAdmins() {
        return adminCliniqueRepository.findAll();
    }

    /**
     * Obtenir un administrateur par son ID
     */
    public AdministrateurClinique obtenirAdminParId(String id) {
        return adminCliniqueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Administrateur non trouvé avec l'ID: " + id));
    }

    /**
     * Supprimer définitivement un administrateur.
     */
    public void supprimerAdmin(String id) {
        adminCliniqueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Administrateur non trouvé avec l'ID: " + id));

        adminCliniqueRepository.deleteById(id);
    }

    /**
     * Création d'un administrateur de clinique par le Super Admin
     * pour une clinique déjà existante (mot de passe généré, SMS via TunisieSMS).
     */
    public AdministrateurClinique creerAdministrateurClinique(CreerAdministrateurCliniqueDTO dto) {
        if (dto.getTelephone() == null || dto.getTelephone().trim().isEmpty()) {
            throw new IllegalArgumentException("Le téléphone de l'administrateur est obligatoire");
        }
        if (dto.getCliniqueId() == null || dto.getCliniqueId().trim().isEmpty()) {
            throw new IllegalArgumentException("La clinique assignée est obligatoire");
        }

        String telephone = tunisieSmsService.normalizeInternationalTunisia(dto.getTelephone());
        if (!StringUtils.hasText(telephone) || telephone.length() < 11) {
            throw new IllegalArgumentException("Numéro de téléphone invalide (format tunisien attendu, ex. 216XXXXXXXX)");
        }

        if (adminCliniqueRepository.existsByTelephone(telephone)) {
            throw new IllegalArgumentException("Un administrateur avec ce numéro de téléphone existe déjà");
        }

        var clinique = cliniqueRepository.findById(dto.getCliniqueId())
                .orElseThrow(() -> new IllegalArgumentException("Clinique non trouvée"));

        AdministrateurClinique admin = new AdministrateurClinique();
        admin.setNom(dto.getNom());
        admin.setPrenom(dto.getPrenom() != null && !dto.getPrenom().trim().isEmpty()
                ? dto.getPrenom()
                : telephone);
        admin.setTelephone(telephone);
        if (StringUtils.hasText(dto.getEmail())) {
            admin.setEmail(dto.getEmail().trim());
        }

        String rawPassword = passwordGenerator.generate();
        admin.setMotDePasse(passwordEncoder.encode(rawPassword));
        admin.setActif(true);
        admin.setClinique(clinique);

        AdministrateurClinique saved = adminCliniqueRepository.save(admin);

        String nomAffiche = saved.getPrenom() != null ? saved.getPrenom() + " " + saved.getNom() : saved.getNom();
        String message = "Clinux - Bienvenue " + nomAffiche
                + ". Compte admin clinique pret. ID: " + saved.getTelephone()
                + " MDP: " + rawPassword + ". App Clinux.";
        try {
            tunisieSmsService.sendSmsAdminClinique(clinique.getId(), saved.getTelephone(), message);
        } catch (Exception e) {
            log.warn("SMS TunisieSMS non envoye pour admin clinique {} : {}", saved.getTelephone(), e.getMessage());
        }

        return saved;
    }

    /**
     * Réinitialise le mot de passe d'un administrateur de clinique et tente l'envoi par SMS.
     * Réservé au Super Admin (mot de passe perdu si le SMS initial n'est pas arrivé).
     */
    public Map<String, Object> reinitialiserMotDePasseEtEnvoyerSms(String adminId) {
        AdministrateurClinique admin = obtenirAdminParId(adminId);
        if (admin.getClinique() == null || admin.getClinique().getId() == null) {
            throw new IllegalArgumentException("Cet administrateur n'est assigné à aucune clinique");
        }

        String rawPassword = passwordGenerator.generate();
        admin.setMotDePasse(passwordEncoder.encode(rawPassword));
        admin.setActif(true);
        AdministrateurClinique saved = adminCliniqueRepository.save(admin);

        String nomAffiche = saved.getPrenom() != null ? saved.getPrenom() + " " + saved.getNom() : saved.getNom();
        String message = "Clinux - Nouveau MDP admin " + nomAffiche
                + ". ID: " + saved.getTelephone()
                + " MDP: " + rawPassword + ". App Clinux.";

        SmsSendOutcome outcome;
        try {
            outcome = tunisieSmsService.sendSmsAdminCliniqueWithOutcome(
                    saved.getClinique().getId(), saved.getTelephone(), message, "ADMIN_RESET_MDP");
        } catch (Exception e) {
            log.warn("SMS TunisieSMS non envoye pour reinitialisation admin {} : {}", saved.getTelephone(), e.getMessage());
            outcome = SmsSendOutcome.echec(e.getMessage());
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("adminId", saved.getId());
        result.put("telephone", saved.getTelephone());
        result.put("smsEnvoye", outcome.envoye());
        result.put("smsDetail", outcome.detail());
        result.put("message", outcome.envoye()
                ? "Mot de passe réinitialisé et envoyé par SMS."
                : "Mot de passe réinitialisé en base, mais le SMS n'a pas pu être envoyé : " + outcome.detail());
        return result;
    }

    /**
     * Connexion d'un Administrateur Clinique
     */
    public AdministrateurClinique loginAdminClinique(LoginAdminCliniqueDTO dto) {
        if (dto.getTelephone() == null || dto.getTelephone().trim().isEmpty()) {
            throw new IllegalArgumentException("Le téléphone est obligatoire");
        }

        if (dto.getMotDePasse() == null || dto.getMotDePasse().trim().isEmpty()) {
            throw new IllegalArgumentException("Le mot de passe est obligatoire");
        }

        AdministrateurClinique admin = adminCliniqueRepository.findByTelephone(dto.getTelephone())
                .orElseThrow(() -> new IllegalArgumentException("Téléphone ou mot de passe incorrect"));

        // Vérifier que le compte est actif (Boolean peut être null)
        if (admin.getActif() == null || !admin.getActif()) {
            throw new IllegalArgumentException("Compte non activé");
        }

        if (admin.getMotDePasse() == null || !passwordEncoder.matches(dto.getMotDePasse(), admin.getMotDePasse())) {
            throw new IllegalArgumentException("Téléphone ou mot de passe incorrect");
        }

        return admin;
    }

    /**
     * Enregistrement d'un Administrateur Clinique
     */
    public AdministrateurClinique registerAdminClinique(RegisterAdminCliniqueDTO dto) {
        if (dto.getTelephone() == null || dto.getTelephone().trim().isEmpty()) {
            throw new IllegalArgumentException("Le téléphone est obligatoire");
        }

        AdministrateurClinique admin = adminCliniqueRepository.findByTelephone(dto.getTelephone())
                .orElseThrow(() -> new IllegalArgumentException("Aucun compte trouvé pour ce numéro"));


        if (dto.getMotDePasse() == null || dto.getMotDePasse().trim().isEmpty()) {
            throw new IllegalArgumentException("Le mot de passe est obligatoire");
        }

        // Gérer les cas où nom/prenom ne sont pas fournis
        String nom = (dto.getNom() != null && !dto.getNom().trim().isEmpty()) 
                ? dto.getNom().trim() 
                : "Admin";
        String prenom = (dto.getPrenom() != null && !dto.getPrenom().trim().isEmpty()) 
                ? dto.getPrenom().trim() 
                : dto.getTelephone();
        
        admin.setNom(nom);
        admin.setPrenom(prenom);
        admin.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse()));
        admin.setActif(true);

        return adminCliniqueRepository.save(admin);
    }

    /**
     * Vérifier si un compte en attente existe
     */
    public boolean existeCompteEnAttente(String telephone) {
        return adminCliniqueRepository.findByTelephone(telephone)
                .map(admin -> admin.getActif() == null || !admin.getActif())
                .orElse(false);
    }

    /**
     * Obtenir les administrateurs d'une clinique
     */
    public List<AdministrateurClinique> obtenirAdminsClinique(String cliniqueId) {
        if (!cliniqueRepository.existsById(cliniqueId)) {
            throw new IllegalArgumentException("Clinique non trouvée");
        }
        return adminCliniqueRepository.findByCliniqueId(cliniqueId);
    }

    /**
     * Obtenir un administrateur par téléphone
     */
    public AdministrateurClinique obtenirAdminParTelephone(String telephone) {
        return adminCliniqueRepository.findByTelephone(telephone)
                .orElseThrow(() -> new IllegalArgumentException("Administrateur non trouvé"));
    }

    /**
     * Trouver un administrateur par téléphone (optionnel)
     */
    public java.util.Optional<AdministrateurClinique> trouverAdminParTelephone(String telephone) {
        return adminCliniqueRepository.findByTelephone(telephone);
    }

    /**
     * Obtenir les administrateurs actifs d'une clinique
     */
    public List<AdministrateurClinique> obtenirAdminsActifsClinique(String cliniqueId) {
        if (!cliniqueRepository.existsById(cliniqueId)) {
            throw new IllegalArgumentException("Clinique non trouvée");
        }
        return adminCliniqueRepository.findByCliniqueIdAndActifTrue(cliniqueId);
    }

    /**
     * Obtenir un administrateur par téléphone et clinique
     */
    public AdministrateurClinique obtenirAdminParTelephoneEtClinique(String telephone, String cliniqueId) {
        if (!cliniqueRepository.existsById(cliniqueId)) {
            throw new IllegalArgumentException("Clinique non trouvée");
        }
        return adminCliniqueRepository.findByTelephoneAndCliniqueId(telephone, cliniqueId)
                .orElseThrow(() -> new IllegalArgumentException("Administrateur non trouvé pour cette clinique"));
    }

    /**
     * Mettre à jour un administrateur
     */
    public AdministrateurClinique mettreAJourAdmin(String id, RegisterAdminCliniqueDTO dto) {
        AdministrateurClinique admin = obtenirAdminParId(id);

        if (dto.getNom() != null && !dto.getNom().isEmpty()) {
            admin.setNom(dto.getNom());
        }

        if (dto.getPrenom() != null && !dto.getPrenom().isEmpty()) {
            admin.setPrenom(dto.getPrenom());
        }

        if (dto.getMotDePasse() != null && !dto.getMotDePasse().isEmpty()) {
            admin.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse()));
        }

        return adminCliniqueRepository.save(admin);
    }

    /**
     * Désactiver un administrateur
     */
    public void desactiverAdmin(String id) {
        AdministrateurClinique admin = obtenirAdminParId(id);
        admin.setActif(false);
        adminCliniqueRepository.save(admin);
    }

    /**
     * Activer un administrateur
     */
    public void activerAdmin(String id) {
        AdministrateurClinique admin = obtenirAdminParId(id);
        admin.setActif(true);
        adminCliniqueRepository.save(admin);
    }

    private boolean validerTelephone(String telephone) {
        return phonePattern.matcher(telephone).matches();
    }
}
