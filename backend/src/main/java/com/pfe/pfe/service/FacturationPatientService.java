package com.pfe.pfe.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pfe.pfe.dto.GenererFactureRequest;
import com.pfe.pfe.dto.LignePrestationRequest;
import com.pfe.pfe.dto.PrestationFacturationRequest;
import com.pfe.pfe.dto.TeletransmissionResult;
import com.pfe.pfe.dto.ValiderPaiementRequest;
import com.pfe.pfe.model.Chambre;
import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.model.FacturePatient;
import com.pfe.pfe.model.Hospitalisation;
import com.pfe.pfe.model.LigneFacturePatient;
import com.pfe.pfe.model.PrestationFacturation;
import com.pfe.pfe.model.StatutFacturePatient;
import com.pfe.pfe.model.TypePrestation;
import com.pfe.pfe.repository.ChambreRepository;
import com.pfe.pfe.repository.CliniqueRepository;
import com.pfe.pfe.repository.FacturePatientRepository;
import com.pfe.pfe.repository.HospitalisationRepository;
import com.pfe.pfe.repository.PrestationFacturationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FacturationPatientService {

    private final FacturePatientRepository facturePatientRepository;
    private final PrestationFacturationRepository prestationRepository;
    private final HospitalisationRepository hospitalisationRepository;
    private final ChambreRepository chambreRepository;
    private final CliniqueRepository cliniqueRepository;
    private final FacturePatientPdfService facturePatientPdfService;

    @Transactional(readOnly = true)
    public List<PrestationFacturation> listerPrestations(String cliniqueId) {
        return listerPrestations(cliniqueId, false);
    }

    @Transactional(readOnly = true)
    public List<PrestationFacturation> listerPrestations(String cliniqueId, boolean inclureInactives) {
        ensurePrestationsClinique(cliniqueId);
        if (inclureInactives) {
            return prestationRepository.findByCliniqueIdOrderByTypeAscCodeAsc(cliniqueId);
        }
        return prestationRepository.findByCliniqueIdAndActifTrueOrderByTypeAscCodeAsc(cliniqueId);
    }

    @Transactional(readOnly = true)
    public List<FacturePatient> listerParClinique(String cliniqueId) {
        return listerParClinique(cliniqueId, null);
    }

    @Transactional(readOnly = true)
    public List<FacturePatient> listerParClinique(String cliniqueId, StatutFacturePatient statut) {
        if (statut == null) {
            return facturePatientRepository.findByCliniqueWithDetails(cliniqueId);
        }
        return facturePatientRepository.findByCliniqueAndStatutWithDetails(cliniqueId, statut);
    }

    public PrestationFacturation modifierPrestation(String id, PrestationFacturationRequest request) {
        PrestationFacturation p = prestationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Prestation non trouvée"));
        validerPrestationRequest(request, p.getCliniqueId(), p.getType(), id);
        appliquerPrestationRequest(p, request);
        return prestationRepository.save(p);
    }

    public List<PrestationFacturation> forcerInitialisationCatalogue(String cliniqueId) {
        cliniqueRepository.findById(cliniqueId)
            .orElseThrow(() -> new RuntimeException("Clinique non trouvée"));
        if (prestationRepository.existsByCliniqueId(cliniqueId)) {
            throw new RuntimeException("Le catalogue existe déjà. Modifiez les prestations existantes.");
        }
        initialiserPrestationsParDefaut(cliniqueId);
        return prestationRepository.findByCliniqueIdOrderByTypeAscCodeAsc(cliniqueId);
    }

    @Transactional(readOnly = true)
    public FacturePatient obtenir(String id) {
        return facturePatientRepository.findByIdWithDetails(id)
            .orElseThrow(() -> new RuntimeException("Facture non trouvée"));
    }

    public FacturePatient genererDepuisHospitalisation(GenererFactureRequest request) {
        if (request.getHospitalisationId() == null || request.getHospitalisationId().isBlank()) {
            throw new RuntimeException("hospitalisationId obligatoire");
        }

        Hospitalisation hosp = hospitalisationRepository.findByIdWithDetails(request.getHospitalisationId())
            .orElseThrow(() -> new RuntimeException("Hospitalisation non trouvée"));

        facturePatientRepository.findByHospitalisationId(hosp.getId()).ifPresent(f -> {
            throw new RuntimeException("Une facture existe déjà pour cette hospitalisation");
        });

        Clinique clinique = hosp.getMedecin().getClinique();
        if (clinique == null) {
            throw new RuntimeException("Clinique introuvable pour cette hospitalisation");
        }

        LocalDate dateSortie = hosp.getDateSortie() != null ? hosp.getDateSortie() : LocalDate.now();
        if (hosp.getDateSortie() == null) {
            hosp.setDateSortie(dateSortie);
            hosp.setStatut(Hospitalisation.StatutHospitalisation.TERMINEE);
            if (hosp.getChambre() != null) {
                Chambre chambre = hosp.getChambre();
                chambre.setDisponible(true);
                chambreRepository.save(chambre);
            }
            hospitalisationRepository.save(hosp);
        }

        int jours = calculerJoursHospitalisation(hosp.getDateEntree(), dateSortie);
        ensurePrestationsClinique(clinique.getId());

        FacturePatient facture = new FacturePatient();
        facture.setNumeroFacture(genererNumeroFacture());
        facture.setPatient(hosp.getPatient());
        facture.setClinique(clinique);
        facture.setHospitalisation(hosp);
        facture.setDateFacture(LocalDate.now());
        facture.setDateSortie(dateSortie);
        facture.setNombreJours(jours);
        facture.setStatut(StatutFacturePatient.BROUILLON);

        PrestationFacturation hospPresta = prestationRepository
            .findByCliniqueIdAndTypeAndActifTrue(clinique.getId(), TypePrestation.HOSPITALISATION)
            .orElseThrow(() -> new RuntimeException("Prestation hospitalisation non configurée"));

        ajouterLigne(facture, hospPresta, jours);

        if (request.getPrestationsSupplementaires() != null) {
            for (LignePrestationRequest ligneReq : request.getPrestationsSupplementaires()) {
                if (ligneReq.getType() == null) continue;
                if (ligneReq.getType() == TypePrestation.HOSPITALISATION) continue;
                int qte = ligneReq.getQuantite() != null && ligneReq.getQuantite() > 0 ? ligneReq.getQuantite() : 1;
                PrestationFacturation presta = prestationRepository
                    .findByCliniqueIdAndTypeAndActifTrue(clinique.getId(), ligneReq.getType())
                    .orElseThrow(() -> new RuntimeException("Prestation non trouvée : " + ligneReq.getType()));
                ajouterLigne(facture, presta, qte);
            }
        }

        recalculerTotaux(facture);
        return facturePatientRepository.save(facture);
    }

    public FacturePatient emettre(String id) {
        FacturePatient facture = obtenir(id);
        if (facture.getStatut() != StatutFacturePatient.BROUILLON) {
            throw new RuntimeException("Seule une facture en brouillon peut être émise");
        }
        facture.setStatut(StatutFacturePatient.EMISE);
        return facturePatientRepository.save(facture);
    }

    public FacturePatient validerPaiement(String id, ValiderPaiementRequest request) {
        FacturePatient facture = obtenir(id);
        if (facture.getStatut() == StatutFacturePatient.PAYEE) {
            throw new RuntimeException("Facture déjà payée");
        }
        if (facture.getStatut() == StatutFacturePatient.TELETRANSMIS) {
            throw new RuntimeException("Facture déjà télétransmise");
        }
        if (facture.getStatut() == StatutFacturePatient.BROUILLON) {
            throw new RuntimeException("Émettez la facture avant de valider le paiement");
        }

        BigDecimal montant = request.getMontantPaye() != null
            ? request.getMontantPaye()
            : facture.getTicketModerateur();

        if (montant.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Montant invalide");
        }

        facture.setMontantPaye(montant);
        facture.setStatut(StatutFacturePatient.PAYEE);
        if (request.getModePaiement() != null && !request.getModePaiement().isBlank()) {
            String note = "Paiement : " + request.getModePaiement();
            facture.setNotes(facture.getNotes() == null ? note : facture.getNotes() + " | " + note);
        }
        return facturePatientRepository.save(facture);
    }

    public TeletransmissionResult teletransmettre(String id) {
        FacturePatient facture = obtenir(id);
        if (facture.getStatut() == StatutFacturePatient.TELETRANSMIS) {
            throw new RuntimeException("Facture déjà télétransmise");
        }
        if (facture.getStatut() == StatutFacturePatient.BROUILLON) {
            throw new RuntimeException("Émettez la facture avant la télétransmission CNAM");
        }

        String ref = "CNAM-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        facture.setReferenceTeletransmission(ref);
        facture.setDateTeletransmission(LocalDateTime.now());
        facture.setStatut(StatutFacturePatient.TELETRANSMIS);
        facturePatientRepository.save(facture);

        return new TeletransmissionResult(
            "TELETRANSMIS",
            ref,
            "Prise en charge transmise (simulation SESAM-Vitale / CNAM)",
            facture.getMontantRemboursable(),
            facture.getDateTeletransmission()
        );
    }

    @Transactional(readOnly = true)
    public byte[] genererPdf(String id) {
        return facturePatientPdfService.genererPdf(id);
    }

    public void ensurePrestationsClinique(String cliniqueId) {
        if (!prestationRepository.existsByCliniqueId(cliniqueId)) {
            initialiserPrestationsParDefaut(cliniqueId);
        }
    }

    public void initialiserPrestationsParDefaut(String cliniqueId) {
        cliniqueRepository.findById(cliniqueId)
            .orElseThrow(() -> new RuntimeException("Clinique non trouvée"));

        creerPrestation(cliniqueId, TypePrestation.HOSPITALISATION, "K50", "Hospitalisation (journée)", bd("85.000"), 80);
        creerPrestation(cliniqueId, TypePrestation.SOINS_INFIRMIERS, "K15", "Soins infirmiers", bd("25.000"), 80);
        creerPrestation(cliniqueId, TypePrestation.LABORATOIRE, "B20", "Laboratoire", bd("45.000"), 70);
        creerPrestation(cliniqueId, TypePrestation.RADIOLOGIE, "Z10", "Radiologie", bd("120.000"), 70);
        creerPrestation(cliniqueId, TypePrestation.MATERIEL_MEDICAL, "L30", "Matériel médical", bd("35.000"), 60);
    }

    private void creerPrestation(String cliniqueId, TypePrestation type, String code, String libelle,
            BigDecimal tarif, int taux) {
        PrestationFacturation p = new PrestationFacturation();
        p.setCliniqueId(cliniqueId);
        p.setType(type);
        p.setCode(code);
        p.setLibelle(libelle);
        p.setTarifUnitaire(tarif);
        p.setTauxRemboursementPct(taux);
        p.setActif(true);
        prestationRepository.save(p);
    }

    private void ajouterLigne(FacturePatient facture, PrestationFacturation presta, int quantite) {
        LigneFacturePatient ligne = new LigneFacturePatient();
        ligne.setFacture(facture);
        ligne.setTypePrestation(presta.getType());
        ligne.setCodeActe(presta.getCode());
        ligne.setLibelle(presta.getLibelle());
        ligne.setQuantite(quantite);
        ligne.setPrixUnitaire(presta.getTarifUnitaire());
        ligne.setTauxRemboursementPct(presta.getTauxRemboursementPct());
        ligne.setMontantLigne(presta.getTarifUnitaire()
            .multiply(BigDecimal.valueOf(quantite))
            .setScale(3, RoundingMode.HALF_UP));
        facture.getLignes().add(ligne);
    }

    private void recalculerTotaux(FacturePatient facture) {
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal remboursable = BigDecimal.ZERO;

        for (LigneFacturePatient l : facture.getLignes()) {
            total = total.add(l.getMontantLigne());
            BigDecimal pct = BigDecimal.valueOf(l.getTauxRemboursementPct()).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            remboursable = remboursable.add(l.getMontantLigne().multiply(pct).setScale(3, RoundingMode.HALF_UP));
        }

        facture.setMontantTotal(total.setScale(3, RoundingMode.HALF_UP));
        facture.setMontantRemboursable(remboursable.setScale(3, RoundingMode.HALF_UP));
        facture.setTicketModerateur(total.subtract(remboursable).setScale(3, RoundingMode.HALF_UP));
    }

    private int calculerJoursHospitalisation(LocalDate entree, LocalDate sortie) {
        long days = ChronoUnit.DAYS.between(entree, sortie) + 1;
        return (int) Math.max(1, days);
    }

    private String genererNumeroFacture() {
        String numero;
        do {
            numero = "FAC-" + LocalDate.now().getYear() + "-"
                + String.format("%05d", ThreadLocalRandom.current().nextInt(100000));
        } while (facturePatientRepository.existsByNumeroFacture(numero));
        return numero;
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }

    private void validerPrestationRequest(
            PrestationFacturationRequest request, String cliniqueId, TypePrestation typeExistant, String idExclu) {
        if (request.getCode() == null || request.getCode().isBlank()) {
            throw new RuntimeException("Le code acte est obligatoire");
        }
        if (request.getLibelle() == null || request.getLibelle().isBlank()) {
            throw new RuntimeException("Le libellé est obligatoire");
        }
        if (request.getTarifUnitaire() == null || request.getTarifUnitaire().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Tarif unitaire invalide");
        }
        int taux = request.getTauxRemboursementPct() != null ? request.getTauxRemboursementPct() : 80;
        if (taux < 0 || taux > 100) {
            throw new RuntimeException("Taux de remboursement CNAM entre 0 et 100 %");
        }
        TypePrestation type = request.getType() != null ? request.getType() : typeExistant;
        if (type != null && idExclu != null
                && prestationRepository.existsByCliniqueIdAndTypeAndIdNot(cliniqueId, type, idExclu)) {
            throw new RuntimeException("Une prestation de ce type existe déjà pour la clinique");
        }
    }

    private void appliquerPrestationRequest(PrestationFacturation p, PrestationFacturationRequest request) {
        p.setCode(request.getCode().trim());
        p.setLibelle(request.getLibelle().trim());
        p.setTarifUnitaire(request.getTarifUnitaire().setScale(3, RoundingMode.HALF_UP));
        p.setTauxRemboursementPct(request.getTauxRemboursementPct() != null ? request.getTauxRemboursementPct() : 80);
        if (request.getActif() != null) {
            p.setActif(request.getActif());
        }
    }
}
