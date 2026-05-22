package com.pfe.pfe.service;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pfe.pfe.dto.CabinetMedecinCreationResponse;
import com.pfe.pfe.dto.CreerCabinetMedecinDTO;
import com.pfe.pfe.dto.SmsSendOutcome;
import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.model.Medecin;
import com.pfe.pfe.model.Role;
import com.pfe.pfe.repository.CliniqueRepository;
import com.pfe.pfe.repository.MedecinRepository;
import com.pfe.pfe.repository.RoleRepository;
import com.pfe.pfe.repository.UserRepository;
import com.pfe.pfe.security.services.CustomUserDetails;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class MedecinService {

    private final MedecinRepository medecinRepository;
    private final CliniqueRepository cliniqueRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordGeneratorService passwordGenerator;
    private final TunisieSmsService tunisieSmsService;

    public Medecin creerMedecin(Medecin medecin) {
        if (medecinRepository.findByTelephone(medecin.getTelephone()).isPresent()) {
            throw new RuntimeException("Un médecin avec ce numéro de téléphone existe déjà");
        }

        medecin.setMotDePasse(passwordEncoder.encode(medecin.getMotDePasse()));
        medecin.setDateCreation(LocalDateTime.now());
        medecin.setActif(true);

        return medecinRepository.save(medecin);
    }

    /**
     * Super admin : cabinet médecin.
     * - CIN déjà dans le système (clinique ou cabinet) → même login, pas de SMS, accès cabinet activé.
     * - CIN inconnu → nouveau compte cabinet + SMS avec identifiants.
     */
    public CabinetMedecinCreationResponse creerCabinetMedecinSuperAdmin(CreerCabinetMedecinDTO dto) {
        if (!StringUtils.hasText(dto.getNom()) || !StringUtils.hasText(dto.getPrenom())) {
            throw new RuntimeException("Le nom et le prénom sont obligatoires");
        }
        if (!StringUtils.hasText(dto.getSpecialite())) {
            throw new RuntimeException("La spécialité est obligatoire");
        }

        String cin = normalizeCin(dto.getNumeroPieceIdentite());
        if (!StringUtils.hasText(cin)) {
            throw new RuntimeException("Le numéro CIN est obligatoire");
        }

        List<Medecin> parCin = medecinRepository.findAllByNumeroPieceIdentite(cin);
        if (!parCin.isEmpty()) {
            if (parCin.size() > 1) {
                throw new RuntimeException("Plusieurs comptes correspondent à ce CIN ; contactez l'administrateur.");
            }
            return rattacherCabinetSurMedecinExistant(parCin.get(0), dto, cin);
        }

        return creerNouveauCabinetAvecSms(dto, cin);
    }

    /**
     * Vérifie si un CIN existe déjà (médecin clinique ou cabinet) avant création.
     */
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> verifierCinPourCabinet(String numeroPieceIdentite, String telephone) {
        String cin = normalizeCin(numeroPieceIdentite);
        java.util.Map<String, Object> out = new java.util.LinkedHashMap<>();
        if (!StringUtils.hasText(cin)) {
            out.put("trouve", false);
            out.put("message", "CIN non renseigné");
            return out;
        }
        List<Medecin> parCin = medecinRepository.findAllByNumeroPieceIdentite(cin);
        if (parCin.isEmpty()) {
            out.put("trouve", false);
            out.put("nouveauCompte", true);
            out.put("message", "CIN inconnu : un nouveau compte cabinet sera créé et les identifiants seront envoyés par SMS.");
            return out;
        }
        if (parCin.size() > 1) {
            out.put("trouve", true);
            out.put("ambigu", true);
            out.put("message", "Plusieurs comptes correspondent à ce CIN.");
            return out;
        }
        Medecin m = parCin.get(0);
        boolean clinique = m.getClinique() != null;
        out.put("trouve", true);
        out.put("medecinId", m.getId());
        out.put("nom", m.getNom());
        out.put("prenom", m.getPrenom());
        out.put("telephone", m.getTelephone());
        out.put("rattacheClinique", clinique);
        out.put("cliniqueNom", clinique && m.getClinique() != null ? m.getClinique().getNom() : null);
        out.put("nouveauCompte", false);
        out.put("envoiSms", false);
        if (clinique) {
            out.put("message",
                    "Ce CIN correspond à un médecin de la clinique « "
                            + (m.getClinique() != null ? m.getClinique().getNom() : "")
                            + " ». L'accès cabinet utilisera le même identifiant de connexion (téléphone et mot de passe clinique). Aucun SMS ne sera envoyé.");
        } else {
            out.put("message",
                    "Ce CIN correspond déjà à un médecin cabinet. Les identifiants de connexion restent inchangés (aucun SMS).");
        }
        return out;
    }

    private CabinetMedecinCreationResponse rattacherCabinetSurMedecinExistant(Medecin medecin, CreerCabinetMedecinDTO dto, String cin) {
        boolean medecinClinique = medecin.getClinique() != null;

        if (!medecinClinique) {
            String telephoneSaisi = tunisieSmsService.normalizeInternationalTunisia(dto.getTelephone());
            if (StringUtils.hasText(telephoneSaisi) && !telephoneSaisi.equals(medecin.getTelephone())) {
                if (userRepository.existsByTelephoneAndIdNot(telephoneSaisi, medecin.getId())) {
                    throw new RuntimeException("Ce numéro de téléphone est déjà utilisé par un autre compte");
                }
                medecin.setTelephone(telephoneSaisi);
            }
        }

        appliquerInfosCabinet(medecin, dto, cin);
        medecin.setAccesCabinet(true);
        medecin.setActif(true);
        medecin = medecinRepository.save(medecin);

        String detail = medecinClinique
                ? "Accès cabinet activé : même connexion que la clinique « " + medecin.getClinique().getNom() + " » (SMS non envoyé)."
                : "Cabinet mis à jour : identifiant et mot de passe inchangés (SMS non envoyé).";
        return new CabinetMedecinCreationResponse(medecin, false, detail, true, false);
    }

    private CabinetMedecinCreationResponse creerNouveauCabinetAvecSms(CreerCabinetMedecinDTO dto, String cin) {
        String telephone = tunisieSmsService.normalizeInternationalTunisia(dto.getTelephone());
        if (!StringUtils.hasText(telephone) || telephone.length() < 11) {
            throw new RuntimeException("Numéro de téléphone mobile invalide (8 chiffres tunisiens attendus)");
        }
        if (userRepository.findByTelephone(telephone).isPresent()) {
            throw new RuntimeException("Un utilisateur avec ce numéro de téléphone existe déjà");
        }

        Medecin medecin = new Medecin();
        appliquerInfosCabinet(medecin, dto, cin);
        medecin.setTelephone(telephone);
        medecin.setClinique(null);
        medecin.setAccesCabinet(true);
        medecin.setNumeroOrdre(genererNumeroOrdreUnique("MED", medecinRepository.count(), medecinRepository::existsByNumeroOrdre));
        medecin.setDateCreation(LocalDateTime.now());

        Role role = roleRepository.findByNom("ROLE_MEDECIN")
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setNom("ROLE_MEDECIN");
                    r.setDescription("Médecin");
                    return roleRepository.save(r);
                });
        medecin.getRoles().add(role);

        String rawPassword = passwordGenerator.generate();
        medecin.setMotDePasse(passwordEncoder.encode(rawPassword));
        medecin.setActif(true);

        medecin = medecinRepository.save(medecin);

        String nomAffiche = (medecin.getPrenom() != null ? medecin.getPrenom() + " " : "")
                + (medecin.getNom() != null ? medecin.getNom() : "");
        if (nomAffiche.trim().isEmpty()) {
            nomAffiche = medecin.getTelephone();
        }
        String messageSms = "Clinux - Bienvenue Dr " + nomAffiche
                + ". Cabinet pret. ID: " + medecin.getTelephone()
                + " MDP: " + rawPassword + ". App Clinux.";
        SmsSendOutcome sms = tunisieSmsService.sendSmsForCliniqueWithOutcome(null, medecin.getTelephone(), messageSms);
        if (!sms.envoye()) {
            log.warn("SMS non envoye pour cabinet medecin {} : {}", medecin.getTelephone(), sms.detail());
        }

        return new CabinetMedecinCreationResponse(medecin, sms.envoye(), sms.detail(), false, true);
    }

    private void appliquerInfosCabinet(Medecin medecin, CreerCabinetMedecinDTO dto, String cin) {
        medecin.setNom(dto.getNom().trim());
        medecin.setPrenom(dto.getPrenom().trim());
        medecin.setSpecialite(dto.getSpecialite().trim());
        medecin.setTelephoneFixe(normaliserTelephoneFixeOptionnel(dto.getTelephoneFixe()));
        medecin.setLocalisation(StringUtils.hasText(dto.getLocalisation()) ? dto.getLocalisation().trim() : null);
        medecin.setNumeroPieceIdentite(cin);
    }

    public List<Medecin> listerCabinetsMedecins() {
        return medecinRepository.findCabinetsOrderByDateCreationDesc();
    }

    public Medecin mettreAJourCabinetMedecin(String id, CreerCabinetMedecinDTO dto) {
        Medecin medecin = obtenirMedecinParId(id);
        if (medecin.getClinique() != null && !Boolean.TRUE.equals(medecin.getAccesCabinet())) {
            throw new RuntimeException("Ce médecin est rattaché à une clinique sans accès cabinet");
        }
        if (!StringUtils.hasText(dto.getNom()) || !StringUtils.hasText(dto.getPrenom())) {
            throw new RuntimeException("Le nom et le prénom sont obligatoires");
        }
        if (!StringUtils.hasText(dto.getSpecialite())) {
            throw new RuntimeException("La spécialité est obligatoire");
        }

        String telephone = tunisieSmsService.normalizeInternationalTunisia(dto.getTelephone());
        if (!StringUtils.hasText(telephone) || telephone.length() < 11) {
            throw new RuntimeException("Numéro de téléphone mobile invalide");
        }
        if (userRepository.existsByTelephoneAndIdNot(telephone, id)) {
            throw new RuntimeException("Un utilisateur avec ce numéro de téléphone existe déjà");
        }

        medecin.setNom(dto.getNom().trim());
        medecin.setPrenom(dto.getPrenom().trim());
        medecin.setTelephone(telephone);
        medecin.setSpecialite(dto.getSpecialite().trim());
        medecin.setTelephoneFixe(normaliserTelephoneFixeOptionnel(dto.getTelephoneFixe()));
        medecin.setLocalisation(StringUtils.hasText(dto.getLocalisation()) ? dto.getLocalisation().trim() : null);

        if (StringUtils.hasText(dto.getNumeroPieceIdentite())) {
            String cinNorm = normalizeCin(dto.getNumeroPieceIdentite());
            if (StringUtils.hasText(cinNorm) && userRepository.existsByNumeroPieceIdentiteAndIdNot(cinNorm, id)) {
                throw new RuntimeException("Ce CIN est déjà utilisé par un autre compte");
            }
            medecin.setNumeroPieceIdentite(cinNorm);
        }

        return medecinRepository.save(medecin);
    }

    public void supprimerCabinetMedecin(String id) {
        Medecin medecin = obtenirMedecinParId(id);
        if (medecin.getClinique() != null && Boolean.TRUE.equals(medecin.getAccesCabinet())) {
            medecin.setAccesCabinet(false);
            medecin.setLocalisation(null);
            medecin.setTelephoneFixe(null);
            medecinRepository.save(medecin);
            return;
        }
        if (medecin.getClinique() != null) {
            throw new RuntimeException("Ce médecin n'est pas un cabinet indépendant");
        }
        supprimerMedecin(id);
    }

    private String normaliserTelephoneFixeOptionnel(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        String digits = raw.replaceAll("\\D", "");
        if (digits.length() == 8) {
            return digits;
        }
        return raw.trim();
    }

    /** CIN : trim, suppression des espaces, majuscules (aligné sur la saisie côté personnel). */
    private String normalizeCin(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        return raw.trim().replaceAll("\\s+", "").toUpperCase();
    }

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

    public List<Medecin> obtenirTousLesMedecins() {
        return medecinRepository.findAll();
    }

    public Medecin obtenirMedecinParId(String id) {
        return medecinRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Médecin non trouvé"));
    }

    public List<Medecin> obtenirMedecinsParClinique(String cliniqueId) {
        return medecinRepository.findByCliniqueId(cliniqueId);
    }

    public List<Medecin> obtenirMedecinsParSpecialite(String specialite) {
        return medecinRepository.findBySpecialite(specialite);
    }

    public Medecin mettreAJourMedecin(String id, Medecin medecinDetails) {
        Medecin medecin = obtenirMedecinParId(id);

        if (medecinDetails.getTelephone() != null
                && !medecinDetails.getTelephone().equals(medecin.getTelephone())) {
            if (userRepository.existsByTelephoneAndIdNot(medecinDetails.getTelephone(), id)) {
                throw new RuntimeException("Un utilisateur avec ce numéro de téléphone existe déjà");
            }
        }

        medecin.setNom(medecinDetails.getNom());
        medecin.setPrenom(medecinDetails.getPrenom());
        medecin.setTelephone(medecinDetails.getTelephone());
        medecin.setSpecialite(medecinDetails.getSpecialite());
        if (medecinDetails.getTelephoneFixe() != null) {
            medecin.setTelephoneFixe(medecinDetails.getTelephoneFixe());
        }
        if (medecinDetails.getLocalisation() != null) {
            medecin.setLocalisation(medecinDetails.getLocalisation());
        }

        return medecinRepository.save(medecin);
    }

    public void supprimerMedecin(String id) {
        Medecin medecin = obtenirMedecinParId(id);
        medecin.setActif(false);
        medecinRepository.save(medecin);
    }

    /**
     * Recherche un médecin existant (compte centralisé) par téléphone et/ou CIN pour rattachement à une clinique.
     */
    @Transactional(readOnly = true)
    public Optional<Medecin> rechercherMedecinPourRattachement(String telephone, String numeroPieceIdentite) {
        String cin = normalizeCin(numeroPieceIdentite);
        String tel = normalizePhonePourRecherche(telephone);
        if (cin == null && tel == null) {
            throw new RuntimeException("Fournissez le numéro de téléphone ou le CIN");
        }
        if (tel != null && cin != null) {
            Optional<Medecin> byTel = medecinRepository.findByTelephone(tel);
            if (byTel.isEmpty()) {
                return Optional.empty();
            }
            Medecin m = byTel.get();
            String mCin = normalizeCin(m.getNumeroPieceIdentite());
            if (mCin == null || !mCin.equals(cin)) {
                return Optional.empty();
            }
            return Optional.of(m);
        }
        if (tel != null) {
            return medecinRepository.findByTelephone(tel);
        }
        List<Medecin> byCin = medecinRepository.findAllByNumeroPieceIdentite(cin);
        if (byCin.isEmpty()) {
            return Optional.empty();
        }
        if (byCin.size() > 1) {
            throw new RuntimeException("Plusieurs médecins correspondent à ce CIN ; affinez avec le téléphone");
        }
        return Optional.of(byCin.get(0));
    }

    private String normalizePhonePourRecherche(String telephone) {
        if (telephone == null || telephone.isBlank()) {
            return null;
        }
        return tunisieSmsService.normalizeInternationalTunisia(telephone.trim());
    }

    /**
     * Rattache un médecin existant à la clinique (réutilise l'identifiant utilisateur / médecin centralisé).
     */
    @Transactional
    public Medecin rattacherMedecinAClinique(String cliniqueCibleId, String medecinUserId, CustomUserDetails currentUser) {
        if (medecinUserId == null || medecinUserId.isBlank()) {
            throw new RuntimeException("medecinId est obligatoire");
        }
        boolean superAdmin = "SUPER_ADMIN".equals(currentUser.getRole());
        if (!superAdmin) {
            if (!"ADMIN_CLINIQUE".equals(currentUser.getRole())
                    || currentUser.getCliniqueId() == null
                    || !currentUser.getCliniqueId().equals(cliniqueCibleId)) {
                throw new RuntimeException("Vous n'avez pas accès à cette clinique");
            }
        }
        Clinique clinique = cliniqueRepository.findById(cliniqueCibleId)
                .orElseThrow(() -> new RuntimeException("Clinique introuvable"));
        Medecin medecin = medecinRepository.findById(medecinUserId)
                .orElseThrow(() -> new RuntimeException("Médecin introuvable"));
        medecin.setClinique(clinique);
        return medecinRepository.save(medecin);
    }
}
