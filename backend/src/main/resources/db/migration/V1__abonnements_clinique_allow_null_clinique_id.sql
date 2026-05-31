-- Permet les abonnements "cabinet" (médecin) dans la table abonnements_clinique:
-- clinique_id doit être nullable quand medecin_cabinet_id est renseigné.
--
-- PostgreSQL
ALTER TABLE abonnements_clinique
  ALTER COLUMN clinique_id DROP NOT NULL;

