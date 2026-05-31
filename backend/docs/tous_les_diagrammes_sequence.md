# Tous les diagrammes de sequence (PlantUML)

Ce dossier contient les diagrammes de sequence principaux du projet.

## Liste des fichiers

- `diagramme_sequence_authentification.puml`: **Connexion JWT complete** (login, generation token HMAC, requetes protegees via JwtFilter).
- `diagramme_sequence_connexion.puml`: Vue simplifiee du login JWT (alias connexion).
- `diagramme_sequence_rendez_vous.puml`: Creation de rendez-vous avec verification de disponibilite.
- `diagramme_sequence_patients.puml`: Creation d'un patient avec controles de validation.
- `diagramme_sequence_ordonnance.puml`: Creation d'ordonnance avec verification metier.
- `diagramme_sequence_equipements.puml`: Mise en maintenance d'equipements.
- `diagramme_sequence_planning_infirmier.puml`: Consultation du planning infirmier.
- `diagramme_sequence_presences.puml`: Pointage de presence des employes.
- `diagramme_sequence_conges.puml`: Demande et validation de conges.
- `diagramme_sequence_chatbot.puml`: Echange utilisateur avec chatbot.
- `diagramme_sequence_abonnement.puml`: Souscription abonnement clinique via Stripe Checkout et webhooks.
- `diagramme_sequence_facturation_patient.puml`: Facturation patient a la sortie d'hospitalisation (brouillon, emission, paiement, CNAM, PDF).

## Diagrammes de cas d'utilisation

- `diagramme_cas_utilisation_abonnement.puml`: Acteurs super admin, admin clinique, secretaire, Stripe.
- `diagramme_cas_utilisation_facturation.puml`: Acteurs secretaire et admin clinique, workflow facture patient.

## Rapport PFE

- Texte complet des sprints : `rapport sprint.txt` (racine du projet)
- Diagrammes organises par sprint : `docs/rapport/diagrammes/sprint-0` … `sprint-6`
- Detail abonnements + facturation : `docs/RAPPORT_PFE.md`

## Generation rapide (optionnel)

Si PlantUML est installe, exemple de commande:

```bash
plantuml backend/docs/diagramme_sequence_connexion.puml
```

Pour generer tous les fichiers du dossier:

```bash
plantuml backend/docs/*.puml
```
