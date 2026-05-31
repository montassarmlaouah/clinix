package com.pfe.pfe.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.model.AdministrateurClinique;
import com.pfe.pfe.model.ChefPersonnel;
import com.pfe.pfe.model.Infirmier;
import com.pfe.pfe.model.Medecin;
import com.pfe.pfe.model.Pharmacien;
import com.pfe.pfe.model.Radiologue;
import com.pfe.pfe.model.Secretaire;
import com.pfe.pfe.model.TechnicienMaintenance;
import com.pfe.pfe.repository.AdministrateurCliniqueRepository;
import com.pfe.pfe.repository.ChefPersonnelRepository;
import com.pfe.pfe.repository.InfirmierRepository;
import com.pfe.pfe.repository.MedecinRepository;
import com.pfe.pfe.repository.PharmacienRepository;
import com.pfe.pfe.repository.RadiologueRepository;
import com.pfe.pfe.repository.SecretaireRepository;
import com.pfe.pfe.repository.TechnicienMaintenanceRepository;
import com.pfe.pfe.service.CreerPersonnelDTO;
import com.pfe.pfe.service.PersonnelService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Contrôleur unifié pour la gestion du personnel par l'Admin Clinique
 * Gère: MEDECIN, INFIRMIER, RADIOLOGUE, PHARMACIEN, SECRETAIRE, 
 *       CHEF_PERSONNEL, TECHNICIEN_MAINTENANCE
 */
@RestController
@RequestMapping("/api/personnel")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class PersonnelController {
    
    private final PersonnelService personnelService;
    private final AdministrateurCliniqueRepository adminCliniqueRepository;
    private final MedecinRepository medecinRepository;
    private final InfirmierRepository infirmierRepository;
    private final RadiologueRepository radiologueRepository;
    private final PharmacienRepository pharmacienRepository;
    private final SecretaireRepository secretaireRepository;
    private final ChefPersonnelRepository chefPersonnelRepository;
    private final TechnicienMaintenanceRepository technicienMaintenanceRepository;

    /**
     * Créer un membre du personnel (Admin Clinique)
     * POST /api/personnel
     * Body: { "telephone": "+212611223344", "role": "MEDECIN", "specialite": "Cardiologie" }
     */
    @PostMapping
    public ResponseEntity<?> creerPersonnel(
            @Valid @RequestBody CreerPersonnelDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String cliniqueId;
            if (isSuperAdmin(userDetails)) {
                if (dto.getRole() != null && "MEDECIN".equalsIgnoreCase(dto.getRole().trim())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("message", "Le Super Admin ne peut pas ajouter de médecin."));
                }
                cliniqueId = dto.getCliniqueId() != null ? dto.getCliniqueId().trim() : null;
                if (cliniqueId != null && cliniqueId.isEmpty()) {
                    cliniqueId = null;
                }
                log.info("Création personnel - Super Admin - Clinique: {}", cliniqueId);
            } else {
                String telephone = userDetails.getUsername();
                log.info("Création personnel - Admin connecté: {}", telephone);
                cliniqueId = resolveCliniqueId(telephone);
                log.info("Clinique de l'admin: {}", cliniqueId);
            }
            
            Map<String, Object> result = personnelService.creerPersonnel(dto, cliniqueId);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (RuntimeException e) {
            log.error("Erreur création personnel", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Recherche de médecins existants (rattachement à la clinique — nom, prénom, téléphone, CIN).
     */
    @GetMapping("/medecins/recherche-rattachement")
    public ResponseEntity<List<Map<String, Object>>> rechercherMedecinsRattachement(
            @RequestParam String q,
            @RequestParam(required = false) String cin) {
        return ResponseEntity.ok(personnelService.rechercherMedecinsPourRattachement(q, cin));
    }

    /**
     * Vérifie la disponibilité d'un numéro avant création (mobile / web).
     */
    @GetMapping("/verifier-telephone")
    public ResponseEntity<Map<String, Object>> verifierTelephone(
            @RequestParam String telephone,
            @RequestParam(required = false) String medecinExistantId) {
        return ResponseEntity.ok(personnelService.verifierTelephoneDisponible(telephone, medecinExistantId));
    }

    /**
     * Indique si un code PDF doit encore être confirmé (mode PDF_CODE).
     */
    @GetMapping("/code-invitation-en-attente")
    public ResponseEntity<Map<String, Object>> codeInvitationEnAttente(
            @RequestParam String telephone,
            @RequestParam String role) {
        boolean pending = personnelService.aCodeInvitationEnAttente(telephone, role);
        return ResponseEntity.ok(Map.of("codeInvitationEnAttente", pending));
    }

    /**
     * Confirme le code contenu dans le PDF d'invitation.
     */
    @PostMapping("/confirmer-code-invitation-pdf")
    public ResponseEntity<?> confirmerCodeInvitationPdf(@RequestBody Map<String, String> body) {
        try {
            String telephone = body.get("telephone");
            String role = body.get("role");
            String code = body.get("codeInvitationPdf");
            if (!org.springframework.util.StringUtils.hasText(code)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Code requis"));
            }
            personnelService.confirmerCodeInvitationPdf(telephone, role, code.trim());
            return ResponseEntity.ok(Map.of("message", "Code d'invitation confirmé."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Vérifier si un compte en attente existe
     * GET /api/personnel/verifier-compte/{telephone}/{role}
     */
    @GetMapping("/verifier-compte/{telephone}/{role}")
    public ResponseEntity<?> verifierCompteEnAttente(
            @PathVariable String telephone,
            @PathVariable String role) {
        boolean existe = personnelService.existeCompteEnAttente(telephone, role);
        return ResponseEntity.ok(Map.of(
            "telephone", telephone,
            "role", role,
            "compteEnAttente", existe,
            "message", existe ? "Compte en attente trouvé" : "Aucun compte en attente"
        ));
    }

    // ===== MÉDECINS =====
    
    @GetMapping("/medecins")
    public ResponseEntity<List<Medecin>> listerMedecins(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String cliniqueId) {
        String resolvedCliniqueId = resolveCliniqueIdForListing(userDetails, cliniqueId);
        List<Medecin> medecins = resolvedCliniqueId == null
            ? medecinRepository.findAll()
            : medecinRepository.findByCliniqueId(resolvedCliniqueId);
        return ResponseEntity.ok(medecins);
    }

    @GetMapping("/medecins/{id}")
    public ResponseEntity<Medecin> obtenirMedecin(@PathVariable String id) {
        return medecinRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/medecins/{id}")
    public ResponseEntity<?> supprimerMedecin(@PathVariable String id) {
        medecinRepository.findById(id).ifPresent(m -> {
            m.setActif(false);
            medecinRepository.save(m);
        });
        return ResponseEntity.ok(Map.of("message", "Médecin désactivé"));
    }

    @PutMapping("/medecins/{id}/reactiver")
    public ResponseEntity<?> reactiverMedecin(@PathVariable String id) {
        return reactiverMembre("MEDECIN", id, "Médecin réactivé");
    }

    // ===== INFIRMIERS =====
    
    @GetMapping("/infirmiers")
    public ResponseEntity<List<Infirmier>> listerInfirmiers(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String cliniqueId) {
        String resolvedCliniqueId = resolveCliniqueIdForListing(userDetails, cliniqueId);
        List<Infirmier> infirmiers = resolvedCliniqueId == null
            ? infirmierRepository.findAll()
            : infirmierRepository.findByCliniqueId(resolvedCliniqueId);
        return ResponseEntity.ok(infirmiers);
    }

    private String resolveCliniqueId(String telephone) {
        AdministrateurClinique admin = adminCliniqueRepository.findByTelephone(telephone).orElse(null);
        if (admin != null && admin.getClinique() != null) {
            return admin.getClinique().getId();
        }
        ChefPersonnel chef = chefPersonnelRepository.findByTelephone(telephone).orElse(null);
        if (chef != null && chef.getClinique() != null) {
            return chef.getClinique().getId();
        }
        throw new RuntimeException("Clinique non trouvée pour l'utilisateur connecté");
    }

    private String resolveCliniqueIdForListing(UserDetails userDetails, String cliniqueId) {
        if (isSuperAdmin(userDetails)) {
            return (cliniqueId == null || cliniqueId.trim().isEmpty()) ? null : cliniqueId.trim();
        }
        return resolveCliniqueId(userDetails.getUsername());
    }

    private boolean isSuperAdmin(UserDetails userDetails) {
        return userDetails != null && userDetails.getAuthorities().stream()
            .map(auth -> auth.getAuthority() == null ? "" : auth.getAuthority().trim().toUpperCase().replace('-', '_'))
            .anyMatch(authority -> "ROLE_SUPER_ADMIN".equals(authority) || "SUPER_ADMIN".equals(authority));
    }

    @GetMapping("/infirmiers/{id}")
    public ResponseEntity<Infirmier> obtenirInfirmier(@PathVariable String id) {
        return infirmierRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/infirmiers/{id}")
    public ResponseEntity<?> supprimerInfirmier(@PathVariable String id) {
        infirmierRepository.findById(id).ifPresent(i -> {
            i.setActif(false);
            infirmierRepository.save(i);
        });
        return ResponseEntity.ok(Map.of("message", "Infirmier désactivé"));
    }

    @PutMapping("/infirmiers/{id}/reactiver")
    public ResponseEntity<?> reactiverInfirmier(@PathVariable String id) {
        return reactiverMembre("INFIRMIER", id, "Infirmier réactivé");
    }

    // ===== RADIOLOGUES =====
    
    @GetMapping("/radiologues")
    public ResponseEntity<List<Radiologue>> listerRadiologues(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String cliniqueId) {
        String resolvedCliniqueId = resolveCliniqueIdForListing(userDetails, cliniqueId);
        List<Radiologue> radiologues = resolvedCliniqueId == null
            ? radiologueRepository.findAll()
            : radiologueRepository.findByCliniqueId(resolvedCliniqueId);
        return ResponseEntity.ok(radiologues);
    }

    @GetMapping("/radiologues/{id}")
    public ResponseEntity<Radiologue> obtenirRadiologue(@PathVariable String id) {
        return radiologueRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/radiologues/{id}")
    public ResponseEntity<?> supprimerRadiologue(@PathVariable String id) {
        radiologueRepository.findById(id).ifPresent(r -> {
            r.setActif(false);
            radiologueRepository.save(r);
        });
        return ResponseEntity.ok(Map.of("message", "Radiologue désactivé"));
    }

    @PutMapping("/radiologues/{id}/reactiver")
    public ResponseEntity<?> reactiverRadiologue(@PathVariable String id) {
        return reactiverMembre("RADIOLOGUE", id, "Radiologue réactivé");
    }

    // ===== PHARMACIENS =====
    
    @GetMapping("/pharmaciens")
    public ResponseEntity<List<Pharmacien>> listerPharmaciens(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String cliniqueId) {
        String resolvedCliniqueId = resolveCliniqueIdForListing(userDetails, cliniqueId);
        List<Pharmacien> pharmaciens = resolvedCliniqueId == null
            ? pharmacienRepository.findAll()
            : pharmacienRepository.findByCliniqueId(resolvedCliniqueId);
        return ResponseEntity.ok(pharmaciens);
    }

    @GetMapping("/pharmaciens/{id}")
    public ResponseEntity<Pharmacien> obtenirPharmacien(@PathVariable String id) {
        return pharmacienRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/pharmaciens/{id}")
    public ResponseEntity<?> supprimerPharmacien(@PathVariable String id) {
        pharmacienRepository.findById(id).ifPresent(p -> {
            p.setActif(false);
            pharmacienRepository.save(p);
        });
        return ResponseEntity.ok(Map.of("message", "Pharmacien désactivé"));
    }

    @PutMapping("/pharmaciens/{id}/reactiver")
    public ResponseEntity<?> reactiverPharmacien(@PathVariable String id) {
        return reactiverMembre("PHARMACIEN", id, "Pharmacien réactivé");
    }

    // ===== SECRÉTAIRES =====
    
    @GetMapping("/secretaires")
    public ResponseEntity<List<Secretaire>> listerSecretaires(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String cliniqueId) {
        String resolvedCliniqueId = resolveCliniqueIdForListing(userDetails, cliniqueId);
        List<Secretaire> secretaires = resolvedCliniqueId == null
            ? secretaireRepository.findAll()
            : secretaireRepository.findByCliniqueId(resolvedCliniqueId);
        return ResponseEntity.ok(secretaires);
    }

    @GetMapping("/secretaires/{id}")
    public ResponseEntity<Secretaire> obtenirSecretaire(@PathVariable String id) {
        return secretaireRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/secretaires/{id}")
    public ResponseEntity<?> supprimerSecretaire(@PathVariable String id) {
        secretaireRepository.findById(id).ifPresent(s -> {
            s.setActif(false);
            secretaireRepository.save(s);
        });
        return ResponseEntity.ok(Map.of("message", "Secrétaire désactivé"));
    }

    @PutMapping("/secretaires/{id}/reactiver")
    public ResponseEntity<?> reactiverSecretaire(@PathVariable String id) {
        return reactiverMembre("SECRETAIRE", id, "Secrétaire réactivé");
    }

    // ===== CHEFS PERSONNEL =====
    
    @GetMapping("/chefs-personnel")
    public ResponseEntity<List<ChefPersonnel>> listerChefsPersonnel(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String cliniqueId) {
        String resolvedCliniqueId = resolveCliniqueIdForListing(userDetails, cliniqueId);
        List<ChefPersonnel> chefs = resolvedCliniqueId == null
            ? chefPersonnelRepository.findAll()
            : chefPersonnelRepository.findByCliniqueId(resolvedCliniqueId);
        return ResponseEntity.ok(chefs);
    }

    @GetMapping("/chefs-personnel/{id}")
    public ResponseEntity<ChefPersonnel> obtenirChefPersonnel(@PathVariable String id) {
        return chefPersonnelRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/chefs-personnel/{id}")
    public ResponseEntity<?> supprimerChefPersonnel(@PathVariable String id) {
        chefPersonnelRepository.findById(id).ifPresent(c -> {
            c.setActif(false);
            chefPersonnelRepository.save(c);
        });
        return ResponseEntity.ok(Map.of("message", "Chef personnel désactivé"));
    }

    @PutMapping("/chefs-personnel/{id}/reactiver")
    public ResponseEntity<?> reactiverChefPersonnel(@PathVariable String id) {
        return reactiverMembre("CHEF_PERSONNEL", id, "Chef personnel réactivé");
    }

    // ===== TECHNICIENS MAINTENANCE =====
    
    @GetMapping("/techniciens-maintenance")
    public ResponseEntity<List<TechnicienMaintenance>> listerTechniciensMaintenance(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String cliniqueId) {
        String resolvedCliniqueId = resolveCliniqueIdForListing(userDetails, cliniqueId);
        List<TechnicienMaintenance> techniciens = resolvedCliniqueId == null
            ? technicienMaintenanceRepository.findAll()
            : technicienMaintenanceRepository.findByCliniqueId(resolvedCliniqueId);
        return ResponseEntity.ok(techniciens);
    }

    @GetMapping("/techniciens-maintenance/{id}")
    public ResponseEntity<TechnicienMaintenance> obtenirTechnicienMaintenance(@PathVariable String id) {
        return technicienMaintenanceRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/techniciens-maintenance/{id}")
    public ResponseEntity<?> supprimerTechnicienMaintenance(@PathVariable String id) {
        technicienMaintenanceRepository.findById(id).ifPresent(t -> {
            t.setActif(false);
            technicienMaintenanceRepository.save(t);
        });
        return ResponseEntity.ok(Map.of("message", "Technicien maintenance désactivé"));
    }

    @PutMapping("/techniciens-maintenance/{id}/reactiver")
    public ResponseEntity<?> reactiverTechnicienMaintenance(@PathVariable String id) {
        return reactiverMembre("TECHNICIEN_MAINTENANCE", id, "Technicien maintenance réactivé");
    }

    private ResponseEntity<?> reactiverMembre(String role, String id, String successMessage) {
        try {
            personnelService.reactiverMembre(role, id);
            return ResponseEntity.ok(Map.of("message", successMessage));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
