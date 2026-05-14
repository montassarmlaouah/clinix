package com.pfe.pfe.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.pfe.pfe.model.Infirmier;
import com.pfe.pfe.model.Medecin;
import com.pfe.pfe.repository.InfirmierRepository;
import com.pfe.pfe.repository.MedecinRepository;
import com.pfe.pfe.repository.PatientRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class InfirmierWorkspaceService {

    private final InfirmierRepository infirmierRepository;
    private final MedecinRepository medecinRepository;
    private final PatientRepository patientRepository;
    private final NotificationMetierService notificationMetierService;

    public void verifierEspaceInfirmier(String infirmierIdCible, String connecteId) {
        if (connecteId == null || connecteId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Session invalide.");
        }
        if (!connecteId.equals(infirmierIdCible)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès réservé à votre espace infirmier.");
        }
    }

    public void envoyerRapportFinJournee(String infirmierId, String message, String connecteId) {
        verifierEspaceInfirmier(infirmierId, connecteId);
        if (message == null || message.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message obligatoire.");
        }
        Infirmier inf = infirmierRepository.findById(infirmierId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Infirmier introuvable."));
        if (inf.getClinique() == null || inf.getClinique().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aucune clinique associée.");
        }
        String nomInf = (inf.getPrenom() != null ? inf.getPrenom() + " " : "") + (inf.getNom() != null ? inf.getNom() : "");
        List<Medecin> medecins = medecinRepository.findByCliniqueId(inf.getClinique().getId());
        String corps = "Rapport de fin de journée — " + nomInf.trim() + ".\n\n" + message;
        for (Medecin m : medecins) {
            try {
                notificationMetierService.notifyMedecinRapportInfirmierFinJournee(m.getId(), corps);
            } catch (Exception ignored) {
            }
        }
    }

    public void signalerAnomalieAuMedecin(String infirmierId, String medecinId, String patientId, String message, String connecteId) {
        verifierEspaceInfirmier(infirmierId, connecteId);
        if (medecinId == null || medecinId.isBlank() || message == null || message.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Médecin et message obligatoires.");
        }
        Infirmier inf = infirmierRepository.findById(infirmierId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Infirmier introuvable."));
        String nomInf = (inf.getPrenom() != null ? inf.getPrenom() + " " : "") + (inf.getNom() != null ? inf.getNom() : "");
        StringBuilder corps = new StringBuilder("Signalement de ").append(nomInf.trim()).append(".\n\n").append(message);
        if (patientId != null && !patientId.isBlank()) {
            patientRepository.findById(patientId).ifPresent(p ->
                    corps.append("\n\nPatient : ").append(p.getPrenom()).append(" ").append(p.getNom()));
        }
        try {
            notificationMetierService.notifyMedecinSignalementInfirmier(medecinId, "Signalement infirmier", corps.toString());
        } catch (Exception ignored) {
        }
    }
}
