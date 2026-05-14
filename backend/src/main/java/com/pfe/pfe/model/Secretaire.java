package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "secretaires")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Secretaire extends User {
    
    @Column(nullable = true, unique = true)
    private String numeroOrdre;
}
