package com.pfe.pfe.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pfe.pfe.dto.CreerCliniqueAvecAdminDTO;
import com.pfe.pfe.dto.EnregistrementAdminCliniqueDTO;
import com.pfe.pfe.dto.VerificationTelephoneResponse;
import com.pfe.pfe.model.AdministrateurClinique;
import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.model.Equipement;
import com.pfe.pfe.repository.AdministrateurCliniqueRepository;
import com.pfe.pfe.repository.CliniqueRepository;
import com.pfe.pfe.repository.ServiceRepository;
import com.pfe.pfe.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CliniqueService {

    private final CliniqueRepository cliniqueRepository;
    private final AdministrateurCliniqueRepository adminCliniqueRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EquipementService equipementService;
    private final PasswordGeneratorService passwordGeneratorService;
    private final TunisieSmsService tunisieSmsService;

    /**
     * Initialiser les 6 services prédéfinis pour une clinique
     */
    private void initialiserServicesParDefaut(Clinique clinique) {
        String[][] servicesData = {
                {"Services médicaux et de soins", "Médecine générale, Médecine interne, Pédiatrie, Gériatrie, Cardiologie, Pneumologie, Gastroentérologie, Neurologie, Néphrologie, Endocrinologie, Infectiologie, Dermatologie, Oncologie, Psychiatrie"},
                {"Services chirurgicaux", "Chirurgie générale, Chirurgie orthopédique, Chirurgie vasculaire, Chirurgie digestive, Chirurgie urologique, Chirurgie gynécologique, Chirurgie ORL, Neurochirurgie, Chirurgie pédiatrique, Bloc opératoire"},
                {"Services maternels et infantiles", "Maternité, Pédiatrie, Néonatalogie, Service de réanimation néonatale"},
                {"Services d'appui médical", "Radiologie/Imagerie médicale (IRM, scanner, échographie), Laboratoire d'analyses biologiques, Pharmacie hospitalière, Stérilisation, Anatomopathologie"},
                {"Services médico-techniques", "Bloc opératoire, Stérilisation, Hôpital de jour, Hospitalisation de semaine, Dialyse, Explorations fonctionnelles (cardiaques, respiratoires, neurologiques)"},
                {"Services Urgence ", "Les services d’urgence assurent une prise en charge immédiate et continue des patients en situation médicale grave ou vitale.  "}
        };

        for (String[] data : servicesData) {
            com.pfe.pfe.model.Service service = new com.pfe.pfe.model.Service();
            service.setNom(data[0]);
            service.setDescription(data[1]);
            service.setClinique(clinique);
            service.setActif(true);
            service.setDateCreation(LocalDateTime.now());
            service.setNombreChambres(0);
            service.setNombreLits(0);

            serviceRepository.save(service);
        }
    }

    /**
     * Initialiser les équipements de base (stock = 0) pour une clinique.
     * Ces équipements apparaîtront dans le module Stock/Équipements et pourront ensuite être gérés via le CRUD.
     */
    private void initialiserEquipementsParDefaut(Clinique clinique) {
        // (nom, categorie)
        Object[][] equipementsData = {
                {"Lit médicalisé", Equipement.CategorieEquipement.LITS_MOBILIER},
                {"Prise d’oxygène murale", Equipement.CategorieEquipement.DIAGNOSTIC},
                {"Débitmètre d’oxygène", Equipement.CategorieEquipement.DIAGNOSTIC},
                {"Climatiseur / système de climatisation", Equipement.CategorieEquipement.LITS_MOBILIER},
                {"Prise de vide (aspiration)", Equipement.CategorieEquipement.DIAGNOSTIC},
                {"Support à perfusion (pied à sérum)", Equipement.CategorieEquipement.LITS_MOBILIER},
                {"Thermomètre", Equipement.CategorieEquipement.DIAGNOSTIC},
                {"Tensiomètre", Equipement.CategorieEquipement.DIAGNOSTIC},
                {"Oxymètre (SpO₂)", Equipement.CategorieEquipement.DIAGNOSTIC},
                {"Système d’appel malade", Equipement.CategorieEquipement.LITS_MOBILIER},
                {"Fauteuil / chaise", Equipement.CategorieEquipement.LITS_MOBILIER},
                {"Table de chevet / table de lit", Equipement.CategorieEquipement.LITS_MOBILIER},
        };

        for (Object[] row : equipementsData) {
            String nom = (String) row[0];
            Equipement.CategorieEquipement categorie = (Equipement.CategorieEquipement) row[1];

            Equipement equipement = new Equipement();
            equipement.setNom(nom);
            equipement.setCategorie(categorie);
            equipement.setQuantite(0);
            equipement.setCliniqueId(clinique.getId());
            equipement.setTypeLocalisation(Equipement.TypeLocalisation.MAGASIN);
            equipement.setLocalisation("Stock");
            equipement.setEtatTechnique(Equipement.EtatTechnique.FONCTIONNEL);
            equipement.setStatut(Equipement.StatutEquipement.DISPONIBLE);

            // Laisser le service générer le code unique et appliquer les defaults
            equipementService.creerEquipement(equipement);
        }
    }

    public Clinique creerClinique(Clinique clinique) {
        // Vérifier si le nom existe déjà
        if (cliniqueRepository.existsByNom(clinique.getNom())) {
            throw new RuntimeException("Une clinique avec ce nom existe déjà");
        }
        clinique.setDateCreation(LocalDateTime.now());
        clinique.setActif(true);

        Clinique cliniqueCreée = cliniqueRepository.save(clinique);

        // 🎯 Initialiser automatiquement les 6 services
        initialiserServicesParDefaut(cliniqueCreée);
        // 🎯 Initialiser automatiquement les équipements de base (stock=0)
        initialiserEquipementsParDefaut(cliniqueCreée);

        return cliniqueCreée;
    }

    public List<Clinique> obtenirToutesLesCliniques() {
        return cliniqueRepository.findAll();
    }

    public List<Clinique> obtenirCliniquesActives() {
        return cliniqueRepository.findByActif(true);
    }

    public Clinique obtenirCliniqueParId(String id) {
        return cliniqueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Clinique non trouvée"));
    }

    public Clinique mettreAJourClinique(String id, Clinique cliniqueDetails) {
        Clinique clinique = obtenirCliniqueParId(id);

        // Vérifier si le nouveau nom existe déjà pour une autre clinique
        if (cliniqueRepository.existsByNomAndIdNot(cliniqueDetails.getNom(), id)) {
            throw new RuntimeException("Une clinique avec ce nom existe déjà");
        }

        clinique.setNom(cliniqueDetails.getNom());
        clinique.setAdresse(cliniqueDetails.getAdresse());
        clinique.setTelephone(cliniqueDetails.getTelephone());

        return cliniqueRepository.save(clinique);
    }

    public Integer calculerOccupation(String cliniqueId) {
        obtenirCliniqueParId(cliniqueId);
        // Logique pour calculer le taux d'occupation
        // À implémenter selon les besoins
        return 0;
    }

    public void deleteClinique(String id) {
        Clinique clinique = obtenirCliniqueParId(id);

        // 1. Supprimer tout le personnel associé (Admins, Médecins, etc.)
        if (clinique.getPersonnel() != null && !clinique.getPersonnel().isEmpty()) {
            userRepository.deleteAll(clinique.getPersonnel());
        }

        // 2. Supprimer la clinique (les services sont supprimés en cascade grâce à CascadeType.ALL)
        cliniqueRepository.delete(clinique);
    }

    /**
     * Créer une clinique avec son administrateur (par le super admin)
     * L'admin est créé sans mot de passe, il devra s'enregistrer ensuite
     */
    public Clinique creerCliniqueAvecAdministrateur(CreerCliniqueAvecAdminDTO dto) {
        // Vérifier si le nom de la clinique existe déjà
        if (cliniqueRepository.existsByNom(dto.getNomClinique())) {
            throw new RuntimeException("Une clinique avec ce nom existe déjà");
        }

        String adminPhone = tunisieSmsService.normalizeInternationalTunisia(dto.getTelephoneAdmin());
        if (!StringUtils.hasText(adminPhone) || adminPhone.length() < 11) {
            throw new RuntimeException("Numéro admin invalide (format attendu: 216XXXXXXXX)");
        }

        // Vérifier si le téléphone de l'admin existe déjà
        if (adminCliniqueRepository.existsByTelephone(adminPhone)) {
            throw new RuntimeException("Un administrateur avec ce numéro de téléphone existe déjà");
        }

        // Créer la clinique
        Clinique clinique = new Clinique();
        clinique.setNom(dto.getNomClinique());
        clinique.setAdresse(dto.getAdresseClinique());
        clinique.setTelephone(dto.getTelephoneClinique());
        clinique.setActif(true);
        clinique.setDateCreation(LocalDateTime.now());
        if (dto.getPreferenceFacturation() != null && !dto.getPreferenceFacturation().isBlank()) {
            clinique.setPreferenceFacturation(dto.getPreferenceFacturation().trim().toUpperCase());
        }

        Clinique cliniqueSauvegardee = cliniqueRepository.save(clinique);

        // Créer l'administrateur de clinique (sans mot de passe)
        AdministrateurClinique admin = new AdministrateurClinique();
        admin.setNom(dto.getNomAdmin());
        admin.setPrenom(dto.getPrenomAdmin());
        admin.setTelephone(adminPhone);
        if (StringUtils.hasText(dto.getEmailAdmin())) {
            admin.setEmail(dto.getEmailAdmin().trim());
        }
        String rawPassword = passwordGeneratorService.generate();
        admin.setMotDePasse(passwordEncoder.encode(rawPassword));
        admin.setClinique(cliniqueSauvegardee);
        admin.setActif(true);
        admin.setDateCreation(LocalDateTime.now());

        AdministrateurClinique adminSauvegarde = adminCliniqueRepository.save(admin);

        String nomAffiche = (adminSauvegarde.getPrenom() != null ? adminSauvegarde.getPrenom() + " " : "")
                + adminSauvegarde.getNom();
        String sms = "Clinux - Bienvenue " + nomAffiche
                + ". Compte admin clinique pret. ID: " + adminSauvegarde.getTelephone()
                + " MDP: " + rawPassword + ". App Clinux.";
        try {
            tunisieSmsService.sendSmsForClinique(cliniqueSauvegardee.getId(), adminSauvegarde.getTelephone(), sms);
        } catch (Exception e) {
            // On ne bloque pas la création clinique si le SMS échoue
            log.warn("SMS non envoyé à l'admin clinique {}: {}", adminSauvegarde.getTelephone(), e.getMessage());
        }

        // 🎯 Initialiser automatiquement les 6 services
        initialiserServicesParDefaut(cliniqueSauvegardee);
        // 🎯 Initialiser automatiquement les équipements de base (stock=0)
        initialiserEquipementsParDefaut(cliniqueSauvegardee);

        return cliniqueSauvegardee;
    }

    /**
     * Vérifier si un téléphone existe et retourner les informations
     */
    public VerificationTelephoneResponse verifierTelephone(String telephone) {
        var adminOpt = adminCliniqueRepository.findByTelephone(telephone);

        if (adminOpt.isEmpty()) {
            return new VerificationTelephoneResponse(
                    false,
                    "Aucun compte trouvé avec ce numéro de téléphone",
                    null, null, null, null, null, null, false
            );
        }

        AdministrateurClinique admin = adminOpt.get();
        boolean motDePasseDefini = admin.getMotDePasse() != null && !admin.getMotDePasse().isEmpty();

        String message = motDePasseDefini
                ? "Compte trouvé. Vous pouvez vous connecter."
                : "Compte trouvé. Veuillez définir votre mot de passe.";

        return new VerificationTelephoneResponse(
                true,
                message,
                admin.getId(),
                admin.getNom(),
                admin.getPrenom(),
                admin.getTelephone(),
                admin.getClinique() != null ? admin.getClinique().getId() : null,
                admin.getClinique() != null ? admin.getClinique().getNom() : null,
                motDePasseDefini
        );
    }

    /**
     * Enregistrement de l'administrateur de clinique (définir son mot de passe)
     */
    public AdministrateurClinique enregistrerAdminClinique(EnregistrementAdminCliniqueDTO dto) {
        // Vérifier que les mots de passe correspondent
        if (!dto.getMotDePasse().equals(dto.getConfirmationMotDePasse())) {
            throw new RuntimeException("Les mots de passe ne correspondent pas");
        }

        // Trouver l'administrateur
        AdministrateurClinique admin = adminCliniqueRepository.findByTelephone(dto.getTelephone())
                .orElseThrow(() -> new RuntimeException("Aucun compte trouvé avec ce numéro de téléphone"));

        // Vérifier s'il a déjà un mot de passe
        if (admin.getMotDePasse() != null && !admin.getMotDePasse().isEmpty()) {
            throw new RuntimeException("Ce compte est déjà enregistré. Veuillez vous connecter.");
        }

        // Définir le mot de passe et activer le compte
        admin.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse()));
        admin.setActif(true);

        return adminCliniqueRepository.save(admin);
    }
}
