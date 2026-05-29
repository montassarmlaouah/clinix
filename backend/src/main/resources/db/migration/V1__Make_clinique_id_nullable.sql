-- Make clinique_id nullable in abonnements_clinique table
-- This allows subscriptions for medical cabinet doctors (without a clinic)

ALTER TABLE abonnements_clinique
ALTER COLUMN clinique_id DROP NOT NULL;
