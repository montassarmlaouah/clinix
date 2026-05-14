## API Personnes (Patient, Médecin, Infirmier, Pharmacien, Radiologue)

**Base URL générale**: `http://localhost:8080`

Toutes les routes (sauf authentification) sont protégées par JWT (voir `AuthController` et `/auth/**`).

---

## 1. Patients

**Ressource**: `Patient` (hérite de `User`)

- **Créer un patient**
  - **Méthode**: `POST`
  - **URL**: `/api/patients`
  - **Body (JSON, `PatientDTO`)**: données d’identité + téléphone + clinique/service éventuels.
  - **Rôles autorisés** (via `SecurityConfig`): `MEDECIN`, `INFIRMIER`, `SECRETAIRE`, `ADMIN_CLINIQUE`.

- **Lister tous les patients**
  - **Méthode**: `GET`
  - **URL**: `/api/patients`
  - **Réponse**: `List<Patient>`

- **Lister les patients d’une clinique**
  - **Méthode**: `GET`
  - **URL**: `/api/patients/clinique/{cliniqueId}`

- **Obtenir un patient par id**
  - **Méthode**: `GET`
  - **URL**: `/api/patients/{id}`

- **Obtenir un patient par numéro**
  - **Méthode**: `GET`
  - **URL**: `/api/patients/numero/{numeroPatient}`

- **Mettre à jour un patient**
  - **Méthode**: `PUT`
  - **URL**: `/api/patients/{id}`
  - **Body**: `PatientDTO`

- **Supprimer un patient**
  - **Méthode**: `DELETE`
  - **URL**: `/api/patients/{id}`

---

## 2. Médecins

**Ressource**: `Medecin` (hérite de `User`)

Endpoints CRUD directs (`MedecinController`) :

- **Créer un médecin**
  - **Méthode**: `POST`
  - **URL**: `/api/medecins`
  - **Body**: `Medecin` (JSON).

- **Lister tous les médecins**
  - **Méthode**: `GET`
  - **URL**: `/api/medecins`

- **Obtenir un médecin par id**
  - **Méthode**: `GET`
  - **URL**: `/api/medecins/{id}`

- **Lister les médecins d’une clinique**
  - **Méthode**: `GET`
  - **URL**: `/api/medecins/clinique/{cliniqueId}`

- **Lister les médecins par spécialité**
  - **Méthode**: `GET`
  - **URL**: `/api/medecins/specialite/{specialite}`

- **Mettre à jour un médecin**
  - **Méthode**: `PUT`
  - **URL**: `/api/medecins/{id}`

- **Supprimer un médecin**
  - **Méthode**: `DELETE`
  - **URL**: `/api/medecins/{id}`

Endpoints de liste / désactivation globaux (`PersonnelController`) :

- **Lister les médecins (par clinique / scope admin)**
  - **Méthode**: `GET`
  - **URL**: `/api/personnel/medecins?cliniqueId={optional}`

- **Obtenir un médecin**
  - **Méthode**: `GET`
  - **URL**: `/api/personnel/medecins/{id}`

- **Désactiver un médecin**
  - **Méthode**: `DELETE`
  - **URL**: `/api/personnel/medecins/{id}`

---

## 3. Infirmiers

**Ressource**: `Infirmier` (hérite de `User`)

Endpoints CRUD (`InfirmierController`) :

- **Créer un infirmier**
  - **Méthode**: `POST`
  - **URL**: `/api/infirmiers`
  - **Body**: `Infirmier`

- **Lister tous les infirmiers**
  - **Méthode**: `GET`
  - **URL**: `/api/infirmiers`

- **Obtenir un infirmier par id**
  - **Méthode**: `GET`
  - **URL**: `/api/infirmiers/{id}`

- **Lister les infirmiers d’une clinique**
  - **Méthode**: `GET`
  - **URL**: `/api/infirmiers/clinique/{cliniqueId}`

- **Mettre à jour un infirmier**
  - **Méthode**: `PUT`
  - **URL**: `/api/infirmiers/{id}`

- **Supprimer un infirmier**
  - **Méthode**: `DELETE`
  - **URL**: `/api/infirmiers/{id}`

Endpoints globaux (`PersonnelController`) :

- **Lister les infirmiers (par clinique / scope admin)**
  - **Méthode**: `GET`
  - **URL**: `/api/personnel/infirmiers?cliniqueId={optional}`

- **Obtenir un infirmier**
  - **Méthode**: `GET`
  - **URL**: `/api/personnel/infirmiers/{id}`

- **Désactiver un infirmier**
  - **Méthode**: `DELETE`
  - **URL**: `/api/personnel/infirmiers/{id}`

---

## 4. Pharmaciens

**Ressource**: `Pharmacien` (hérite de `User`)

Endpoints CRUD directs (`PharmacienController`) :

- **Créer un pharmacien**
  - **Méthode**: `POST`
  - **URL**: `/api/pharmaciens`
  - **Body**: `Pharmacien`

- **Lister tous les pharmaciens**
  - **Méthode**: `GET`
  - **URL**: `/api/pharmaciens`

- **Obtenir un pharmacien par id**
  - **Méthode**: `GET`
  - **URL**: `/api/pharmaciens/{id}`

- **Rechercher par téléphone**
  - **Méthode**: `GET`
  - **URL**: `/api/pharmaciens/telephone/{telephone}`

- **Rechercher par numéro d’ordre**
  - **Méthode**: `GET`
  - **URL**: `/api/pharmaciens/numero-ordre/{numeroOrdre}`

- **Lister par clinique**
  - **Méthode**: `GET`
  - **URL**: `/api/pharmaciens/clinique/{cliniqueId}`

- **Lister les pharmaciens actifs**
  - **Méthode**: `GET`
  - **URL**: `/api/pharmaciens/actifs`

- **Lister les pharmaciens inactifs**
  - **Méthode**: `GET`
  - **URL**: `/api/pharmaciens/inactifs`

- **Mettre à jour un pharmacien**
  - **Méthode**: `PUT`
  - **URL**: `/api/pharmaciens/{id}`

- **Activer un pharmacien**
  - **Méthode**: `PATCH`
  - **URL**: `/api/pharmaciens/{id}/activer`

- **Désactiver un pharmacien**
  - **Méthode**: `PATCH`
  - **URL**: `/api/pharmaciens/{id}/desactiver`

- **Supprimer un pharmacien**
  - **Méthode**: `DELETE`
  - **URL**: `/api/pharmaciens/{id}`

Endpoints globaux (`PersonnelController`) :

- **Lister les pharmaciens (par clinique / scope admin)**
  - **Méthode**: `GET`
  - **URL**: `/api/personnel/pharmaciens?cliniqueId={optional}`

- **Obtenir un pharmacien**
  - **Méthode**: `GET`
  - **URL**: `/api/personnel/pharmaciens/{id}`

- **Désactiver un pharmacien**
  - **Méthode**: `DELETE`
  - **URL**: `/api/personnel/pharmaciens/{id}`

---

## 5. Radiologues

**Ressource**: `Radiologue` (hérite de `User`)

La création de radiologues se fait via le contrôleur générique du personnel (`PersonnelController`) avec le rôle `RADIOLOGUE`.

- **Créer un radiologue**
  - **Méthode**: `POST`
  - **URL**: `/api/personnel`
  - **Body** (exemple simplifié `CreerPersonnelDTO`) :
    ```json
    {
      "telephone": "+2126...",
      "role": "RADIOLOGUE",
      "cliniqueId": "ID_CLINIQUE_OPTIONNEL",
      "serviceId": "ID_SERVICE_OPTIONNEL"
    }
    ```

- **Lister les radiologues**
  - **Méthode**: `GET`
  - **URL**: `/api/personnel/radiologues?cliniqueId={optional}`

- **Obtenir un radiologue**
  - **Méthode**: `GET`
  - **URL**: `/api/personnel/radiologues/{id}`

- **Désactiver un radiologue**
  - **Méthode**: `DELETE`
  - **URL**: `/api/personnel/radiologues/{id}`

---

## 6. Notes pour le développement mobile

- **Authentification**: les apps mobiles doivent d’abord appeler `/auth/login` ou `/api/auth/**` pour obtenir un JWT, puis envoyer l’en-tête `Authorization: Bearer <token>` sur toutes les routes ci‑dessus.
- **Multi‑rôles**: la même personne peut avoir plusieurs rôles via `user_roles`. Le mobile doit adapter l’UI en fonction du rôle (ex. menu médecin vs infirmier).
- **Lien avec le schéma SQL**:
  - Tous les endpoints ci‑dessus manipulent des entités qui s’appuient sur les tables décrites dans `schema_personnes_core.sql`.
  - Les IDs renvoyés par l’API correspondent aux colonnes `id` (type `VARCHAR(36)`) des tables logiques.

