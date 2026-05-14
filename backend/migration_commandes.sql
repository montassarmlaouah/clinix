-- Migration pour ajouter la colonne nom_produit à commandes_fournisseur
-- Exécuter ce script si la migration automatique échoue

-- Supprimer les données existantes avec NULL (optionnel)
-- DELETE FROM commandes_fournisseur WHERE id IS NOT NULL;

-- Ou mettre à jour les données existantes avec une valeur par défaut
UPDATE commandes_fournisseur SET nom_produit = 'Produit non spécifié' WHERE nom_produit IS NULL;

-- Rendre la colonne NOT NULL après migration des données
ALTER TABLE commandes_fournisseur ALTER COLUMN nom_produit SET NOT NULL;
