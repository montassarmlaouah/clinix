package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "administrateurs_clinique")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class AdministrateurClinique extends User {
}
