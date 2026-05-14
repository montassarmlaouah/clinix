package com.pfe.pfe.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.dto.CreerCliniqueAvecAdminDTO;
import com.pfe.pfe.dto.EnregistrementAdminCliniqueDTO;
import com.pfe.pfe.dto.VerificationTelephoneResponse;
import com.pfe.pfe.model.AdministrateurClinique;
import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.service.CliniqueService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/cliniques")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CliniqueController {
    
    private final CliniqueService cliniqueService;
    
    @PostMapping
    public ResponseEntity<Clinique> creerClinique(@RequestBody Clinique clinique) {
        Clinique nouvelleClinique = cliniqueService.creerClinique(clinique);
        return new ResponseEntity<>(nouvelleClinique, HttpStatus.CREATED);
    }
    
    @GetMapping
    public ResponseEntity<List<Clinique>> obtenirToutesLesCliniques() {
        List<Clinique> cliniques = cliniqueService.obtenirToutesLesCliniques();
        return ResponseEntity.ok(cliniques);
    }
    
    @GetMapping("/actives")
    public ResponseEntity<List<Clinique>> obtenirCliniquesActives() {
        List<Clinique> cliniques = cliniqueService.obtenirCliniquesActives();
        return ResponseEntity.ok(cliniques);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Clinique> obtenirCliniqueParId(@PathVariable String id) {
        Clinique clinique = cliniqueService.obtenirCliniqueParId(id);
        return ResponseEntity.ok(clinique);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Clinique> mettreAJourClinique(
            @PathVariable String id,
            @RequestBody Clinique clinique) {
        Clinique cliniqueMAJ = cliniqueService.mettreAJourClinique(id, clinique);
        return ResponseEntity.ok(cliniqueMAJ);
    }
    
    @GetMapping("/{id}/occupation")
    public ResponseEntity<Integer> calculerOccupation(@PathVariable String id) {
        Integer occupation = cliniqueService.calculerOccupation(id);
        return ResponseEntity.ok(occupation);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerClinique(@PathVariable String id) {
        cliniqueService.deleteClinique(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Endpoint pour le super admin : Créer une clinique avec son administrateur
     * POST /api/cliniques/avec-administrateur
     * 
     * Body exemple:
     * {
     *   "nomClinique": "Clinique du Nord",
     *   "adresseClinique": "123 Rue Principale",
     *   "capacite": 100,
     *   "telephoneClinique": "0123456789",
     *   "nomAdmin": "Dupont",
     *   "prenomAdmin": "Jean",
     *   "telephoneAdmin": "0612345678"
     * }
     */
    @PostMapping("/avec-administrateur")
    public ResponseEntity<Clinique> creerCliniqueAvecAdministrateur(
            @RequestBody CreerCliniqueAvecAdminDTO dto) {
        Clinique clinique = cliniqueService.creerCliniqueAvecAdministrateur(dto);
        return new ResponseEntity<>(clinique, HttpStatus.CREATED);
    }
    
    /**
     * Endpoint pour vérifier si un téléphone existe
     * GET /api/cliniques/admin/verifier-telephone/{telephone}
     * 
     * Retourne les informations du compte s'il existe
     */
    @GetMapping("/admin/verifier-telephone/{telephone}")
    public ResponseEntity<VerificationTelephoneResponse> verifierTelephone(
            @PathVariable String telephone) {
        VerificationTelephoneResponse response = cliniqueService.verifierTelephone(telephone);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint pour l'enregistrement de l'administrateur de clinique
     * POST /api/cliniques/admin/enregistrer
     *
     * L'admin utilise son téléphone pour définir son mot de passe
     *
     * Body exemple:
     * {
     *   "telephone": "0612345678",
     *   "motDePasse": "MonMotDePasse123!",
     *   "confirmationMotDePasse": "MonMotDePasse123!"
     * }
     */
    @PostMapping("/admin/enregistrer")
    public ResponseEntity<Map<String, String>> enregistrerAdminClinique(
            @RequestBody EnregistrementAdminCliniqueDTO dto) {
        AdministrateurClinique admin = cliniqueService.enregistrerAdminClinique(dto);
        return ResponseEntity.ok(Map.of(
            "message", "Enregistrement réussi. Vous pouvez maintenant vous connecter.",
            "id", admin.getId(),
            "nom", admin.getNom(),
            "prenom", admin.getPrenom(),
            "telephone", admin.getTelephone()
        ));
    }
}
