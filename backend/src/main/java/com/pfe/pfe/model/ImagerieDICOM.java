package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "imageries_dicom")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImagerieDICOM {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private LocalDate date = LocalDate.now();
    
    @Column(nullable = false)
    private String type;
    
    @Column(nullable = false)
    private String fichier;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private StatutImagerie statut = StatutImagerie.EN_ATTENTE;
    
    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;
    
    private String motif;

    /** Indications cliniques / contexte détaillé (texte libre). */
    @Column(columnDefinition = "TEXT")
    private String indicationsCliniques;

    /** Questions ou objectifs formulés par le médecin demandeur. */
    @Column(columnDefinition = "TEXT")
    private String questionsMedecin;

    /** Références documents (chemins, URLs ou noms de fichiers). */
    @Column(columnDefinition = "TEXT")
    private String piecesJointes;

    /** BASSE | NORMALE | HAUTE | URGENTE */
    @Column(length = 16, nullable = false)
    private String niveauUrgence = "NORMALE";

    private LocalDate datePrevue;

    /** Créneau horaire prévu (ex. 09:15). */
    private LocalTime heurePrevue;

    /**
     * Modalité réellement réalisée (CT, IRM, RX, Écho, etc.) — peut différer du type demandé initialement.
     */
    @Column(length = 64)
    private String typeExamenRealise;

    /** Références fichiers / URLs ajoutées par le radiologue (une ligne par entrée : DICOM, PDF, JPEG…). */
    @Column(columnDefinition = "TEXT")
    private String fichiersSupplementaires;

    /** Commentaires du radiologue sur les images (collaboration / relecture). */
    @Column(columnDefinition = "TEXT")
    private String commentairesImages;

    @Column(columnDefinition = "TEXT")
    private String notesCooperationPatient;

    @Column(columnDefinition = "TEXT")
    private String commentaireStatut;

    private LocalDateTime dateMiseAJour;

    /** Protocole technique / séquences (texte libre). */
    @Column(columnDefinition = "TEXT")
    private String protocoleExamen;
    
    @ManyToOne
    @JoinColumn(name = "medecin_demandeur_id")
    private Medecin medecinDemandeur;
    
    @ManyToOne
    @JoinColumn(name = "radiologue_id")
    private Radiologue radiologue;
    
    @ManyToOne
    @JoinColumn(name = "dossier_medical_id")
    private DossierMedical dossierMedical;
    
    @OneToOne(mappedBy = "imagerie", cascade = CascadeType.ALL)
    private RapportImagerie rapport;
    
    public enum StatutImagerie {
        EN_ATTENTE, EN_COURS, TERMINE, VALIDE, REFUSE
    }
}
