package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "techniciens_maintenance")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class TechnicienMaintenance extends User {
    
    @Column(nullable = true, unique = true)
    private String numeroOrdre;
}
