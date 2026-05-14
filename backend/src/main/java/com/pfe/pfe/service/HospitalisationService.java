package com.pfe.pfe.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pfe.pfe.dto.NoteHospitalisationRequest;
import com.pfe.pfe.model.Chambre;
import com.pfe.pfe.model.Hospitalisation;
import com.pfe.pfe.model.NoteHospitalisation;
import com.pfe.pfe.repository.ChambreRepository;
import com.pfe.pfe.repository.HospitalisationRepository;
import com.pfe.pfe.repository.NoteHospitalisationRepository;
import com.pfe.pfe.repository.PatientRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class HospitalisationService {
    
    private final HospitalisationRepository hospitalisationRepository;
    private final PatientRepository patientRepository;
    private final ChambreRepository chambreRepository;
    private final NoteHospitalisationRepository noteHospitalisationRepository;
    
    public Hospitalisation creerHospitalisation(Hospitalisation hospitalisation) {
        // Forcer l'ID à null pour éviter les conflits (l'ID sera auto-généré)
        hospitalisation.setId(null);
        
        // Vérifier que le patient existe
        patientRepository.findById(hospitalisation.getPatient().getId())
            .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        
        // Vérifier si la chambre est disponible
        if (hospitalisation.getChambre() != null) {
            Chambre chambre = chambreRepository.findById(hospitalisation.getChambre().getId())
                .orElseThrow(() -> new RuntimeException("Chambre non trouvée"));
            
            if (!chambre.getDisponible()) {
                throw new RuntimeException("Chambre non disponible");
            }
            
            // Marquer la chambre comme occupée
            chambre.setDisponible(false);
            chambreRepository.save(chambre);
        }
        
        hospitalisation.setStatut(Hospitalisation.StatutHospitalisation.EN_COURS);
        return hospitalisationRepository.save(hospitalisation);
    }
    
    public List<Hospitalisation> obtenirToutesLesHospitalisations() {
        return hospitalisationRepository.findAll();
    }
    
    public Hospitalisation obtenirHospitalisationParId(String id) {
        return hospitalisationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Hospitalisation non trouvée"));
    }
    
    public List<Hospitalisation> obtenirHospitalisationsParPatient(String patientId) {
        return hospitalisationRepository.findByPatientId(patientId);
    }
    
    public List<Hospitalisation> obtenirHospitalisationsEnCours() {
        return hospitalisationRepository.findByStatut(Hospitalisation.StatutHospitalisation.EN_COURS);
    }
    
    public Hospitalisation terminerHospitalisation(String id, LocalDate dateSortie) {
        Hospitalisation hospitalisation = obtenirHospitalisationParId(id);
        
        if (hospitalisation.getDateSortie() != null) {
            throw new RuntimeException("Cette hospitalisation est déjà terminée");
        }
        
        hospitalisation.setDateSortie(dateSortie);
        hospitalisation.setStatut(Hospitalisation.StatutHospitalisation.TERMINEE);
        
        // Libérer la chambre
        if (hospitalisation.getChambre() != null) {
            Chambre chambre = hospitalisation.getChambre();
            chambre.setDisponible(true);
            chambreRepository.save(chambre);
        }
        
        return hospitalisationRepository.save(hospitalisation);
    }
    
    public Hospitalisation mettreAJourHospitalisation(String id, Hospitalisation hospitalisationDetails) {
        Hospitalisation hospitalisation = obtenirHospitalisationParId(id);
        
        hospitalisation.setMotif(hospitalisationDetails.getMotif());
        
        return hospitalisationRepository.save(hospitalisation);
    }

    public List<NoteHospitalisation> obtenirNotes(String hospitalisationId) {
        obtenirHospitalisationParId(hospitalisationId);
        return noteHospitalisationRepository.findByHospitalisationIdOrderByDateCreationDesc(hospitalisationId);
    }

    public NoteHospitalisation ajouterNote(String hospitalisationId, NoteHospitalisationRequest request) {
        Hospitalisation hospitalisation = obtenirHospitalisationParId(hospitalisationId);

        if (request.getContenu() == null || request.getContenu().trim().isEmpty()) {
            throw new RuntimeException("Le contenu de la note est obligatoire");
        }
        if (request.getAuteurId() == null || request.getAuteurId().trim().isEmpty()) {
            throw new RuntimeException("Auteur invalide");
        }

        NoteHospitalisation note = new NoteHospitalisation();
        note.setHospitalisation(hospitalisation);
        note.setContenu(request.getContenu().trim());
        note.setAuteurId(request.getAuteurId().trim());
        note.setAuteurNom(
                request.getAuteurNom() == null || request.getAuteurNom().trim().isEmpty()
                        ? "Utilisateur"
                        : request.getAuteurNom().trim()
        );
        note.setAuteurRole(
                request.getAuteurRole() == null || request.getAuteurRole().trim().isEmpty()
                        ? "ROLE_INCONNU"
                        : request.getAuteurRole().trim()
        );
        note.setDateCreation(java.time.LocalDateTime.now());

        return noteHospitalisationRepository.save(note);
    }
}
