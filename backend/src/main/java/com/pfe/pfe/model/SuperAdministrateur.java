package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "super_administrateurs")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class SuperAdministrateur extends User {
    // Méthodes métier spécifiques au super admin
}
