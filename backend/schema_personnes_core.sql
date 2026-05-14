-- Schéma logique simplifié (PostgreSQL)
-- Domaine : utilisateurs, rôles, patients, médecins, infirmiers, pharmaciens, radiologues,
-- dossier médical, consultations et ordonnances.
-- Objectif : comprendre les relations pour les diagrammes de classes / modèle mobile.

-- =====================================================================
-- TABLES DE SÉCURITÉ (ROLES / PERMISSIONS)
-- =====================================================================

CREATE TABLE roles (
    id              VARCHAR(36) PRIMARY KEY,
    nom             VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT
);

CREATE TABLE permissions (
    id              VARCHAR(36) PRIMARY KEY,
    module          VARCHAR(100) NOT NULL,
    action          VARCHAR(100) NOT NULL,
    description     TEXT
);

CREATE TABLE role_permissions (
    role_id         VARCHAR(36) NOT NULL,
    permission_id   VARCHAR(36) NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

-- =====================================================================
-- CLINIQUE / SERVICE
-- =====================================================================

CREATE TABLE cliniques (
    id              VARCHAR(36) PRIMARY KEY,
    nom             VARCHAR(255) NOT NULL,
    adresse         VARCHAR(255) NOT NULL,
    telephone       VARCHAR(50),
    actif           BOOLEAN NOT NULL,
    date_creation   TIMESTAMP NOT NULL
);

CREATE TABLE services (
    id                  VARCHAR(36) PRIMARY KEY,
    nom                 VARCHAR(255) NOT NULL,
    description         TEXT NOT NULL,
    actif               BOOLEAN NOT NULL,
    date_creation       TIMESTAMP NOT NULL,
    nombre_chambres     INTEGER NOT NULL,
    nombre_lits         INTEGER NOT NULL,
    clinique_id         VARCHAR(36) NOT NULL,
    CONSTRAINT fk_services_clinique
        FOREIGN KEY (clinique_id) REFERENCES cliniques(id)
);

-- =====================================================================
-- UTILISATEUR GÉNÉRIQUE (classe abstraite User)
-- + héritage JOINED : une ligne dans users + 1 ligne dans la table fille
-- =====================================================================

CREATE TABLE users (
    id              VARCHAR(36) PRIMARY KEY,
    nom             VARCHAR(255),
    prenom          VARCHAR(255),
    telephone       VARCHAR(50) NOT NULL UNIQUE,
    mot_de_passe    VARCHAR(255),
    date_creation   TIMESTAMP NOT NULL,
    actif           BOOLEAN NOT NULL,
    clinique_id     VARCHAR(36),
    service_id      VARCHAR(36),
    CONSTRAINT fk_users_clinique
        FOREIGN KEY (clinique_id) REFERENCES cliniques(id),
    CONSTRAINT fk_users_service
        FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE TABLE user_roles (
    user_id     VARCHAR(36) NOT NULL,
    role_id     VARCHAR(36) NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- =====================================================================
-- PERSONNES SPÉCIALISÉES (héritent de User)
-- =====================================================================

CREATE TABLE patients (
    id                  VARCHAR(36) PRIMARY KEY,
    numero_patient      VARCHAR(100) NOT NULL UNIQUE,
    date_naissance      DATE NOT NULL,
    sexe                VARCHAR(10),
    groupe_sanguin      VARCHAR(20),
    adresse             VARCHAR(255),
    type_admission      VARCHAR(20),
    CONSTRAINT fk_patients_user
        FOREIGN KEY (id) REFERENCES users(id)
);

CREATE TABLE medecins (
    id                  VARCHAR(36) PRIMARY KEY,
    specialite          VARCHAR(255),
    numero_ordre        VARCHAR(100) UNIQUE,
    CONSTRAINT fk_medecins_user
        FOREIGN KEY (id) REFERENCES users(id)
);

CREATE TABLE infirmiers (
    id                  VARCHAR(36) PRIMARY KEY,
    numero_ordre        VARCHAR(100) UNIQUE,
    CONSTRAINT fk_infirmiers_user
        FOREIGN KEY (id) REFERENCES users(id)
);

CREATE TABLE pharmaciens (
    id                  VARCHAR(36) PRIMARY KEY,
    numero_ordre        VARCHAR(100) UNIQUE,
    CONSTRAINT fk_pharmaciens_user
        FOREIGN KEY (id) REFERENCES users(id)
);

CREATE TABLE radiologues (
    id                  VARCHAR(36) PRIMARY KEY,
    numero_ordre        VARCHAR(100) UNIQUE,
    CONSTRAINT fk_radiologues_user
        FOREIGN KEY (id) REFERENCES users(id)
);

-- =====================================================================
-- DOSSIER MÉDICAL
-- =====================================================================

CREATE TABLE dossiers_medicaux (
    id              VARCHAR(36) PRIMARY KEY,
    date_creation   TIMESTAMP NOT NULL,
    antecedents     TEXT,
    patient_id      VARCHAR(36) NOT NULL UNIQUE,
    CONSTRAINT fk_dossiers_patient
        FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Collection "allergies" liée à un dossier médical
CREATE TABLE allergies (
    dossier_id      VARCHAR(36) NOT NULL,
    allergie        VARCHAR(255) NOT NULL,
    PRIMARY KEY (dossier_id, allergie),
    CONSTRAINT fk_allergies_dossier
        FOREIGN KEY (dossier_id) REFERENCES dossiers_medicaux(id)
);

-- =====================================================================
-- CONSULTATIONS
-- =====================================================================

CREATE TABLE consultations (
    id                      VARCHAR(36) PRIMARY KEY,
    date                    TIMESTAMP NOT NULL,
    motif                   VARCHAR(255) NOT NULL,
    diagnostic              TEXT,
    observations            TEXT,
    patient_id              VARCHAR(36) NOT NULL,
    medecin_id              VARCHAR(36) NOT NULL,
    dossier_medical_id      VARCHAR(36),
    CONSTRAINT fk_consultations_patient
        FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_consultations_medecin
        FOREIGN KEY (medecin_id) REFERENCES medecins(id),
    CONSTRAINT fk_consultations_dossier
        FOREIGN KEY (dossier_medical_id) REFERENCES dossiers_medicaux(id)
);

-- =====================================================================
-- ORDONNANCES
-- =====================================================================

CREATE TABLE ordonnances (
    id                          VARCHAR(36) PRIMARY KEY,
    date                        DATE NOT NULL,
    signee                      BOOLEAN NOT NULL,
    consultation_id             VARCHAR(36),
    patient_id                  VARCHAR(36),
    medecin_id                  VARCHAR(36),
    pharmacien_validateur_id    VARCHAR(36),
    validee                     BOOLEAN NOT NULL,
    numero_ordonnance           VARCHAR(50),
    CONSTRAINT fk_ordonnances_consultation
        FOREIGN KEY (consultation_id) REFERENCES consultations(id),
    CONSTRAINT fk_ordonnances_patient
        FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_ordonnances_medecin
        FOREIGN KEY (medecin_id) REFERENCES medecins(id),
    CONSTRAINT fk_ordonnances_pharmacien
        FOREIGN KEY (pharmacien_validateur_id) REFERENCES pharmaciens(id)
);

-- =====================================================================
-- REMARQUES
-- =====================================================================
-- 1) Tous les identifiants générés en Java par @GeneratedValue(strategy = GenerationType.UUID)
--    sont modélisés ici en VARCHAR(36) pour simplifier.
-- 2) Ce script est un schéma "logique" pour la compréhension et peut
--    être ajusté avant exécution réelle dans PostgreSQL.

