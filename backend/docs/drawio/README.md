# Diagrammes Clinix — draw.io & PlantUML

## Cas d'utilisation (draw.io)

Ouvrir sur [app.diagrams.net](https://app.diagrams.net) ou VS Code (extension Draw.io).

### Versions SIMPLES (vue d'ensemble par sprint)

| Fichier | Contenu |
|---------|---------|
| `cu_sprint1_auth_simple.drawio` | Authentification |
| `cu_sprint2_orga_simple.drawio` | Organisation |
| `cu_sprint2_abonnement_simple.drawio` | Abonnements |
| `cu_sprint3_metier_simple.drawio` | Parcours patient |
| `cu_sprint4_pharmacie_simple.drawio` | Pharmacie |
| `cu_sprint5_ressources_simple.drawio` | Equipements & chambres |
| `cu_sprint5_facturation_simple.drawio` | Facturation |
| `cu_sprint6_dashboard_simple.drawio` | Dashboard |
| `cu_sprint6_planning_conges_dashboard_simple.drawio` | **Planning, conges, Dashboard & reporting** |

### Versions DETAILLEES (style hub : Gerer X + <<include>> S'authentifier + <<extend>>)

| Fichier | Contenu |
|---------|---------|
| `cu_sprint1_auth_detail.drawio` | Authentification detaillee |
| `cu_sprint2_cliniques_detail.drawio` | Cliniques & cabinets |
| `cu_sprint2_personnel_detail.drawio` | Personnel & services |
| `cu_abonnement_detail.drawio` | **Abonnements (offres + souscription)** |
| `cu_facturation_detail.drawio` | **Facturation patient** |
| `cu_sprint3_patients_detail.drawio` | Patients & dossier |
| `cu_sprint3_rdv_detail.drawio` | RDV & operations |
| `cu_sprint4_pharmacie_detail.drawio` | Pharmacie detaillee |
| `cu_sprint5_equipements_detail.drawio` | Equipements & maintenance |
| `cu_sprint5_chambres_detail.drawio` | Chambres |
| `cu_sprint6_dashboard_detail.drawio` | Dashboard & stats |
| `cu_sprint6_planning_conges_dashboard_detail.drawio` | **Planning, conges, Dashboard & reporting** |

### Cas d'utilisation complets (par sprint)

| Fichier | Contenu |
|---------|---------|
| `cas_utilisation_sprint6_planning_conges_dashboard.drawio` | **Sprint 6 — Planning, conges, Dashboard & reporting** |
| `cas_utilisation_sprint6_dashboard.drawio` | Alias corrige (meme contenu Sprint 6) |

Regenerer : `py generate_drawio.py`

## Diagrammes de sequence (PlantUML)

| Fichier | Cas |
|---------|-----|
| `diagramme_sequence_authentification.puml` | Connexion JWT |
| `diagramme_sequence_reinitialisation_mdp.puml` | OTP SMS |
| `diagramme_sequence_modifier_offre_abonnement.puml` | Modifier offre |
| `diagramme_sequence_sync_stripe.puml` | Sync Stripe |
| `diagramme_sequence_souscrire_abonnement.puml` | Souscription Stripe |
| `diagramme_sequence_generer_facture.puml` | Generer facture |
| `diagramme_sequence_valider_paiement_facture.puml` | Paiement + CNAM |
| `diagramme_sequence_enregistrer_patient.puml` | Enregistrer patient |
| `diagramme_sequence_traiter_demande_medicament.puml` | Demande medicament |
| `diagramme_sequence_declarer_panne.puml` | Declarer panne |
| `diagramme_sequence_affecter_chambre.puml` | **Affecter chambre a un patient** |
| `diagramme_sequence_liberer_chambre.puml` | **Liberer chambre (sortie)** |
| `diagramme_sequence_creer_demande_operation.puml` | **Creer demande d'operation** |
| `diagramme_sequence_traiter_demande_operation.puml` | **Traiter demande d'operation** |

Preview : extension PlantUML VS Code ou [plantuml.com](https://www.plantuml.com/plantuml)
