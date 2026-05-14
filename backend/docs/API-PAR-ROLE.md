# API HTTP et rôles (Spring Security)

Ce document résume **qui peut appeler quoi** selon les règles déclarées dans `SecurityConfig` et les annotations `@PreAuthorize` sur certains contrôleurs. Les chemins sont relatifs à la racine du backend (ex. `https://hôte:8080`).
²
Les rôles JWT correspondent aux chaînes `SUPER_ADMIN`, `ADMIN_CLINIQUE`, `MEDECIN`, `INFIRMIER`, `SECRETAIRE`, `PATIENT`, `PHARMACIEN`, `CHEF_PERSONNEL`, `TECHNICIEN_MAINTENANCE`, `RADIOLOGUE` (Spring les mappe en autorités `ROLE_*`).

---

## Endpoints publics

| Méthode | Chemin | Remarque |
|--------|--------|----------|
| OPTIONS | `/**` | Préflight CORS |
| GET | chemins SPA / assets | Matcher `PublicWebUiGetMatcher` |
| GET | `/api/health` | Santé |
| * | `/auth/**`, `/api/auth/**` | Connexion, tokens, etc. |
| POST | `/api/webhooks/stripe` | Webhook Stripe |
| * | `/api/sms/**` (sauf exceptions ci-dessous) | Dont réception DLR, etc. |
| * | `/swagger-ui/**`, `/v3/api-docs/**` | OpenAPI |

---

## Règles par préfixe (ordre du filtre — la première règle qui matche s’applique)

| Méthode / préfixe | Rôles autorisés |
|-------------------|-----------------|
| POST `/api/sms/test-send`, `/api/sms/dlr` | Tout utilisateur **authentifié** |
| POST `/api/upload` | Authentifié |
| GET `/api/services/**` | `ADMIN_CLINIQUE`, `CHEF_PERSONNEL`, `SECRETAIRE` |
| * `/api/services/**` (écriture) | `ADMIN_CLINIQUE`, `CHEF_PERSONNEL` |
| GET `/api/chambres/**` | `ADMIN_CLINIQUE`, `TECHNICIEN_MAINTENANCE`, `SECRETAIRE`, `MEDECIN`, `INFIRMIER` |
| * `/api/chambres/**` (écriture) | `ADMIN_CLINIQUE` |
| GET `/api/cliniques/actives` | `SUPER_ADMIN`, `ADMIN_CLINIQUE`, `MEDECIN`, `SECRETAIRE` |
| * `/api/cliniques/**` | `SUPER_ADMIN`, `ADMIN_CLINIQUE` |
| * `/api/personnel/**` | `SUPER_ADMIN`, `ADMIN_CLINIQUE`, `CHEF_PERSONNEL` |
| * `/api/patients/**` | `MEDECIN`, `INFIRMIER`, `SECRETAIRE`, `ADMIN_CLINIQUE` |
| * `/api/medecins/cabinets/**` | `SUPER_ADMIN` |
| * `/api/medecins/**` | `SUPER_ADMIN`, `MEDECIN`, `INFIRMIER`, `SECRETAIRE`, `ADMIN_CLINIQUE` |
| * `/api/infirmiers/**` | `INFIRMIER` |
| * `/api/hospitalisations/**` | `MEDECIN`, `INFIRMIER`, `SECRETAIRE`, `ADMIN_CLINIQUE` |
| GET `/api/dossiers-medicaux/**` | `MEDECIN`, `INFIRMIER`, `PATIENT`, `ADMIN_CLINIQUE`, `RADIOLOGUE` |
| * `/api/dossiers-medicaux/**` (écriture) | `MEDECIN`, `ADMIN_CLINIQUE` |
| GET `/api/ordonnances/**` | `MEDECIN`, `PATIENT`, `PHARMACIEN`, `ADMIN_CLINIQUE`, `INFIRMIER` |
| * `/api/ordonnances/**` (écriture) | `MEDECIN`, `PHARMACIEN`, `ADMIN_CLINIQUE` |
| * `/api/radiologue/**` | `RADIOLOGUE` |
| GET `/api/imageries/**` | `MEDECIN`, `RADIOLOGUE`, `ADMIN_CLINIQUE`, `INFIRMIER` |
| POST `/api/imageries/**` | `MEDECIN`, `RADIOLOGUE` |
| * `/api/imageries/**` (autres méthodes) | `RADIOLOGUE`, `ADMIN_CLINIQUE` |
| * `/api/rapports-imagerie/**` | `MEDECIN`, `RADIOLOGUE`, `ADMIN_CLINIQUE`, `INFIRMIER` |
| * `/api/constantes-vitales/**` | `MEDECIN`, `INFIRMIER`, `ADMIN_CLINIQUE` |
| * `/api/surveillances/**` | `MEDECIN`, `INFIRMIER`, `ADMIN_CLINIQUE` |
| * `/api/administrations/**` | `MEDECIN`, `INFIRMIER`, `ADMIN_CLINIQUE` |
| * `/api/urgences/**` | `MEDECIN`, `INFIRMIER`, `SECRETAIRE`, `ADMIN_CLINIQUE` |
| * `/api/messages/**` | **Authentifié** (tout rôle avec JWT valide) |
| * `/api/rendez-vous/**` | `MEDECIN`, `PATIENT`, `SECRETAIRE`, `INFIRMIER` |
| POST `/api/consultations/**` | `MEDECIN` |
| PATCH `/api/consultations/**` | `MEDECIN` |
| GET `/api/consultations/**` | `MEDECIN`, `PATIENT`, `INFIRMIER` |
| * `/api/medicaments/**` | `PHARMACIEN`, `MEDECIN`, `ADMIN_CLINIQUE` |
| * `/api/stocks/**` | `PHARMACIEN`, `ADMIN_CLINIQUE` |
| * `/api/pharmaciens/**` | `PHARMACIEN`, `ADMIN_CLINIQUE` |
| * `/api/demandes-medicament/**` | `PHARMACIEN`, `MEDECIN`, `SECRETAIRE`, `INFIRMIER`, `ADMIN_CLINIQUE` |
| * `/api/conges-medecin/**` | `MEDECIN`, `SECRETAIRE`, `ADMIN_CLINIQUE`, `CHEF_PERSONNEL` |
| * `/api/demandes-operation/**` | `MEDECIN`, `SECRETAIRE`, `ADMIN_CLINIQUE`, `INFIRMIER` |
| * `/api/technicien-maintenance/**` | `TECHNICIEN_MAINTENANCE` |
| * `/api/equipements/**` | `ADMIN_CLINIQUE` |
| * `/api/administrateurs-clinique/**` | `SUPER_ADMIN`, `ADMIN_CLINIQUE` |

---

## Préfixes sans rôle explicite (tout JWT valide)

Ces URLs ne sont pas listés avec un `hasRole` / `hasAnyRole` dans `SecurityConfig` : ils tombent sous **`.anyRequest().authenticated()`** — tout utilisateur connecté peut les invoquer (la logique métier peut restreindre ensuite).

Exemples de contrôleurs concernés (préfixes typiques) :

- `/api/billing/**` — `BillingController`
- `/api/notifications/**` — `NotificationController`
- `/api/preferences-notifications/**` — `PreferencesNotificationController`
- `/api/plannings/**` — `PlanningController`
- `/api/presences/**` — `PresenceController`
- `/api/alertes/**` — `AlerteController`
- `/api/diagnostic/**` — `DiagnosticController`
- `/api/gardes/**` — `GardeController`
- `/api/absences/**` — `AbsenceController`
- `/api/maintenances/**` — `MaintenanceController`

**Note :** `POST /api/admin/create-user` impose en plus `@PreAuthorize("hasRole('SUPER_ADMIN')")` sur la méthode — seul le super admin peut l’appeler même si le préfixe `/api/admin` est « authentifié seulement » au niveau du filtre.

---

## Rattachement médecin ↔ clinique (compte centralisé)

Sécurité filtre : préfixe `/api/cliniques/**` → `SUPER_ADMIN` ou `ADMIN_CLINIQUE`.  
Contrôle d’accès **métier** sur l’`{cliniqueId}` du chemin :

- **Super admin** : n’importe quelle clinique.
- **Admin clinique** : uniquement si `cliniqueId` du JWT = `cliniqueId` de l’URL (sinon HTTP 403).

| Méthode | Chemin | Corps JSON | Réponse / effet |
|--------|--------|------------|-----------------|
| POST | `/api/cliniques/{cliniqueId}/medecins/rechercher` | `{ "telephone": "…", "numeroPieceIdentite": "…" }` (au moins un champ) | **200** + objet `Medecin` si trouvé ; **404** sinon. Téléphone normalisé (Tunisie). CIN : trim, espaces supprimés, majuscules. Si les deux sont fournis, le médecin doit correspondre aux **deux** critères. |
| POST | `/api/cliniques/{cliniqueId}/medecins` | `{ "medecinId": "<UUID utilisateur/médecin>" }` | **200** + médecin mis à jour (clinique affectée). Réutilise l’identifiant centralisé existant. |

Contrôleur : `CliniqueMedecinRattachementController`. Service : `MedecinService.rechercherMedecinPourRattachement`, `rattacherMedecinAClinique`.

---

## Technicien maintenance (`/api/technicien-maintenance`)

JWT : le technicien doit avoir un **`cliniqueId`** dans le token ; sinon les appels retournent **400**.

| Méthode | Chemin | Corps JSON | Réponse / effet |
|--------|--------|------------|-----------------|
| GET | `/api/technicien-maintenance/equipements` | — | **200** + liste des équipements de la clinique du JWT |
| GET | `/api/technicien-maintenance/equipements/en-panne` | — | **200** + équipements `EN_PANNE` ou `HORS_SERVICE` |
| GET | `/api/technicien-maintenance/equipements/{id}` | — | **200** + détail si l’équipement appartient à la clinique ; **403** sinon |
| POST | `/api/technicien-maintenance/equipements/{id}/alerte-email` | Optionnel `{ "note": "…" }` | **204** — notifications in-app + e-mails (`AlerteEmailService`) vers admins clinique et techniciens, si l’équipement est `EN_PANNE`, `HORS_SERVICE` ou `EN_MAINTENANCE` |

**Note :** quand l’admin passe un équipement en **EN_PANNE** via `/api/equipements/**`, `EquipementService` envoie déjà les mêmes types d’alertes (e-mail si SMTP configuré).

---

## Vue synthétique par rôle (principaux espaces)

| Rôle | Accès API typiques |
|------|---------------------|
| **SUPER_ADMIN** | Cabinets médecins, cliniques, personnel, administrateurs clinique, création utilisateur `/api/admin/create-user`, rattachement médecin sur toute clinique, etc. |
| **ADMIN_CLINIQUE** | Clinique « la sienne », personnel, patients, médecins, hospitalisations, dossiers (lecture/écriture selon règles), chambres (écriture), équipements, services, imagerie/rapports en lecture admin, rattachement médecin **uniquement** sur sa clinique, etc. |
| **MEDECIN** | Patients, consultations, ordonnances, imageries (demande + lecture), workspace `/api/medecins/{id}/workspace`, messages, RDV, etc. |
| **INFIRMIER** | Patients, hospitalisations, constantes, surveillances, administrations, infirmiers `/**`, chambres en lecture, demandes médicament/opération, etc. |
| **SECRETAIRE** | Patients, RDV, services en lecture, chambres en lecture, congés, demandes, urgences, etc. |
| **PATIENT** | RDV, consultations en lecture, ordonnances en lecture, dossiers en lecture, etc. |
| **PHARMACIEN** | Médicaments, stocks, pharmaciens, ordonnances (écriture), demandes médicament, etc. |
| **CHEF_PERSONNEL** | Personnel, services, congés médecin, etc. |
| **TECHNICIEN_MAINTENANCE** | Chambres en lecture ; **`/api/technicien-maintenance/**`** (équipements de la clinique du JWT, pannes, renvoi d’alertes e-mail + notifications). |
| **RADIOLOGUE** | Tout `/api/radiologue/**` ; imageries/rapports selon table ; dossiers en GET. |
| **Tout JWT** | Messagerie `/api/messages/**`, upload, SMS test/dlr, et préfixes listés en « authentifié seulement ». |

Pour le détail exact des verbes (GET/POST/…) par ressource, se référer aux annotations dans chaque `*Controller.java` sous `com.pfe.pfe.controller` et aux règles ci-dessus.

---

*Document généré à partir de `SecurityConfig.java` et des contrôleurs du module backend. En cas d’écart, le code source fait foi.*
