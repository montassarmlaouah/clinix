# -*- coding: utf-8 -*-
"""
Generateur draw.io : cas d'utilisation SIMPLES et DETAILLES (style hub + S'authentifier).
Lancer : py generate_drawio.py
"""
import html
import os

STYLE_ACTOR = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#dae8fc;strokeColor=#6c8ebf;"
STYLE_BOUNDARY = "rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;fontStyle=1;fontSize=14;fillColor=none;strokeColor=#000000;align=center;spacingTop=8;"
STYLE_UC = "ellipse;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;"
STYLE_UC_HUB = "ellipse;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;fontStyle=1"
STYLE_ASSOC = "endArrow=none;html=1;strokeColor=#333333;rounded=0;"
STYLE_INC = "endArrow=open;dashed=1;html=1;strokeColor=#9673A6;fontSize=11;rounded=0;"
STYLE_EXT = "endArrow=open;dashed=1;html=1;strokeColor=#9673A6;fontSize=11;rounded=0;exitX=1;exitY=0.5;entryX=0;entryY=0.5;"
STYLE_PKG = "rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;fontStyle=1;fontSize=13;fillColor=none;strokeColor=#666666;align=center;spacingTop=6;"

# --- Simple layout ---
ACTOR_X, PKG_X = 40, 300
UC_W, UC_H, UC_GAP = 240, 50, 70


def esc(s):
    return html.escape(str(s), quote=True)


def cell(cid, value, style, x, y, w, h):
    return (
        f'        <mxCell id="{esc(cid)}" value="{esc(value)}" style="{style}" '
        f'vertex="1" parent="1">\n'
        f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry" />\n'
        f'        </mxCell>\n'
    )


def edge(eid, src, tgt, style, value="", parent="1"):
    return (
        f'        <mxCell id="{esc(eid)}" value="{esc(value)}" style="{style}" '
        f'edge="1" parent="{esc(parent)}" source="{esc(src)}" target="{esc(tgt)}">\n'
        f'          <mxGeometry relative="1" as="geometry" />\n'
        f'        </mxCell>\n'
    )


def wrap_mxfile(title, file_id, width, height, cells):
    return (
        f'<mxfile host="app.diagrams.net" type="device">\n'
        f'  <diagram name="{esc(title)}" id="{esc(file_id)}">\n'
        f'    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" '
        f'tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" '
        f'pageWidth="{width}" pageHeight="{height}" math="0" shadow="0">\n'
        f'      <root>\n'
        f'        <mxCell id="0" />\n'
        f'        <mxCell id="1" parent="0" />\n'
        f'{cells}'
        f'      </root>\n'
        f'    </mxGraphModel>\n'
        f'  </diagram>\n'
        f'</mxfile>\n'
    )


STYLE_UC_CAS = "ellipse;whiteSpace=wrap;html=1;fillColor=none;fontSize=12;"
STYLE_EXT_ORTHO = (
    "endArrow=open;dashed=1;html=1;strokeColor=#9673A6;fontSize=11;"
    "edgeStyle=orthogonalEdgeStyle;rounded=0;"
)
STYLE_INC_ORTHO = (
    "endArrow=open;dashed=1;html=1;strokeColor=#9673A6;fontSize=11;"
    "edgeStyle=orthogonalEdgeStyle;rounded=0;"
)


def build_packages(d, uc_style=STYLE_UC):
    """Construit packages, cas d'utilisation, acteurs et associations."""
    cells = ""
    cursor_y = 60
    for pkg in d["packages"]:
        ucs = pkg["usecases"]
        pkg_h = 36 + len(ucs) * UC_GAP + 20
        pid = "pkg_" + pkg["name"][:20].replace(" ", "_")
        cells += cell(pid, pkg["name"], STYLE_PKG, PKG_X, cursor_y, 320, pkg_h)
        uy = cursor_y + 36
        for ucid, label in ucs:
            cells += cell(ucid, label, uc_style, PKG_X + 40, uy, UC_W, UC_H)
            uy += UC_GAP
        cursor_y += pkg_h + 30

    n = len(d["actors"])
    step = max((cursor_y - 120) / max(n - 1, 1), 90)
    ay = 60
    for aid, label in d["actors"]:
        cells += cell(aid, label, STYLE_ACTOR, ACTOR_X, int(ay), 50, 90)
        ay += step

    i = 0
    for aid, ucid in d.get("assoc", []):
        cells += edge(f"a{i}", aid, ucid, STYLE_ASSOC)
        i += 1
    for src, tgt, lbl in d.get("deps", []):
        style = STYLE_EXT_ORTHO if "extend" in lbl.lower() else STYLE_INC_ORTHO
        cells += edge(f"d{i}", src, tgt, style, lbl)
        i += 1

    return cells, cursor_y


def build_simple(d):
    cells, cursor_y = build_packages(d)
    return wrap_mxfile(d["title"] + " (simple)", d["file"] + "_simple", 700, cursor_y + 40, cells)


def build_cas_utilisation(d, diagram_id=None):
    """Diagramme cas d'utilisation principal (fichier cas_utilisation_*.drawio)."""
    cells, cursor_y = build_packages(d, uc_style=STYLE_UC_CAS)
    file_id = diagram_id or d.get("cas_id", d["file"].replace("cu_", "cas_utilisation_"))
    return wrap_mxfile(d["title"], file_id, 700, cursor_y + 40, cells)


def calc_detailed_height(d):
    hub_y = 80
    for hub in d["hubs"]:
        hub_y += max(len(hub["extends"]) * 65, 120) + 40
    return max(d.get("height", 520), hub_y + 80)


def build_detailed(d):
    """Style exemple : acteur -> hub <<include>> auth, sous-cas <<extend>> hub."""
    cells = ""
    bw = d.get("width", 950)
    bh = calc_detailed_height(d)
    cells += cell("boundary", d["boundary"], STYLE_BOUNDARY, 40, 30, bw, bh, )

    auth_id = "AUTH"
    cells += cell(auth_id, "S'authentifier", STYLE_UC, bw - 140, bh // 2 + 10, 130, 50)

    hub_y = 80
    ei = 0
    for hub in d["hubs"]:
        hid = hub["id"]
        cells += cell(hid, hub["label"], STYLE_UC_HUB, 260, hub_y, 180, 55)
        cells += edge(f"ha{ei}", hub["actor"], hid, STYLE_ASSOC)
        cells += edge(f"hi{ei}", hid, auth_id, STYLE_INC, "<<include>>")
        ext_y = hub_y - 20
        for j, (eid, elabel) in enumerate(hub["extends"]):
            cells += cell(eid, elabel, STYLE_UC, 520, ext_y + j * 65, 220, 50)
            cells += edge(f"he{ei}_{j}", eid, hid, STYLE_EXT, "<<extend>>")
        hub_y += max(len(hub["extends"]) * 65, 120) + 40
        ei += 1

    for aid, label, ay in d["actors"]:
        cells += cell(aid, label, STYLE_ACTOR, 100, ay, 50, 90)

    return wrap_mxfile(d["title"] + " (detail)", d["file"] + "_detail", bw + 80, bh + 80, cells)


# ===========================================================================
# DEFINITIONS
# ===========================================================================

SIMPLE_DIAGRAMS = [
    {
        "file": "cu_sprint1_auth",
        "title": "Sprint 1 - Authentification",
        "actors": [("USER", "Utilisateur"), ("ADMIN", "Administrateur")],
        "packages": [{"name": "Authentification", "usecases": [
            ("UC1", "Se connecter"), ("UC2", "Se deconnecter"), ("UC3", "Reinitialiser MDP (OTP SMS)"),
            ("UC4", "Consulter profil"), ("UC5", "Modifier profil"), ("UC6", "Gerer roles"),
        ]}],
        "assoc": [("USER", "UC1"), ("USER", "UC2"), ("USER", "UC3"), ("USER", "UC4"), ("USER", "UC5"), ("ADMIN", "UC6")],
    },
    {
        "file": "cu_sprint2_orga",
        "title": "Sprint 2 - Organisation",
        "actors": [("SA", "Super Admin"), ("AC", "Admin clinique")],
        "packages": [{"name": "Organisation", "usecases": [
            ("UC1", "Gerer cliniques"), ("UC2", "Gerer cabinets medicaux"), ("UC3", "Gerer personnel"),
            ("UC4", "Gerer services medicaux"),
        ]}],
        "assoc": [("SA", "UC1"), ("SA", "UC2"), ("AC", "UC3"), ("AC", "UC4")],
    },
    {
        "file": "cu_sprint2_abonnement",
        "title": "Sprint 2 - Abonnements",
        "actors": [("SA", "Super Admin"), ("AC", "Admin clinique"), ("MED", "Medecin")],
        "packages": [{"name": "Abonnement SaaS", "usecases": [
            ("AB1", "Gerer offres"), ("AB2", "Sync Stripe"), ("AB3", "Souscrire & payer"),
            ("AB4", "Mon abonnement + historique"),
        ]}],
        "assoc": [("SA", "AB1"), ("SA", "AB2"), ("AC", "AB3"), ("AC", "AB4"), ("MED", "AB3"), ("MED", "AB4")],
    },
    {
        "file": "cu_sprint3_metier",
        "title": "Sprint 3 - Parcours patient",
        "actors": [("SEC", "Secretaire"), ("MED", "Medecin"), ("PAT", "Patient")],
        "packages": [{"name": "Metier clinique", "usecases": [
            ("UC1", "Enregistrer patient"), ("UC2", "Consulter dossier"), ("UC3", "Consultation"),
            ("UC4", "Ordonnance"), ("UC5", "Planifier RDV"), ("UC6", "Demande operation"),
        ]}],
        "assoc": [("SEC", "UC1"), ("SEC", "UC5"), ("MED", "UC2"), ("MED", "UC3"), ("MED", "UC4"), ("MED", "UC6"), ("PAT", "UC5")],
    },
    {
        "file": "cu_sprint4_pharmacie",
        "title": "Sprint 4 - Pharmacie",
        "actors": [("PHA", "Pharmacien"), ("MED", "Medecin")],
        "packages": [{"name": "Pharmacie", "usecases": [
            ("UC1", "Catalogue medicaments"), ("UC2", "Stock & alertes"), ("UC3", "Bons d'entree"),
            ("UC4", "Demande medicament"), ("UC5", "Traiter demande"),
        ]}],
        "assoc": [("PHA", "UC1"), ("PHA", "UC2"), ("PHA", "UC3"), ("PHA", "UC5"), ("MED", "UC4")],
    },
    {
        "file": "cu_sprint5_ressources",
        "title": "Sprint 5 - Equipements & chambres",
        "actors": [("AC", "Admin clinique"), ("TM", "Technicien"), ("SEC", "Secretaire")],
        "packages": [{"name": "Ressources", "usecases": [
            ("UC1", "Gerer equipements"), ("UC2", "Declarer panne / maintenance"),
            ("UC3", "Gerer chambres"), ("UC4", "Affecter / liberer chambre"),
        ]}],
        "assoc": [("AC", "UC1"), ("AC", "UC3"), ("TM", "UC2"), ("SEC", "UC3"), ("SEC", "UC4")],
    },
    {
        "file": "cu_sprint5_facturation",
        "title": "Sprint 5 - Facturation patient",
        "actors": [("AC", "Admin clinique"), ("SEC", "Secretaire")],
        "packages": [{"name": "Facturation", "usecases": [
            ("F1", "Catalogue prestations"), ("F2", "Generer facture sortie"),
            ("F3", "Emettre facture"), ("F4", "Valider paiement"), ("F5", "Teletransmettre CNAM"), ("F6", "PDF facture"),
        ]}],
        "assoc": [("AC", "F1"), ("SEC", "F2"), ("SEC", "F3"), ("SEC", "F4"), ("SEC", "F5"), ("SEC", "F6")],
    },
    {
        "file": "cu_sprint6_dashboard",
        "title": "Sprint 6 - Dashboard",
        "actors": [("USER", "Utilisateur"), ("AC", "Admin clinique")],
        "packages": [{"name": "Pilotage", "usecases": [
            ("UC1", "Dashboard par role"), ("UC2", "KPI & graphiques"), ("UC3", "Filtres periode"),
            ("UC4", "Notifications"), ("UC5", "Export statistiques"),
        ]}],
        "assoc": [("USER", "UC1"), ("USER", "UC2"), ("USER", "UC3"), ("USER", "UC4"), ("AC", "UC2"), ("USER", "UC5")],
    },
    {
        "file": "cu_sprint6_planning_conges_dashboard",
        "title": "Sprint 6 - Planning, conges, Dashboard & reporting",
        "actors": [
            ("CP", "Chef personnel"), ("INF", "Infirmier"), ("EMP", "Employe"),
            ("USER", "Utilisateur"), ("AC", "Admin clinique"), ("RAD", "Radiologue"),
        ],
        "packages": [
            {"name": "Planning infirmiers", "usecases": [
                ("P1", "Creer planning hebdo/mensuel"), ("P2", "Affecter gardes & creneaux"),
                ("P3", "Valider planning"), ("P4", "Consulter mon planning"), ("P5", "Exporter PDF planning"),
            ]},
            {"name": "Conges & absences", "usecases": [
                ("C1", "Demander un conge"), ("C2", "Approuver / refuser demande"),
                ("C3", "Consulter demandes en attente"),
            ]},
            {"name": "Dashboard & pilotage", "usecases": [
                ("D1", "Dashboard par role"), ("D2", "KPI & graphiques"), ("D3", "Filtres periode"),
                ("D4", "Notifications"), ("D5", "Exporter statistiques (PDF)"),
            ]},
            {"name": "Rapports imagerie (reporting)", "usecases": [
                ("R1", "Rediger rapport (brouillon)"), ("R2", "Valider rapport imagerie"),
                ("R3", "Exporter rapport PDF"),
            ]},
        ],
        "assoc": [
            ("CP", "P1"), ("CP", "P2"), ("CP", "P3"), ("CP", "P5"),
            ("INF", "P4"), ("INF", "P5"),
            ("EMP", "C1"), ("CP", "C2"), ("CP", "C3"),
            ("USER", "D1"), ("USER", "D2"), ("USER", "D3"), ("USER", "D4"), ("AC", "D2"), ("USER", "D5"),
            ("RAD", "R1"), ("RAD", "R2"), ("RAD", "R3"),
        ],
        "deps": [
            ("P3", "C3", "<<extend>> verifier conflits conges"),
            ("D2", "D5", "<<extend>>"),
        ],
    },
]

DETAILED_DIAGRAMS = [
    {
        "file": "cu_sprint1_auth",
        "title": "Sprint 1 - Authentification & securite",
        "boundary": "Authentification & securite",
        "width": 900, "height": 480,
        "actors": [("USER", "Utilisateur\n(tous roles)", 180)],
        "hubs": [{
            "id": "H1", "label": "Gerer\nl'authentification", "actor": "USER",
            "extends": [
                ("E1", "Se connecter\n(telephone + MDP)"),
                ("E2", "Se deconnecter"),
                ("E3", "Reinitialiser MDP\nvia OTP SMS"),
                ("E4", "Consulter / modifier\nson profil"),
            ],
        }],
    },
    {
        "file": "cu_sprint2_cliniques",
        "title": "Sprint 2 - Gestion cliniques & cabinets",
        "boundary": "Gestion des cliniques et cabinets medicaux",
        "width": 950, "height": 520,
        "actors": [("SA", "Super\nadministrateur", 200)],
        "hubs": [
            {
                "id": "H1", "label": "Gerer\ncliniques", "actor": "SA",
                "extends": [
                    ("E1", "Consulter la liste\ndes cliniques"),
                    ("E2", "Creer / modifier\nune clinique"),
                    ("E3", "Activer / desactiver\nune clinique"),
                    ("E4", "Consulter le detail\nd'une clinique"),
                ],
            },
            {
                "id": "H2", "label": "Gerer cabinets\nmedicaux", "actor": "SA",
                "extends": [
                    ("E5", "Consulter la liste\ndes cabinets"),
                    ("E6", "Creer / modifier\nun cabinet"),
                ],
            },
        ],
    },
    {
        "file": "cu_sprint2_personnel",
        "title": "Sprint 2 - Gestion personnel & services",
        "boundary": "Gestion du personnel et des services medicaux",
        "width": 950, "height": 480,
        "actors": [("AC", "Administrateur\nclinique", 180)],
        "hubs": [
            {
                "id": "H1", "label": "Gerer\npersonnel", "actor": "AC",
                "extends": [
                    ("E1", "Consulter la liste\ndu personnel"),
                    ("E2", "Creer / modifier\nun compte"),
                    ("E3", "Desactiver\nun compte"),
                ],
            },
            {
                "id": "H2", "label": "Gerer services\nmedicaux", "actor": "AC",
                "extends": [
                    ("E4", "Consulter les services"),
                    ("E5", "Creer / modifier\nun service"),
                ],
            },
        ],
    },
    {
        "file": "cu_abonnement",
        "title": "Gestion des abonnements",
        "boundary": "Gestion des abonnements (SaaS Clinix)",
        "width": 980, "height": 620,
        "actors": [
            ("SA", "Super\nadministrateur", 80),
            ("AC", "Administrateur\nclinique", 320),
        ],
        "hubs": [
            {
                "id": "H1", "label": "Gerer offres\nd'abonnement", "actor": "SA",
                "extends": [
                    ("E1", "Consulter la liste\ndes offres"),
                    ("E2", "Ajouter une offre"),
                    ("E3", "Modifier une offre"),
                    ("E4", "Activer / desactiver\nune offre"),
                    ("E5", "Synchroniser\navec Stripe"),
                ],
            },
            {
                "id": "H2", "label": "Gerer mon\nabonnement", "actor": "AC",
                "extends": [
                    ("E6", "Consulter les offres\nactives"),
                    ("E7", "Souscrire via\nStripe Checkout"),
                    ("E8", "Consulter abonnement\ncourant + historique"),
                ],
            },
        ],
    },
    {
        "file": "cu_facturation",
        "title": "Gestion de la facturation patient",
        "boundary": "Gestion de la facturation patient",
        "width": 950, "height": 560,
        "actors": [
            ("AC", "Administrateur\nclinique", 100),
            ("SEC", "Secretaire", 280),
        ],
        "hubs": [
            {
                "id": "H1", "label": "Gerer catalogue\nprestations", "actor": "AC",
                "extends": [
                    ("E1", "Consulter prestations\nCNAM par clinique"),
                    ("E2", "Initialiser / modifier\nune prestation"),
                ],
            },
            {
                "id": "H2", "label": "Gerer facturation\npatient", "actor": "SEC",
                "extends": [
                    ("E3", "Generer facture\n(sortie hospitalisation)"),
                    ("E4", "Ajouter prestations\nsupplementaires"),
                    ("E5", "Emettre la facture"),
                    ("E6", "Valider le paiement"),
                    ("E7", "Teletransmettre\nprise en charge CNAM"),
                    ("E8", "Telecharger\nfacture PDF"),
                ],
            },
        ],
    },
    {
        "file": "cu_sprint3_patients",
        "title": "Sprint 3 - Patients & dossier medical",
        "boundary": "Enregistrement patient et dossier medical",
        "width": 950, "height": 500,
        "actors": [("SEC", "Secretaire", 120), ("MED", "Medecin", 280)],
        "hubs": [
            {
                "id": "H1", "label": "Gerer\npatients", "actor": "SEC",
                "extends": [
                    ("E1", "Enregistrer un patient"),
                    ("E2", "Mettre a jour\ninfos administratives"),
                    ("E3", "Rechercher / filtrer\npatients"),
                ],
            },
            {
                "id": "H2", "label": "Gerer dossier\nmedical", "actor": "MED",
                "extends": [
                    ("E4", "Consulter le dossier"),
                    ("E5", "Enregistrer consultation"),
                    ("E6", "Generer ordonnance"),
                    ("E7", "Demander examens"),
                ],
            },
        ],
    },
    {
        "file": "cu_sprint3_rdv",
        "title": "Sprint 3 - Rendez-vous & operations",
        "boundary": "Rendez-vous et demandes d'operation",
        "width": 950, "height": 520,
        "actors": [("SEC", "Secretaire", 100), ("MED", "Medecin", 260), ("PAT", "Patient", 420)],
        "hubs": [
            {
                "id": "H1", "label": "Gerer\nrendez-vous", "actor": "SEC",
                "extends": [
                    ("E1", "Planifier un RDV"),
                    ("E2", "Gerer file d'attente"),
                    ("E3", "Annuler / modifier RDV"),
                    ("E4", "Recevoir rappel\nemail (J-1)"),
                ],
            },
            {
                "id": "H2", "label": "Gerer demandes\nd'operation", "actor": "MED",
                "extends": [
                    ("E5", "Creer demande operation"),
                    ("E6", "Transmettre a\nclinique cible"),
                ],
            },
        ],
    },
    {
        "file": "cu_sprint4_pharmacie",
        "title": "Sprint 4 - Pharmacie & stocks",
        "boundary": "Pharmacie, stocks et demandes de medicaments",
        "width": 950, "height": 580,
        "actors": [("PHA", "Pharmacien", 120), ("MED", "Medecin /\nInfirmier", 320)],
        "hubs": [
            {
                "id": "H1", "label": "Gerer stock\npharmaceutique", "actor": "PHA",
                "extends": [
                    ("E1", "Gerer catalogue\nmedicaments"),
                    ("E2", "Consulter stock\n& mouvements"),
                    ("E3", "Visualiser alertes\nstock bas"),
                    ("E4", "Creer bon d'entree"),
                ],
            },
            {
                "id": "H2", "label": "Gerer demandes\nde medicament", "actor": "MED",
                "extends": [
                    ("E5", "Envoyer une demande"),
                    ("E6", "Traiter demande\n(valider / refuser)"),
                    ("E7", "Consulter historique\ndes demandes"),
                ],
            },
        ],
    },
    {
        "file": "cu_sprint5_equipements",
        "title": "Sprint 5 - Equipements & maintenance",
        "boundary": "Equipements et maintenance",
        "width": 950, "height": 500,
        "actors": [("AC", "Administrateur\nclinique", 120), ("TM", "Technicien\nmaintenance", 300)],
        "hubs": [
            {
                "id": "H1", "label": "Gerer\nequipements", "actor": "AC",
                "extends": [
                    ("E1", "Consulter equipements"),
                    ("E2", "Creer / modifier\nequipement"),
                    ("E3", "Declarer une panne"),
                ],
            },
            {
                "id": "H2", "label": "Gerer\nmaintenance", "actor": "TM",
                "extends": [
                    ("E4", "Consulter interventions"),
                    ("E5", "Planifier maintenance"),
                    ("E6", "Cloturer maintenance"),
                ],
            },
        ],
    },
    {
        "file": "cu_sprint5_chambres",
        "title": "Sprint 5 - Gestion des chambres",
        "boundary": "Gestion des chambres",
        "width": 850, "height": 400,
        "actors": [("AC", "Administrateur\nclinique", 140), ("SEC", "Secretaire", 280)],
        "hubs": [{
            "id": "H1", "label": "Gerer\nchambres", "actor": "SEC",
            "extends": [
                ("E1", "Consulter chambres\n& occupation"),
                ("E2", "Affecter chambre\na un patient"),
                ("E3", "Liberer une chambre"),
            ],
        }],
    },
    {
        "file": "cu_sprint6_dashboard",
        "title": "Sprint 6 - Dashboard & notifications",
        "boundary": "Consultation des statistiques et notifications",
        "width": 900, "height": 480,
        "actors": [("USER", "Utilisateur\nauthentifie", 180)],
        "hubs": [{
            "id": "H1", "label": "Consulter\nstatistiques", "actor": "USER",
            "extends": [
                ("E1", "Dashboard adapte\nau role"),
                ("E2", "KPI & graphiques\ndynamiques"),
                ("E3", "Filtrer par periode"),
                ("E4", "Exporter\n(image / PDF)"),
                ("E5", "Centre de\nnotifications"),
            ],
        }],
    },
    {
        "file": "cu_sprint6_planning_conges_dashboard",
        "title": "Sprint 6 - Planning, conges, Dashboard & reporting",
        "boundary": "Planning, conges, tableaux de bord et rapports",
        "width": 1000,
        "actors": [
            ("CP", "Chef de\npersonnel", 40),
            ("INF", "Infirmier", 220),
            ("EMP", "Employe", 400),
            ("USER", "Utilisateur\nauthentifie", 580),
            ("RAD", "Radiologue", 760),
        ],
        "hubs": [
            {
                "id": "H1", "label": "Gerer\nplanning", "actor": "CP",
                "extends": [
                    ("E1", "Creer planning\nhebdomadaire / mensuel"),
                    ("E2", "Affecter gardes\n(matin / apres-midi / nuit)"),
                    ("E3", "Valider / invalider\nplanning"),
                    ("E4", "Exporter planning\nPDF"),
                ],
            },
            {
                "id": "H2", "label": "Consulter\nmon planning", "actor": "INF",
                "extends": [
                    ("E5", "Vue semaine\n& historique"),
                    ("E6", "Telecharger\nmon PDF"),
                ],
            },
            {
                "id": "H3", "label": "Demander\nun conge", "actor": "EMP",
                "extends": [
                    ("E7", "Soumettre demande\n(dates + motif)"),
                    ("E8", "Suivre statut\nde ma demande"),
                ],
            },
            {
                "id": "H4", "label": "Traiter demandes\nconges", "actor": "CP",
                "extends": [
                    ("E9", "Consulter file\nen attente"),
                    ("E10", "Approuver demande"),
                    ("E11", "Refuser demande\n(motif)"),
                ],
            },
            {
                "id": "H5", "label": "Consulter\npilotage", "actor": "USER",
                "extends": [
                    ("E12", "Dashboard adapte\nau role"),
                    ("E13", "KPI & graphiques\ndynamiques"),
                    ("E14", "Filtrer par periode"),
                    ("E15", "Exporter statistiques\n(image / PDF)"),
                    ("E16", "Centre de\nnotifications"),
                ],
            },
            {
                "id": "H6", "label": "Gerer rapports\nd'imagerie", "actor": "RAD",
                "extends": [
                    ("E17", "Rediger rapport\n(brouillon)"),
                    ("E18", "Valider rapport\n(notifier medecin)"),
                    ("E19", "Exporter rapport\nPDF"),
                ],
            },
        ],
    },
]

CAS_UTILISATION_DIAGRAMS = [
    {
        "file": "cu_sprint6_planning_conges_dashboard",
        "cas_id": "cas_utilisation_sprint6_planning_conges_dashboard",
        "legacy_cas_id": "cas_utilisation_sprint6_dashboard",
        "title": "Sprint 6 - Planning, conges, Dashboard & reporting",
        "actors": [
            ("CP", "Chef personnel"), ("INF", "Infirmier"), ("EMP", "Employe"),
            ("USER", "Utilisateur"), ("AC", "Admin clinique"), ("RAD", "Radiologue"),
        ],
        "packages": [
            {"name": "Planning infirmiers", "usecases": [
                ("P1", "Creer planning hebdo/mensuel"), ("P2", "Affecter gardes & creneaux"),
                ("P3", "Valider planning"), ("P4", "Consulter mon planning"), ("P5", "Exporter PDF planning"),
            ]},
            {"name": "Conges & absences", "usecases": [
                ("C1", "Demander un conge"), ("C2", "Approuver / refuser demande"),
                ("C3", "Consulter demandes en attente"),
            ]},
            {"name": "Dashboard & pilotage", "usecases": [
                ("D1", "Dashboard par role"), ("D2", "KPI & graphiques"), ("D3", "Filtres periode"),
                ("D4", "Notifications"), ("D5", "Exporter statistiques (PDF)"),
            ]},
            {"name": "Rapports imagerie (reporting)", "usecases": [
                ("R1", "Rediger rapport (brouillon)"), ("R2", "Valider rapport imagerie"),
                ("R3", "Exporter rapport PDF"),
            ]},
        ],
        "assoc": [
            ("CP", "P1"), ("CP", "P2"), ("CP", "P3"), ("CP", "P5"),
            ("INF", "P4"), ("INF", "P5"),
            ("EMP", "C1"), ("CP", "C2"), ("CP", "C3"),
            ("USER", "D1"), ("USER", "D2"), ("USER", "D3"), ("USER", "D4"), ("AC", "D2"), ("USER", "D5"),
            ("RAD", "R1"), ("RAD", "R2"), ("RAD", "R3"),
        ],
        "deps": [
            ("P3", "C3", "<<extend>> verifier conflits conges"),
            ("D2", "D5", "<<extend>>"),
            ("P1", "P2", "<<include>>"),
            ("C1", "C2", "<<extend>>"),
        ],
    },
]


def crud_extends(prefix, entity):
    """5 cas CRUD standard pour un hub Gerer X."""
    return [
        (f"{prefix}C", f"Creer {entity}"),
        (f"{prefix}RL", f"Consulter liste\n{entity}"),
        (f"{prefix}RD", f"Consulter detail\n{entity}"),
        (f"{prefix}U", f"Modifier {entity}"),
        (f"{prefix}D", f"Supprimer {entity}"),
    ]


CRUD_DIAGRAMS = [
    {
        "file": "cu_crud_clinique", "title": "CRUD Clinique",
        "boundary": "CRUD - Gestion des cliniques", "width": 900, "height": 420,
        "actors": [("SA", "Super\nadministrateur", 160)],
        "hubs": [{"id": "H1", "label": "Gerer\ncliniques", "actor": "SA",
                  "extends": crud_extends("CL", "une clinique")}],
    },
    {
        "file": "cu_crud_service", "title": "CRUD Service medical",
        "boundary": "CRUD - Services medicaux", "width": 900, "height": 420,
        "actors": [("AC", "Administrateur\nclinique", 160)],
        "hubs": [{"id": "H1", "label": "Gerer services\nmedicaux", "actor": "AC",
                  "extends": crud_extends("SV", "un service")}],
    },
    {
        "file": "cu_crud_personnel", "title": "CRUD Personnel",
        "boundary": "CRUD - Gestion du personnel", "width": 900, "height": 420,
        "actors": [("AC", "Administrateur\nclinique", 160)],
        "hubs": [{"id": "H1", "label": "Gerer\npersonnel", "actor": "AC",
                  "extends": crud_extends("PE", "un compte personnel")}],
    },
    {
        "file": "cu_crud_patient", "title": "CRUD Patient",
        "boundary": "CRUD - Gestion des patients", "width": 900, "height": 420,
        "actors": [("SEC", "Secretaire", 160)],
        "hubs": [{"id": "H1", "label": "Gerer\npatients", "actor": "SEC",
                  "extends": crud_extends("PA", "un patient")}],
    },
    {
        "file": "cu_crud_chambre", "title": "CRUD Chambre",
        "boundary": "CRUD - Gestion des chambres", "width": 900, "height": 420,
        "actors": [("AC", "Administrateur\nclinique", 160)],
        "hubs": [{"id": "H1", "label": "Gerer\nchambres", "actor": "AC",
                  "extends": crud_extends("CH", "une chambre")}],
    },
    {
        "file": "cu_crud_equipement", "title": "CRUD Equipement",
        "boundary": "CRUD - Gestion des equipements", "width": 900, "height": 420,
        "actors": [("AC", "Administrateur\nclinique", 160)],
        "hubs": [{"id": "H1", "label": "Gerer\nequipements", "actor": "AC",
                  "extends": crud_extends("EQ", "un equipement")}],
    },
    {
        "file": "cu_crud_medicament", "title": "CRUD Medicament",
        "boundary": "CRUD - Catalogue medicaments", "width": 900, "height": 420,
        "actors": [("PHA", "Pharmacien", 160)],
        "hubs": [{"id": "H1", "label": "Gerer\nmedicaments", "actor": "PHA",
                  "extends": crud_extends("ME", "un medicament")}],
    },
    {
        "file": "cu_crud_offre", "title": "CRUD Offre abonnement",
        "boundary": "CRUD - Offres d'abonnement", "width": 900, "height": 420,
        "actors": [("SA", "Super\nadministrateur", 160)],
        "hubs": [{"id": "H1", "label": "Gerer offres\nd'abonnement", "actor": "SA",
                  "extends": crud_extends("OF", "une offre") + [("OFS", "Synchroniser\navec Stripe")]}],
    },
    {
        "file": "cu_crud_rdv", "title": "CRUD Rendez-vous",
        "boundary": "CRUD - Rendez-vous", "width": 900, "height": 420,
        "actors": [("SEC", "Secretaire", 160)],
        "hubs": [{"id": "H1", "label": "Gerer\nrendez-vous", "actor": "SEC",
                  "extends": crud_extends("RD", "un rendez-vous")}],
    },
    {
        "file": "cu_crud_consultation", "title": "CRUD Consultation",
        "boundary": "CRUD - Consultations", "width": 900, "height": 420,
        "actors": [("MED", "Medecin", 160)],
        "hubs": [{"id": "H1", "label": "Gerer\nconsultations", "actor": "MED",
                  "extends": crud_extends("CO", "une consultation")}],
    },
    {
        "file": "cu_crud_ordonnance", "title": "CRUD Ordonnance",
        "boundary": "CRUD - Ordonnances", "width": 900, "height": 420,
        "actors": [("MED", "Medecin", 160)],
        "hubs": [{"id": "H1", "label": "Gerer\nordonnances", "actor": "MED",
                  "extends": crud_extends("OR", "une ordonnance")}],
    },
    {
        "file": "cu_crud_demande_med", "title": "CRUD Demande medicament",
        "boundary": "CRUD - Demandes medicament", "width": 900, "height": 420,
        "actors": [("MED", "Medecin", 100), ("PHA", "Pharmacien", 280)],
        "hubs": [
            {"id": "H1", "label": "Gerer demandes\n(medecin)", "actor": "MED",
             "extends": [("DMC", "Creer demande"), ("DML", "Consulter mes demandes")]},
            {"id": "H2", "label": "Traiter demandes\n(pharmacien)", "actor": "PHA",
             "extends": [("DMT", "Consulter file"), ("DMV", "Valider / refuser")]},
        ],
    },
    {
        "file": "cu_crud_prestation", "title": "CRUD Prestation facturation",
        "boundary": "CRUD - Prestations CNAM", "width": 900, "height": 420,
        "actors": [("AC", "Administrateur\nclinique", 160)],
        "hubs": [{"id": "H1", "label": "Gerer\nprestations", "actor": "AC",
                  "extends": crud_extends("PR", "une prestation")}],
    },
    {
        "file": "cu_crud_demande_op", "title": "CRUD Demande operation",
        "boundary": "CRUD - Demandes d'operation", "width": 900, "height": 480,
        "actors": [("MED", "Medecin", 100), ("AC", "Admin clinique", 280)],
        "hubs": [
            {"id": "H1", "label": "Gerer demandes\n(medecin)", "actor": "MED",
             "extends": crud_extends("OP", "une demande")},
            {"id": "H2", "label": "Traiter demandes\n(admin)", "actor": "AC",
             "extends": [("OTA", "Approuver"), ("OTR", "Refuser"), ("OTP", "Planifier"), ("OTE", "Effectuer")]},
        ],
    },
]


def main():
    out = os.path.dirname(os.path.abspath(__file__))
    count = 0
    for d in SIMPLE_DIAGRAMS:
        path = os.path.join(out, d["file"] + "_simple.drawio")
        with open(path, "w", encoding="utf-8") as f:
            f.write(build_simple(d))
        print("Simple :", path)
        count += 1
    for d in DETAILED_DIAGRAMS:
        path = os.path.join(out, d["file"] + "_detail.drawio")
        with open(path, "w", encoding="utf-8") as f:
            f.write(build_detailed(d))
        print("Detail :", path)
        count += 1
    for d in CRUD_DIAGRAMS:
        path = os.path.join(out, d["file"] + "_crud.drawio")
        with open(path, "w", encoding="utf-8") as f:
            f.write(build_detailed(d))
        print("CRUD   :", path)
        count += 1
    for d in CAS_UTILISATION_DIAGRAMS:
        content = build_cas_utilisation(d)
        path = os.path.join(out, d["cas_id"] + ".drawio")
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Cas CU :", path)
        count += 1
        legacy = d.get("legacy_cas_id")
        if legacy:
            legacy_path = os.path.join(out, legacy + ".drawio")
            with open(legacy_path, "w", encoding="utf-8") as f:
                f.write(build_cas_utilisation(d, diagram_id=legacy))
            print("Cas CU :", legacy_path, "(legacy)")
            count += 1
    print(f"\nTotal : {count} fichiers draw.io generes dans {out}")


if __name__ == "__main__":
    main()
