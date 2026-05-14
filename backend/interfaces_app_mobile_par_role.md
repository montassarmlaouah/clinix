# Interfaces de l’application mobile par rôle

Document de spécification des écrans (interfaces) de l’application mobile pour les rôles : **Patient**, **Infirmier**, **Médecin**, **Pharmacien**, **Radiologue**.

---

## Écrans communs (tous les rôles)

| Écran | Description | Éléments principaux | API / Backend |
|-------|-------------|----------------------|----------------|
| **Connexion** | Login par téléphone + mot de passe | Champ téléphone, champ mot de passe, bouton « Se connecter », lien « Mot de passe oublié » | `POST /auth/login` ou `/api/auth/**` |
| **Mot de passe oublié** | Demande de réinitialisation par SMS | Saisie téléphone, envoi OTP, saisie code + nouveau mot de passe | Endpoints SMS / forgot-password |
| **Profil** | Affichage et édition des infos personnelles | Nom, prénom, téléphone, photo (optionnel), bouton « Modifier » | Profil utilisateur (User) |
| **Paramètres** | Préférences et déconnexion | Notifications, langue, thème, bouton « Déconnexion » | — |
| **Notifications** | Liste des notifications reçues | Liste avec titre, message, date, lu/non lu | `NotificationController` |

---

## 1. Patient

### 1.1 Tableau de bord (Accueil)

| Élément | Description |
|--------|-------------|
| **En-tête** | Nom du patient, clinique si liée |
| **Résumé** | Prochain rendez-vous, dernier dossier / consultation |
| **Accès rapides** | Rendez-vous, Dossier médical, Factures, Contacter la clinique |

### 1.2 Rendez-vous

| Écran | Description | API |
|-------|-------------|-----|
| **Liste des rendez-vous** | RDV à venir et passés, filtres (à venir / passés) | `GET /api/rendez-vous/**` (selon SecurityConfig : MEDECIN, PATIENT, SECRETAIRE) |
| **Détail d’un RDV** | Date, heure, médecin, motif, statut, boutons Annuler / Reporter | `GET /api/rendez-vous/{id}` |
| **Prendre rendez-vous** | Formulaire : date, heure, motif, choix du médecin (optionnel) | `POST /api/rendez-vous` |

### 1.3 Dossier médical (consultation)

| Écran | Description | API |
|-------|-------------|-----|
| **Vue dossier** | Antécédents, allergies, résumé des consultations (lecture seule pour le patient) | Données dossier médical (à exposer via API dédiée patient si besoin) |
| **Historique consultations** | Liste des consultations avec date, médecin, motif | Lié à `DossierMedical` / `Consultation` |

### 1.4 Facturation (optionnel)

| Écran | Description | API |
|-------|-------------|-----|
| **Liste des factures** | Factures du patient, statut (payée / impayée) | `GET /api/facturation/**` (si un endpoint patient est ajouté) |
| **Détail facture** | Montant, détail des prestations, moyen de paiement | — |

### 1.5 Résumé des interfaces Patient

- Connexion / Mot de passe oublié  
- Accueil (tableau de bord)  
- Mes rendez-vous (liste, détail, prise de RDV)  
- Mon dossier médical (vue + historique consultations)  
 -Ordonnance
- Notifications  
- Profil  
- Paramètres  

---

## 2. Infirmier

### 2.1 Tableau de bord (Accueil)

| Élément | Description |
|--------|-------------|
| **En-tête** | Nom, service, clinique |
| **Résumé** | Patients à surveiller aujourd’hui, tâches (surveillances, administrations de traitement) |
| **Accès rapides** | Patients, Surveillances, Traitements, Planning / Gardes |

### 2.2 Patients (liste et fiche)

| Écran | Description | API |
|-------|-------------|-----|
| **Liste des patients** | Recherche par nom / numéro patient, filtre par service ou clinique | `GET /api/patients`, `GET /api/patients/clinique/{cliniqueId}` |
| **Fiche patient** | Identité, dossier médical (résumé), constantes récentes, prochains traitements | `GET /api/patients/{id}` + données dossier / surveillances |

### 2.3 Surveillances infirmières

| Écran | Description | API |
|-------|-------------|-----|
| **Liste des surveillances** | Par patient ou par période (journée) | `SurveillanceInfirmiereController` |
| **Saisie constante** | Tension, pouls, température, etc. + commentaire | Création / mise à jour surveillance |
| **Alertes** | Liste des alertes (constantes hors normes) | Selon logique backend |

### 2.4 Administrations de traitements

| Écran | Description | API |
|-------|-------------|-----|
| **Planning des traitements** | Liste des administrations prévues (par créneau, par patient) | `AdministrationTraitementController` |
| **Marquer administration** | Confirmer prise / injection + heure | Mise à jour administration |

### 2.5 Planning / Gardes

| Écran | Description | API |
|-------|-------------|-----|
| **Mon planning** | Shifts hebdo ou mensuel | `GET /api/planning/**`, `GardeController` |
| **Mes gardes** | Gardes jour / nuit, statut | `GET /api/gardes/**` |

### 2.6 Résumé des interfaces Infirmier

- Connexion / Mot de passe oublié  
- Accueil (tableau de bord)  
- Patients (liste, fiche patient)  
- Surveillances (liste, saisie constante, alertes)  
- Administrations de traitements (planning, marquer fait)  
- Planning / Gardes  
- Notifications 
- Profil  
- Paramètres  

---

## 3. Médecin

### 3.1 Tableau de bord (Accueil)

| Élément | Description |
|--------|-------------|
| **En-tête** | Nom, spécialité, clinique |
| **Résumé** | Consultations du jour, rendez-vous à venir, tâches (ordonnances à signer) |
| **Accès rapides** | Consultations, Patients, Rendez-vous, Ordonnances |

### 3.2 Patients

| Écran | Description | API |
|-------|-------------|-----|
| **Liste des patients** | Recherche, filtre par clinique | `GET /api/patients`, `GET /api/patients/clinique/{cliniqueId}` |
| **Fiche patient** | Identité, dossier médical, antécédents, allergies, historique consultations | `GET /api/patients/{id}`, DossierMedical, Consultations |
| **Créer / modifier patient** | Formulaire création ou édition (si droits) | `POST /api/patients`, `PUT /api/patients/{id}` |

### 3.3 Consultations

| Écran | Description | API |
|-------|-------------|-----|
| **Liste des consultations** | Par date, par patient, par médecin | `GET /api/consultations/**` |
| **Nouvelle consultation** | Choix patient, motif, diagnostic, observations | `POST /api/consultations` |
| **Détail consultation** | Date, patient, motif, diagnostic, observations, lien vers ordonnance | `GET /api/consultations/{id}` |
| **Éditer consultation** | Modification diagnostic / observations | `PUT` si exposé |

### 3.4 Ordonnances

| Écran | Description | API |
|-------|-------------|-----|
| **Liste des ordonnances** | Par consultation ou par patient | `OrdonnanceController` |
| **Créer ordonnance** | Liée à une consultation, liste des prescriptions (médicaments, posologie) | `POST` ordonnance + prescriptions |
| **Signer ordonnance** | Action « Signer » (champ `signee`) | `PATCH` ou `PUT` ordonnance |

### 3.5 Rendez-vous

| Écran | Description | API |
|-------|-------------|-----|
| **Agenda / liste RDV** | RDV du médecin (journée / semaine) | `GET /api/rendez-vous/**` |
| **Détail RDV** | Patient, motif, statut, annuler / reporter | `GET /api/rendez-vous/{id}` |

### 3.6 Hospitalisations (optionnel)

| Écran | Description | API |
|-------|-------------|-----|
| **Liste des hospitalisations** | Patients hospitalisés (service du médecin) | `HospitalisationController` |
| **Détail hospitalisation** | Chambre, dates, motif, évolution | `GET /api/hospitalisations/{id}` |

### 3.7 Résumé des interfaces Médecin

- Connexion / Mot de passe oublié  
- Accueil (tableau de bord)  
- Patients (liste, fiche, créer/éditer)  
- Consultations (liste, détail, nouvelle, éditer)  
- Ordonnances (liste, créer, signer)  
- Rendez-vous (agenda, détail)  
- Hospitalisations (liste, détail)  
- Notifications  
- Profil  
- Paramètres  

---

## 4. Pharmacien

### 4.1 Tableau de bord (Accueil)

| Élément | Description |
|--------|-------------|
| **En-tête** | Nom, clinique / pharmacie |
| **Résumé** | Ordonnances en attente de validation, stock (alertes faibles stocks) |
| **Accès rapides** | Ordonnances à valider, Médicaments, Stock, Historique |

### 4.2 Ordonnances

| Écran | Description | API |
|-------|-------------|-----|
| **Ordonnances en attente** | Liste des ordonnances non validées (signées par le médecin) | `OrdonnanceController`, filtre `validee = false` |
| **Détail ordonnance** | Patient, médecin, date, liste des prescriptions (médicament, posologie), bouton « Valider » | `GET /api/ordonnances/**`, `PUT` avec `pharmacienValidateur` + `validee = true` |
| **Historique validations** | Ordonnances déjà validées par le pharmacien | Liste avec filtre |

### 4.3 Médicaments

| Écran | Description | API |
|-------|-------------|-----|
| **Catalogue / recherche** | Recherche par nom, DCI, code | `GET /api/medicaments/**` |
| **Fiche médicament** | Nom, forme, dosage, stock disponible, alertes | `GET /api/medicaments/{id}` |

### 4.4 Stock (optionnel)

| Écran | Description | API |
|-------|-------------|-----|
| **État du stock** | Liste des médicaments avec quantités, seuils d’alerte | Lié à `StockMedicament` / équivalent API |
| **Détail stock par médicament** | Mouvements, quantités, dates | — |

### 4.5 Résumé des interfaces Pharmacien

- Connexion / Mot de passe oublié  
- Accueil (tableau de bord)  
- Ordonnances (en attente, détail, valider, historique)  
- Médicaments (catalogue, fiche, recherche)  
- Stock (état, alertes, détail)  
- Notifications  
- Profil  
- Paramètres  

---

## 5. Radiologue

### 5.1 Tableau de bord (Accueil)

| Élément | Description |
|--------|-------------|
| **En-tête** | Nom, clinique |
| **Résumé** | Examens en attente de lecture, rapports à rédiger |
| **Accès rapides** | Examens en attente, Rapports d’imagerie, Historique |

### 5.2 Examens d’imagerie (DICOM / rapports)

| Écran | Description | API |
|-------|-------------|-----|
| **Liste des examens** | Imagerie liée aux dossiers médicaux (en attente / réalisés) | Modèle `ImagerieDICOM`, `RapportImagerie` — à exposer via API si pas déjà fait |
| **Détail examen** | Patient, type d’examen, date, images (si intégration viewer), formulaire rapport | `GET` imagerie / rapport |
| **Rédiger rapport** | Saisie du compte-rendu (texte), conclusion, signature | Création / mise à jour `RapportImagerie` |

### 5.3 Dossiers médicaux (vue limitée)

| Écran | Description | API |
|-------|-------------|-----|
| **Accès au dossier (lecture)** | Pour un examen donné : identité patient, antécédents pertinents, allergies | `DossierMedical` + `Patient` (lecture) |

### 5.4 Résumé des interfaces Radiologue

- Connexion / Mot de passe oublié  
- Accueil (tableau de bord)  
- Examens d’imagerie (liste, détail, visualisation si applicable)  
- Rédaction de rapports (formulaire, enregistrement)  
- Historique des rapports  
- Notifications  
- Profil  
- Paramètres  

---

## Récapitulatif : navigation par rôle

| Rôle | Écrans principaux spécifiques |
|------|------------------------------|
| **Patient** | Accueil, Rendez-vous (liste/détail/prise), Dossier médical (lecture), Factures |
| **Infirmier** | Accueil, Patients, Surveillances, Administrations de traitements, Planning / Gardes |
| **Médecin** | Accueil, Patients, Consultations, Ordonnances, Rendez-vous, Hospitalisations |
| **Pharmacien** | Accueil, Ordonnances (à valider / détail / valider), Médicaments, Stock |
| **Radiologue** | Accueil, Examens imagerie, Rédaction rapports, Historique rapports |

---

## Remarques pour l’implémentation mobile

1. **Authentification** : Un seul flux de login (téléphone + mot de passe) ; le rôle est déterminé par le JWT / profil pour afficher le bon menu (drawer / bottom tabs) par rôle.
2. **Menu dynamique** : Afficher uniquement les entrées correspondant au rôle (Patient, Infirmier, Médecin, Pharmacien, Radiologue).
3. **API** : Toutes les URLs sont documentées dans `api_personnes_patient_medecin_infirmier_pharmacien_radiologue.md` ; les modules additionnels (rendez-vous, consultations, ordonnances, etc.) sont dans `DESCRIPTION_BACKEND.txt` et les contrôleurs correspondants.
4. **Radiologue** : Les endpoints dédiés « imagerie / rapport » sont à confirmer ou à ajouter côté backend (à partir des entités `ImagerieDICOM`, `RapportImagerie`).

Ce document peut servir de cahier des charges pour les écrans de l’application mobile (React Native, Flutter, ou autre).
