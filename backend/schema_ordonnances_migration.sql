-- Migration : ajout des colonnes pour ordonnances (médecin, patient directs, numéro).
-- Exécuter si votre base a déjà la table ordonnances sans ces colonnes.

ALTER TABLE ordonnances ADD COLUMN IF NOT EXISTS patient_id VARCHAR(36);
ALTER TABLE ordonnances ADD COLUMN IF NOT EXISTS medecin_id VARCHAR(36);
ALTER TABLE ordonnances ADD COLUMN IF NOT EXISTS numero_ordonnance VARCHAR(50);

ALTER TABLE ordonnances DROP CONSTRAINT IF EXISTS fk_ordonnances_patient;
ALTER TABLE ordonnances DROP CONSTRAINT IF EXISTS fk_ordonnances_medecin;
ALTER TABLE ordonnances ADD CONSTRAINT fk_ordonnances_patient
  FOREIGN KEY (patient_id) REFERENCES patients(id);
ALTER TABLE ordonnances ADD CONSTRAINT fk_ordonnances_medecin
  FOREIGN KEY (medecin_id) REFERENCES medecins(id);
