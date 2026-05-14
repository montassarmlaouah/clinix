# Description complète – Module Ordonnance

Documentation des **modèles**, **DTOs**, **repository** et **contrôleur** du CRUD Ordonnance.

---

## 1. Modèles (entities)

### 1.1 Ordonnance

**Classe :** `com.pfe.pfe.model.Ordonnance`  
**Table BDD :** `ordonnances`

Représente une ordonnance médicale : document lié à une consultation (ou à un couple médecin/patient), contenant une liste de prescriptions (médicaments).

| Champ | Type | Description |
|-------|------|--------------|
| `id` | `String` (UUID) | Identifiant unique généré automatiquement. |
| `date` | `LocalDate` | Date de l’ordonnance (par défaut : date du jour). |
| `signee` | `Boolean` | Indique si l’ordonnance a été signée par le médecin (`false` à la création). |
| `consultation` | `Consultation` (OneToOne) | Consultation associée (optionnel si `medecin` + `patient` sont renseignés). |
| `patient` | `Patient` (ManyToOne) | Patient concerné (rempli directement ou via la consultation). |
| `medecin` | `Medecin` (ManyToOne) | Médecin prescripteur (rempli directement ou via la consultation). |
| `numeroOrdonnance` | `String` | Numéro affiché (ex. `ORD-2025-0001`), généré à la création. |
| `prescriptions` | `List<Prescription>` | Lignes de prescription (médicaments) ; cascade ALL, orphanRemoval. |
| `pharmacienValidateur` | `Pharmacien` (ManyToOne) | Pharmacien ayant validé l’ordonnance (rempli à la validation). |
| `validee` | `Boolean` | Indique si l’ordonnance a été validée en pharmacie (`false` à la création). |

**Méthodes utilitaires :**

- **`getPatientEffective()`** : Retourne le patient (soit `patient`, soit celui de la `consultation`).
- **`getMedecinEffective()`** : Retourne le médecin (soit `medecin`, soit celui de la `consultation`).

---

### 1.2 Prescription

**Classe :** `com.pfe.pfe.model.Prescription`  
**Table BDD :** `prescriptions`

Une ligne de prescription : un médicament prescrit dans une ordonnance (dosage, fréquence, durée, instructions).

| Champ | Type | Description |
|-------|------|--------------|
| `id` | `String` (UUID) | Identifiant unique. |
| `medicament` | `String` | Nom du médicament (texte). |
| `dosage` | `String` | Dosage (ex. « 1 comprimé »). |
| `frequence` | `String` | Fréquence (ex. « 3 fois par jour »). |
| `duree` | `Integer` | Durée du traitement en jours. |
| `instructions` | `String` (TEXT) | Instructions complémentaires (optionnel). |
| `ordonnance` | `Ordonnance` (ManyToOne) | Ordonnance à laquelle appartient la ligne. |
| `medicamentDetail` | `Medicament` (ManyToOne) | Référence optionnelle au catalogue médicaments. |

---

## 2. DTOs

### 2.1 CreerOrdonnanceDTO

**Classe :** `com.pfe.pfe.dto.CreerOrdonnanceDTO`

Utilisé pour la **création** d’une ordonnance. Deux cas :

- **Avec consultation :** `consultationId` renseigné (medecin/patient déduits de la consultation).
- **Sans consultation :** `medecinId` et `patientId` obligatoires.

| Champ | Type | Description |
|-------|------|--------------|
| `consultationId` | `String` | Id de la consultation (optionnel si medecinId + patientId fournis). |
| `medecinId` | `String` | Id du médecin (obligatoire si pas de consultation). |
| `patientId` | `String` | Id du patient (obligatoire si pas de consultation). |
| `medicaments` | `List<LigneMedicamentDTO>` | Lignes de médicaments à ajouter à la création (optionnel). |

---

### 2.2 LigneMedicamentDTO

**Classe :** `com.pfe.pfe.dto.LigneMedicamentDTO`

Une ligne de médicament pour création ou ajout à une ordonnance.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `medicament` | `String` | `@NotBlank` | Nom du médicament. |
| `dosage` | `String` | `@NotBlank` | Dosage. |
| `frequence` | `String` | `@NotBlank` | Fréquence. |
| `duree` | `Integer` | `@NotNull`, `@Positive` | Durée en jours. |
| `instructions` | `String` | - | Instructions (optionnel). |
| `medicamentId` | `String` | - | Id optionnel d’un médicament du catalogue. |

---

## 3. Repository

### OrdonnanceRepository

**Interface :** `com.pfe.pfe.repository.OrdonnanceRepository`  
**Hérite de :** `JpaRepository<Ordonnance, String>`

| Méthode | Description |
|---------|-------------|
| `findByValidee(Boolean validee)` | Liste des ordonnances selon le statut de validation. |
| `findByMedecinId(String medecinId)` | Ordonnances d’un médecin. |
| `findByPatientId(String patientId)` | Ordonnances d’un patient. |
| `findByIdWithPrescriptions(String id)` | Ordonnance par id avec prescriptions chargées (pour PDF). |
| `countByDateBetween(LocalDate start, LocalDate end)` | Nombre d’ordonnances sur une période (pour génération du numéro). |

---

## 4. Contrôleur – OrdonnanceController

**Classe :** `com.pfe.pfe.controller.OrdonnanceController`  
**Base URL :** `/api/ordonnances`  
**CORS :** `@CrossOrigin(origins = "*")`

Dépendances injectées : `OrdonnanceService`, `OrdonnancePdfService`.

---

### 4.1 Créer une ordonnance

| Méthode HTTP | URL | Méthode Java | Description |
|--------------|-----|--------------|-------------|
| **POST** | `/api/ordonnances` | `creerOrdonnance` | Crée une ordonnance à partir de `CreerOrdonnanceDTO` (consultation OU medecinId+patientId ; medicaments optionnels). Retourne l’ordonnance créée. |

- **Body :** JSON `CreerOrdonnanceDTO` (`@Valid`).
- **Réponse :** `201 Created` + corps = `Ordonnance`.

---

### 4.2 Récupérer une ordonnance par ID

| Méthode HTTP | URL | Méthode Java | Description |
|--------------|-----|--------------|-------------|
| **GET** | `/api/ordonnances/{id}` | `getOrdonnance` | Retourne l’ordonnance dont l’id est `{id}`. |

- **Réponse :** `200 OK` + `Ordonnance` ou `404 Not Found`.

---

### 4.3 Ajouter un médicament à une ordonnance

| Méthode HTTP | URL | Méthode Java | Description |
|--------------|-----|--------------|-------------|
| **POST** | `/api/ordonnances/{id}/medicaments` | `ajouterMedicament` | Ajoute une ligne de prescription à l’ordonnance `{id}`. |

- **Body :** JSON `LigneMedicamentDTO` (`@Valid`).
- **Réponse :** `201 Created` + corps = `Prescription`.

---

### 4.4 Télécharger le PDF d’une ordonnance

| Méthode HTTP | URL | Méthode Java | Description |
|--------------|-----|--------------|-------------|
| **GET** | `/api/ordonnances/{id}/pdf` | `telechargerPdf` | Génère et retourne le PDF de l’ordonnance en pièce jointe. |

- **Produces :** `application/pdf`.
- **Header :** `Content-Disposition: attachment; filename="ordonnance-{id}.pdf"`.
- **Réponse :** `200 OK` + corps binaire (PDF).

---

### 4.5 Lister les ordonnances (avec filtres)

| Méthode HTTP | URL | Méthode Java | Description |
|--------------|-----|--------------|-------------|
| **GET** | `/api/ordonnances` | `liste` | Liste des ordonnances. Filtres optionnels : `medecinId`, `patientId`, `nonValideesOnly`. |

**Paramètres :**

- `medecinId` (optionnel) : si présent → ordonnances du médecin.
- `patientId` (optionnel) : si présent → ordonnances du patient.
- `nonValideesOnly` (optionnel, défaut `false`) : si `true` → ordonnances non validées.  
  (Note : sans filtre, le code actuel renvoie aussi les non validées.)

- **Réponse :** `200 OK` + `List<Ordonnance>`.

---

### 4.6 Signer une ordonnance

| Méthode HTTP | URL | Méthode Java | Description |
|--------------|-----|--------------|-------------|
| **PATCH** | `/api/ordonnances/{id}/signer` | `signerOrdonnance` | Marque l’ordonnance comme signée (`signee = true`). |

- **Réponse :** `200 OK` + `Ordonnance` mise à jour.

---

### 4.7 Valider une ordonnance (pharmacien)

| Méthode HTTP | URL | Méthode Java | Description |
|--------------|-----|--------------|-------------|
| **PATCH** | `/api/ordonnances/{id}/valider` | `validerOrdonnance` | Marque l’ordonnance comme validée et enregistre le pharmacien validateur. |

- **Query :** `pharmacienId` (obligatoire).
- **Réponse :** `200 OK` + `Ordonnance` mise à jour.

---

### 4.8 Supprimer une ordonnance

| Méthode HTTP | URL | Méthode Java | Description |
|--------------|-----|--------------|-------------|
| **DELETE** | `/api/ordonnances/{id}` | `supprimerOrdonnance` | Suppression de l’ordonnance (actuellement le contrôleur renvoie `204` sans appeler le service ; à brancher sur `OrdonnanceService` si besoin). |

- **Réponse :** `204 No Content`.

---

## 5. Résumé des flux

1. **Création** : POST avec `CreerOrdonnanceDTO` → ordonnance + numéro généré + prescriptions optionnelles.
2. **Lecture** : GET par id ou GET liste avec filtres (médecin, patient, non validées).
3. **Enrichissement** : POST `/{id}/medicaments` pour ajouter des lignes.
4. **Workflow** : PATCH `/{id}/signer` puis PATCH `/{id}/valider?pharmacienId=...`.
5. **Export** : GET `/{id}/pdf` pour télécharger le PDF.
6. **Suppression** : DELETE `/{id}` (à connecter au service pour une vraie suppression en base).
