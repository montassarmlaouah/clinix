# -*- coding: utf-8 -*-
"""
Generateur de diagrammes de sequence CRUD (PlantUML) pour tous les modules Clinix.
Sortie : backend/docs/sequences_crud/*.puml
Lancer : py generate_sequence_crud.py
"""
import os

HEADER = """@startuml
!theme plain

title sd [CRUD - {title}]

"""

FOOTER = """
@enduml
"""

REF = """
ref over {actor}, UI
  S'authentifier
end ref
"""

SEP = "\n== {label} ==\n\n"


def actor_id(name):
    return name.replace(" ", "_").replace("/", "_")


def block_create(e):
    return f"""{SEP.format(label="Creer")}
autonumber
{REF.format(actor=actor_id(e["actor"]), UI="UI")}

{actor_id(e["actor"])} -> UI : Cliquer Creer / Nouveau
UI --> {actor_id(e["actor"])} : Afficher formulaire
{actor_id(e["actor"])} -> UI : Remplir et confirmer
UI -> Controller : {e["create"][0]} {e["base"]}{e["create"][1]}
Controller -> Service : {e["create"][2]}(dto)
Service -> DAO : save(entity)
DAO --> Service : Entity creee
Service --> Controller : Entity
Controller --> UI : 201 Created
UI --> {actor_id(e["actor"])} : Message de succes
"""


def block_read_list(e):
    return f"""
== Consulter la liste ==

autonumber
{REF.format(actor=actor_id(e["actor"]), UI="UI")}

{actor_id(e["actor"])} -> UI : Ouvrir la liste
UI -> Controller : {e["list"][0]} {e["base"]}{e["list"][1]}
Controller -> Service : {e["list"][2]}()
Service -> DAO : findAll() / findByClinique(...)
DAO --> Service : Liste
Service --> Controller : List
Controller --> UI : 200 OK
UI --> {actor_id(e["actor"])} : Afficher la liste
"""


def block_read_detail(e):
    return f"""
== Consulter le detail ==

autonumber
{REF.format(actor=actor_id(e["actor"]), UI="UI")}

{actor_id(e["actor"])} -> UI : Cliquer sur un element
UI -> Controller : {e["detail"][0]} {e["base"]}{e["detail"][1]}
Controller -> Service : {e["detail"][2]}(id)
Service -> DAO : findById(id)

alt [Element introuvable]
  DAO --> Service : empty
  Service --> Controller : NotFoundException
  Controller --> UI : 404 Not Found
  UI --> {actor_id(e["actor"])} : Message d'erreur
else [Element trouve]
  DAO --> Service : Entity
  Service --> Controller : Entity
  Controller --> UI : 200 OK
  UI --> {actor_id(e["actor"])} : Afficher le detail
end
"""


def block_update(e):
    return f"""
== Modifier ==

autonumber
{REF.format(actor=actor_id(e["actor"]), UI="UI")}

{actor_id(e["actor"])} -> UI : Cliquer Modifier
UI --> {actor_id(e["actor"])} : Afficher formulaire pre-rempli
{actor_id(e["actor"])} -> UI : Modifier les champs et confirmer
UI -> Controller : {e["update"][0]} {e["base"]}{e["update"][1]}
Controller -> Service : {e["update"][2]}(id, dto)
Service -> DAO : findById(id)
DAO --> Service : Entity

alt [Donnees invalides]
  Service --> Controller : Erreur validation
  Controller --> UI : 400 Bad Request
  UI --> {actor_id(e["actor"])} : Afficher erreurs
else [Modification valide]
  Service -> DAO : save(entity)
  DAO --> Service : Entity mise a jour
  Service --> Controller : Entity
  Controller --> UI : 200 OK
  UI --> {actor_id(e["actor"])} : Message de succes
end
"""


def block_delete(e):
    return f"""
== Supprimer ==

autonumber
{REF.format(actor=actor_id(e["actor"]), UI="UI")}

{actor_id(e["actor"])} -> UI : Cliquer Supprimer
UI --> {actor_id(e["actor"])} : Boite de confirmation
{actor_id(e["actor"])} -> UI : Confirmer la suppression
UI -> Controller : {e["delete"][0]} {e["base"]}{e["delete"][1]}
Controller -> Service : {e["delete"][2]}(id)
Service -> DAO : findById(id)

alt [Suppression impossible (contrainte metier)]
  Service --> Controller : RuntimeException
  Controller --> UI : 400 Bad Request
  UI --> {actor_id(e["actor"])} : Afficher message d'erreur
else [Suppression valide]
  Service -> DAO : delete(entity)
  DAO --> Service : OK
  Service --> Controller : void
  Controller --> UI : 204 No Content
  UI --> {actor_id(e["actor"])} : Element supprime
end
"""


def build_entity(e):
    actor = e["actor"]
    parts = [
        HEADER.format(title=e["title"]),
        f"actor {actor_id(actor)} as \"{actor}\"\n",
        f"boundary UI as \"{e['ui']}\"\n",
        f"control Controller as \"{e['controller']}\"\n",
        f"control Service as \"{e['service']}\"\n",
        f"entity DAO as \"{e['dao']}\"\n",
        block_create(e),
        block_read_list(e),
        block_read_detail(e),
        block_update(e),
        block_delete(e),
        FOOTER,
    ]
    return "".join(parts)


ENTITIES = [
    {
        "file": "crud_clinique", "title": "Clinique", "actor": "Super administrateur",
        "ui": ":UI Cliniques", "controller": "CliniqueController", "service": "CliniqueService",
        "dao": "CliniqueRepository", "base": "/api/cliniques",
        "create": ("POST", "", "creerClinique"), "list": ("GET", "", "listerCliniques"),
        "detail": ("GET", "/{id}", "obtenirParId"), "update": ("PUT", "/{id}", "mettreAJour"),
        "delete": ("DELETE", "/{id}", "supprimer"),
    },
    {
        "file": "crud_service_medical", "title": "Service medical", "actor": "Administrateur clinique",
        "ui": ":UI Services medicaux", "controller": "ServiceController", "service": "ServiceService",
        "dao": "ServiceRepository", "base": "/api/services",
        "create": ("POST", "", "creerService"), "list": ("GET", "/clinique/{cliniqueId}", "listerParClinique"),
        "detail": ("GET", "/{id}", "obtenirParId"), "update": ("PUT", "/{id}", "mettreAJour"),
        "delete": ("DELETE", "/{id}", "supprimer"),
    },
    {
        "file": "crud_personnel", "title": "Personnel", "actor": "Administrateur clinique",
        "ui": ":UI Personnel", "controller": "PersonnelController", "service": "PersonnelService",
        "dao": "UserRepository", "base": "/api/personnel",
        "create": ("POST", "", "creerPersonnel"), "list": ("GET", "/medecins", "listerMedecins"),
        "detail": ("GET", "/medecins/{id}", "obtenirMedecin"), "update": ("PUT", "/medecins/{id}", "mettreAJour"),
        "delete": ("DELETE", "/medecins/{id}", "desactiver"),
    },
    {
        "file": "crud_patient", "title": "Patient", "actor": "Secretaire",
        "ui": ":UI Patients", "controller": "PatientController", "service": "PatientService",
        "dao": "PatientRepository", "base": "/api/patients",
        "create": ("POST", "", "creerPatient"), "list": ("GET", "/clinique/{cliniqueId}", "listerParClinique"),
        "detail": ("GET", "/{id}", "obtenirParId"), "update": ("PUT", "/{id}", "mettreAJour"),
        "delete": ("DELETE", "/{id}", "supprimer"),
    },
    {
        "file": "crud_chambre", "title": "Chambre", "actor": "Administrateur clinique",
        "ui": ":UI Chambres", "controller": "ChambreController", "service": "ChambreService",
        "dao": "ChambreRepository", "base": "/api/chambres",
        "create": ("POST", "", "creerChambre"), "list": ("GET", "/clinique/{cliniqueId}", "listerParClinique"),
        "detail": ("GET", "/{id}", "obtenirParId"), "update": ("PUT", "/{id}", "mettreAJour"),
        "delete": ("DELETE", "/{id}", "supprimer"),
    },
    {
        "file": "crud_equipement", "title": "Equipement", "actor": "Administrateur clinique",
        "ui": ":UI Equipements", "controller": "EquipementController", "service": "EquipementService",
        "dao": "EquipementRepository", "base": "/api/equipements",
        "create": ("POST", "", "creerEquipement"), "list": ("GET", "/clinique/{cliniqueId}", "listerParClinique"),
        "detail": ("GET", "/{id}", "obtenirParId"), "update": ("PUT", "/{id}", "mettreAJour"),
        "delete": ("DELETE", "/{id}", "supprimer"),
    },
    {
        "file": "crud_medicament", "title": "Medicament", "actor": "Pharmacien",
        "ui": ":UI Pharmacie", "controller": "MedicamentController", "service": "MedicamentService",
        "dao": "MedicamentRepository", "base": "/api/medicaments",
        "create": ("POST", "", "creerMedicament"), "list": ("GET", "", "listerMedicaments"),
        "detail": ("GET", "/{id}", "obtenirParId"), "update": ("PUT", "/{id}", "mettreAJour"),
        "delete": ("DELETE", "/{id}", "supprimer"),
    },
    {
        "file": "crud_offre_abonnement", "title": "Offre abonnement", "actor": "Super administrateur",
        "ui": ":UI Offres abonnement", "controller": "BillingController", "service": "BillingManagementService",
        "dao": "OffreAbonnementRepository", "base": "/api/billing/offres",
        "create": ("POST", "", "creerOffre"), "list": ("GET", "", "listerOffres"),
        "detail": ("GET", "/{id}", "obtenirOffre"), "update": ("PATCH", "/{id}", "mettreAJourOffre"),
        "delete": ("DELETE", "/{id}", "desactiverOffre"),
    },
    {
        "file": "crud_rendez_vous", "title": "Rendez-vous", "actor": "Secretaire",
        "ui": ":UI Rendez-vous", "controller": "RendezVousController", "service": "RendezVousService",
        "dao": "RendezVousRepository", "base": "/api/rendez-vous",
        "create": ("POST", "", "planifier"), "list": ("GET", "/clinique/{cliniqueId}", "listerParClinique"),
        "detail": ("GET", "/{id}", "obtenirParId"), "update": ("PUT", "/{id}", "mettreAJour"),
        "delete": ("DELETE", "/{id}", "annuler"),
    },
    {
        "file": "crud_consultation", "title": "Consultation", "actor": "Medecin",
        "ui": ":UI Consultation", "controller": "ConsultationController", "service": "ConsultationService",
        "dao": "ConsultationRepository", "base": "/api/consultations",
        "create": ("POST", "", "enregistrerConsultation"), "list": ("GET", "/patient/{patientId}", "listerParPatient"),
        "detail": ("GET", "/{id}", "obtenirParId"), "update": ("PATCH", "/{id}/diagnostic", "majDiagnostic"),
        "delete": ("DELETE", "/{id}", "supprimer"),
    },
    {
        "file": "crud_demande_medicament", "title": "Demande medicament", "actor": "Medecin",
        "ui": ":UI Demandes medicament", "controller": "DemandeMedicamentController", "service": "DemandeMedicamentService",
        "dao": "DemandeMedicamentRepository", "base": "/api/demandes-medicament",
        "create": ("POST", "", "creerDemande"), "list": ("GET", "/en-attente", "listerEnAttente"),
        "detail": ("GET", "/{id}", "obtenirParId"), "update": ("PATCH", "/{id}/statut", "changerStatut"),
        "delete": ("DELETE", "/{id}", "annuler"),
    },
    {
        "file": "crud_prestation_facturation", "title": "Prestation facturation", "actor": "Administrateur clinique",
        "ui": ":UI Facturation", "controller": "FacturationPatientController", "service": "FacturationPatientService",
        "dao": "PrestationFacturationRepository", "base": "/api/facturation-patient/prestations",
        "create": ("POST", "/clinique/{id}/initialiser", "initialiserCatalogue"),
        "list": ("GET", "/clinique/{cliniqueId}", "listerPrestations"),
        "detail": ("GET", "/{id}", "obtenirPrestation"), "update": ("PUT", "/{id}", "mettreAJourPrestation"),
        "delete": ("DELETE", "/{id}", "desactiverPrestation"),
    },
    {
        "file": "crud_demande_operation", "title": "Demande operation", "actor": "Medecin",
        "ui": ":UI Demandes operation", "controller": "DemandeOperationController", "service": "DemandeOperationService",
        "dao": "DemandeOperationRepository", "base": "/api/demandes-operation",
        "create": ("POST", "", "creer"), "list": ("GET", "?cliniqueId=...", "listerParClinique"),
        "detail": ("GET", "/{id}", "obtenir"), "update": ("PATCH", "/{id}/statut", "changerStatut"),
        "delete": ("DELETE", "/{id}", "annuler"),
    },
    {
        "file": "crud_ordonnance", "title": "Ordonnance", "actor": "Medecin",
        "ui": ":UI Ordonnances", "controller": "OrdonnanceController", "service": "OrdonnanceService",
        "dao": "OrdonnanceRepository", "base": "/api/ordonnances",
        "create": ("POST", "", "genererOrdonnance"), "list": ("GET", "/patient/{patientId}", "listerParPatient"),
        "detail": ("GET", "/{id}", "obtenirParId"), "update": ("PUT", "/{id}", "mettreAJour"),
        "delete": ("DELETE", "/{id}", "supprimer"),
    },
]


def main():
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sequences_crud")
    os.makedirs(out, exist_ok=True)
    index_lines = ["# Diagrammes de sequence CRUD\n\n| Fichier | Module |\n|---------|--------|\n"]
    for e in ENTITIES:
        path = os.path.join(out, e["file"] + ".puml")
        with open(path, "w", encoding="utf-8") as f:
            f.write(build_entity(e))
        print("Genere :", path)
        index_lines.append(f"| `{e['file']}.puml` | {e['title']} |\n")
    index_path = os.path.join(out, "README.md")
    with open(index_path, "w", encoding="utf-8") as f:
        f.writelines(index_lines)
    print(f"\nTotal : {len(ENTITIES)} fichiers CRUD dans {out}")


if __name__ == "__main__":
    main()
