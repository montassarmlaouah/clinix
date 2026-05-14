package com.pfe.pfe.model;

import java.time.LocalDate;
import java.time.Period;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "patients")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Patient extends User {
    
    @Column(nullable = false, unique = true)
    private String numeroPatient;
    
    @Column(nullable = false)
    private LocalDate dateNaissance;
    
    @Column(length = 10)
    private String sexe;

    private String groupeSanguin;
    
    private String adresse;

    @Column(length = 20)
    private String typeAdmission;

    private Boolean verifieParSecretaire = false;

    private LocalDate verificationSecretaireDate;
    
    @JsonIgnore
    @OneToOne(mappedBy = "patient", cascade = CascadeType.ALL)
    private DossierMedical dossierMedical;

    /** Médecin de cabinet (pour les patients sans clinique — médecine libérale). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medecin_cabinet_id")
    private Medecin medecinCabinet;
    
    /**
     * Calcule l'âge du patient en années à partir de sa date de naissance
     * @return l'âge en années, ou null si la date de naissance n'est pas définie
     */
    @Transient
    public Integer getAge() {
        if (dateNaissance == null) {
            return null;
        }
        return Period.between(dateNaissance, LocalDate.now()).getYears();
    }

}
