package com.pfe.pfe.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notes_hospitalisation")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NoteHospitalisation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    @Column(nullable = false)
    private String auteurId;

    @Column(nullable = false)
    private String auteurNom;

    @Column(nullable = false)
    private String auteurRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospitalisation_id", nullable = false)
    @JsonIgnore
    private Hospitalisation hospitalisation;
}
