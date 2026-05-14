# Tous les diagrammes de sequence (PlantUML)

Ce dossier contient les diagrammes de sequence principaux du projet.

## Liste des fichiers

- `diagramme_sequence_connexion.puml`: Flux d'authentification (login, verification, tokens JWT, erreurs).
- `diagramme_sequence_rendez_vous.puml`: Creation de rendez-vous avec verification de disponibilite.
- `diagramme_sequence_patients.puml`: Creation d'un patient avec controles de validation.
- `diagramme_sequence_ordonnance.puml`: Creation d'ordonnance avec verification metier.
- `diagramme_sequence_equipements.puml`: Mise en maintenance d'equipements.
- `diagramme_sequence_planning_infirmier.puml`: Consultation du planning infirmier.
- `diagramme_sequence_presences.puml`: Pointage de presence des employes.
- `diagramme_sequence_conges.puml`: Demande et validation de conges.
- `diagramme_sequence_chatbot.puml`: Echange utilisateur avec chatbot.

## Generation rapide (optionnel)

Si PlantUML est installe, exemple de commande:

```bash
plantuml backend/docs/diagramme_sequence_connexion.puml
```

Pour generer tous les fichiers du dossier:

```bash
plantuml backend/docs/*.puml
```
