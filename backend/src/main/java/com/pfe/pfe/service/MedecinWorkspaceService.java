package com.pfe.pfe.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.pfe.pfe.model.AdministrationTraitement;
import com.pfe.pfe.model.Infirmier;
import com.pfe.pfe.model.Medecin;
import com.pfe.pfe.repository.AdministrationTraitementRepository;
import com.pfe.pfe.repository.ConsultationRepository;
import com.pfe.pfe.repository.InfirmierRepository;
import com.pfe.pfe.repository.MedecinRepository;
import com.pfe.pfe.repository.OrdonnanceRepository;
import com.pfe.pfe.repository.PatientRepository;
import com.pfe.pfe.repository.RendezVousRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MedecinWorkspaceService {

    private final MedecinRepository medecinRepository;
    private final InfirmierRepository infirmierRepository;
    private final PatientRepository patientRepository;
    private final ConsultationRepository consultationRepository;
    private final OrdonnanceRepository ordonnanceRepository;
    private final RendezVousRepository rendezVousRepository;
    private final AdministrationTraitementRepository administrationTraitementRepository;

    public void verifierAccesEspaceMedecin(String medecinIdCible, String medecinConnecteId) {
        if (medecinConnecteId == null || medecinConnecteId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Session médecin invalide.");
        }
        if (!medecinConnecteId.equals(medecinIdCible)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès réservé à votre espace médecin.");
        }
    }

    public Map<String, Object> statistiques(String medecinId, String medecinConnecteId) {
        verifierAccesEspaceMedecin(medecinId, medecinConnecteId);

        LocalDateTime debutMois = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime finMois = debutMois.plusMonths(1);
        LocalDateTime debutJour = LocalDate.now().atStartOfDay();
        LocalDateTime finJour = debutJour.plusDays(1);

        long patientsCabinet = patientRepository.countByMedecinCabinetId(medecinId);
        long patientsConsultationsDistincts = consultationRepository.countDistinctPatientsByMedecinId(medecinId);
        long consultationsTotal = consultationRepository.countByMedecinId(medecinId);
        long consultationsCeMois = consultationRepository.countByMedecinIdAndDateBetween(medecinId, debutMois, finMois);
        long ordonnancesTotal = ordonnanceRepository.countByMedecinId(medecinId);
        long rdvAujourdhui = rendezVousRepository.countByMedecinIdAndDateHeureBetween(medecinId, debutJour, finJour);
        long soinsEnAttenteValidation = administrationTraitementRepository
                .countByMedecinDemandeurIdAndValidationStatutAndAdministre(medecinId, "EN_ATTENTE");

        Map<String, Object> m = new HashMap<>();
        m.put("patientsCabinet", patientsCabinet);
        m.put("patientsConsultationsDistincts", patientsConsultationsDistincts);
        m.put("consultationsTotal", consultationsTotal);
        m.put("consultationsCeMois", consultationsCeMois);
        m.put("ordonnancesTotal", ordonnancesTotal);
        m.put("rendezVousAujourdhui", rdvAujourdhui);
        m.put("soinsEnAttenteValidation", soinsEnAttenteValidation);
        return m;
    }

    public List<Infirmier> infirmiersMemeClinique(String medecinId, String medecinConnecteId) {
        verifierAccesEspaceMedecin(medecinId, medecinConnecteId);
        Medecin medecin = medecinRepository.findById(medecinId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Médecin introuvable."));
        if (medecin.getClinique() == null || medecin.getClinique().getId() == null) {
            return List.of();
        }
        return infirmierRepository.findByCliniqueId(medecin.getClinique().getId());
    }

    public List<AdministrationTraitement> suiviSoins(String medecinId, String medecinConnecteId) {
        verifierAccesEspaceMedecin(medecinId, medecinConnecteId);
        return administrationTraitementRepository.findSuiviPourMedecin(medecinId);
    }
}
