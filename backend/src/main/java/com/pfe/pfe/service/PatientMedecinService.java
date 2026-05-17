package com.pfe.pfe.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pfe.pfe.dto.MedecinAttributionDto;
import com.pfe.pfe.model.Medecin;
import com.pfe.pfe.model.Patient;
import com.pfe.pfe.model.PatientMedecin;
import com.pfe.pfe.repository.MedecinRepository;
import com.pfe.pfe.repository.PatientMedecinRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PatientMedecinService {

    private final PatientMedecinRepository patientMedecinRepository;
    private final MedecinRepository medecinRepository;

    public void synchroniserMedecins(Patient patient, List<String> medecinIds, String medecinReferentId) {
        if (patient == null || patient.getId() == null) {
            return;
        }

        Set<String> ids = new HashSet<>();
        if (medecinIds != null) {
            for (String id : medecinIds) {
                if (StringUtils.hasText(id)) {
                    ids.add(id.trim());
                }
            }
        }
        if (StringUtils.hasText(medecinReferentId)) {
            ids.add(medecinReferentId.trim());
        }

        List<PatientMedecin> actuels = patientMedecinRepository.findByPatientIdOrderByPrincipalDescDateAttributionAsc(patient.getId());
        for (PatientMedecin pm : actuels) {
            if (pm.getMedecin() != null && !ids.contains(pm.getMedecin().getId())) {
                patientMedecinRepository.delete(pm);
            }
        }

        if (ids.isEmpty()) {
            return;
        }

        String referent = StringUtils.hasText(medecinReferentId) ? medecinReferentId.trim() : ids.iterator().next();

        patientMedecinRepository.clearPrincipalForPatient(patient.getId());

        for (String medecinId : ids) {
            Medecin medecin = medecinRepository.findById(medecinId)
                .orElseThrow(() -> new RuntimeException("Médecin introuvable : " + medecinId));

            PatientMedecin lien = patientMedecinRepository.findByPatientIdAndMedecinId(patient.getId(), medecinId)
                .orElseGet(() -> {
                    PatientMedecin pm = new PatientMedecin();
                    pm.setPatient(patient);
                    pm.setMedecin(medecin);
                    pm.setDateAttribution(LocalDateTime.now());
                    return pm;
                });
            lien.setPrincipal(medecinId.equals(referent));
            patientMedecinRepository.save(lien);
        }
    }

    public void ajouterMedecin(Patient patient, Medecin medecin, boolean principal) {
        if (patient == null || medecin == null || patient.getId() == null) {
            return;
        }
        if (patientMedecinRepository.existsByPatientIdAndMedecinId(patient.getId(), medecin.getId())) {
            if (principal) {
                patientMedecinRepository.clearPrincipalForPatient(patient.getId());
                patientMedecinRepository.findByPatientIdAndMedecinId(patient.getId(), medecin.getId())
                    .ifPresent(pm -> {
                        pm.setPrincipal(true);
                        patientMedecinRepository.save(pm);
                    });
            }
            return;
        }
        if (principal) {
            patientMedecinRepository.clearPrincipalForPatient(patient.getId());
        }
        PatientMedecin pm = new PatientMedecin();
        pm.setPatient(patient);
        pm.setMedecin(medecin);
        pm.setPrincipal(principal);
        pm.setDateAttribution(LocalDateTime.now());
        patientMedecinRepository.save(pm);
    }

    @Transactional(readOnly = true)
    public void enrichirMedecins(Patient patient) {
        if (patient == null || patient.getId() == null) {
            return;
        }
        List<PatientMedecin> liens = patientMedecinRepository.findByPatientIdOrderByPrincipalDescDateAttributionAsc(patient.getId());
        List<MedecinAttributionDto> medecins = new ArrayList<>();
        List<String> ids = new ArrayList<>();
        String referentId = null;
        String referentNom = null;

        for (PatientMedecin lien : liens) {
            Medecin m = lien.getMedecin();
            if (m == null) continue;
            ids.add(m.getId());
            medecins.add(new MedecinAttributionDto(
                m.getId(),
                m.getNom(),
                m.getPrenom(),
                m.getSpecialite(),
                Boolean.TRUE.equals(lien.getPrincipal())
            ));
            if (Boolean.TRUE.equals(lien.getPrincipal())) {
                referentId = m.getId();
                referentNom = "Dr " + (m.getPrenom() != null ? m.getPrenom() : "") + " " + (m.getNom() != null ? m.getNom() : "");
                referentNom = referentNom.trim();
            }
        }

        if (referentId == null && !medecins.isEmpty()) {
            MedecinAttributionDto first = medecins.get(0);
            referentId = first.getId();
            referentNom = "Dr " + (first.getPrenom() != null ? first.getPrenom() : "") + " " + (first.getNom() != null ? first.getNom() : "");
            referentNom = referentNom.trim();
        }

        patient.setMedecinIds(ids);
        patient.setMedecins(medecins);
        patient.setMedecinReferentId(referentId);
        patient.setMedecinReferentNom(referentNom);
    }

    @Transactional(readOnly = true)
    public void enrichirMedecins(List<Patient> patients) {
        if (patients == null || patients.isEmpty()) {
            return;
        }
        List<String> patientIds = patients.stream().map(Patient::getId).filter(id -> id != null).toList();
        if (patientIds.isEmpty()) {
            return;
        }
        List<PatientMedecin> all = patientMedecinRepository.findByPatientIdInWithMedecin(patientIds);
        var byPatient = all.stream().collect(Collectors.groupingBy(pm -> pm.getPatient().getId()));

        for (Patient patient : patients) {
            List<PatientMedecin> liens = byPatient.getOrDefault(patient.getId(), List.of());
            List<MedecinAttributionDto> medecins = new ArrayList<>();
            List<String> ids = new ArrayList<>();
            String referentId = null;
            String referentNom = null;

            liens.sort((a, b) -> Boolean.compare(Boolean.TRUE.equals(b.getPrincipal()), Boolean.TRUE.equals(a.getPrincipal())));

            for (PatientMedecin lien : liens) {
                Medecin m = lien.getMedecin();
                if (m == null) continue;
                ids.add(m.getId());
                medecins.add(new MedecinAttributionDto(
                    m.getId(), m.getNom(), m.getPrenom(), m.getSpecialite(), Boolean.TRUE.equals(lien.getPrincipal())
                ));
                if (Boolean.TRUE.equals(lien.getPrincipal())) {
                    referentId = m.getId();
                    referentNom = ("Dr " + (m.getPrenom() != null ? m.getPrenom() : "") + " "
                        + (m.getNom() != null ? m.getNom() : "")).trim();
                }
            }
            if (referentId == null && !medecins.isEmpty()) {
                MedecinAttributionDto first = medecins.get(0);
                referentId = first.getId();
                referentNom = ("Dr " + (first.getPrenom() != null ? first.getPrenom() : "") + " "
                    + (first.getNom() != null ? first.getNom() : "")).trim();
            }
            patient.setMedecinIds(ids);
            patient.setMedecins(medecins);
            patient.setMedecinReferentId(referentId);
            patient.setMedecinReferentNom(referentNom);
        }
    }
}
