# Index des diagrammes Clinix

## Regenerer tout

```bash
cd backend/docs
py generate_sequence_crud.py
py drawio/generate_drawio.py
```

## Cas d'utilisation (draw.io) — `drawio/`

| Type | Nombre | Exemple |
|------|--------|---------|
| Simple (par sprint) | 8 | `cu_sprint2_orga_simple.drawio` |
| Detail (hub + S'authentifier) | 11 | `cu_abonnement_detail.drawio` |
| **CRUD complet** | **14** | `cu_crud_clinique_crud.drawio` |

### Modules CRUD draw.io

`cu_crud_clinique`, `cu_crud_service`, `cu_crud_personnel`, `cu_crud_patient`, `cu_crud_chambre`, `cu_crud_equipement`, `cu_crud_medicament`, `cu_crud_offre`, `cu_crud_rdv`, `cu_crud_consultation`, `cu_crud_ordonnance`, `cu_crud_demande_med`, `cu_crud_prestation`, `cu_crud_demande_op`

Chaque fichier : **Creer**, **Consulter liste**, **Consulter detail**, **Modifier**, **Supprimer** (+ actions metier).

## Sequences CRUD (PlantUML) — `sequences_crud/`

14 fichiers, chacun avec 5 sections :

| Fichier | Module |
|---------|--------|
| `crud_clinique.puml` | Clinique |
| `crud_service_medical.puml` | Service medical |
| `crud_personnel.puml` | Personnel |
| `crud_patient.puml` | Patient |
| `crud_chambre.puml` | Chambre |
| `crud_equipement.puml` | Equipement |
| `crud_medicament.puml` | Medicament |
| `crud_offre_abonnement.puml` | Offre abonnement |
| `crud_rendez_vous.puml` | Rendez-vous |
| `crud_consultation.puml` | Consultation |
| `crud_ordonnance.puml` | Ordonnance |
| `crud_demande_medicament.puml` | Demande medicament |
| `crud_prestation_facturation.puml` | Prestation CNAM |
| `crud_demande_operation.puml` | Demande operation |

## Sequences metier (PlantUML) — `docs/`

Authentification, abonnement Stripe, facturation, chambres, operations, pharmacie, etc. (25+ fichiers).

## Outils

- **draw.io** : [app.diagrams.net](https://app.diagrams.net)
- **PlantUML** : extension VS Code ou [plantuml.com](https://www.plantuml.com/plantuml)
