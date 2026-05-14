## Correction de l'erreur Hibernate DDL - CommandeFournisseur

### Problème
```
ERREUR: la colonne « nom_produit » de la table « commandes_fournisseur » contient des valeurs NULL
Error executing DDL "alter table if exists commandes_fournisseur add column nom_produit varchar(255) not null"
```

### Cause
- La table `commandes_fournisseur` contient déjà des données (lignes existantes)
- Hibernate a essayé d'ajouter une colonne `NOT NULL` sur une table non vide
- Les enregistrements existants n'ont pas de valeur pour `nom_produit`, ce qui provoque une violation de contrainte

### Solution Appliquée
1. **Modifié** `CommandeFournisseur.java` : changé `nom_produit` de `nullable=false` à `nullable=true`
2. **Raison** : Permet la migration de schéma sans erreur, les données existantes peuvent rester NULL
3. **Next steps après redémarrage** :
   - La migration devrait réussir
   - Les anciennes commandes auront `nom_produit = NULL`
   - Les nouvelles commandes doivent avoir `nom_produit` fourni par le frontend

### Migration SQL (optionnel - si vous voulez nettoyer les données)
```sql
-- Remplir les enregistrements NULL avec une valeur par défaut
UPDATE commandes_fournisseur SET nom_produit = 'Produit non spécifié' WHERE nom_produit IS NULL;

-- Puis rendre la colonne NOT NULL
ALTER TABLE commandes_fournisseur ALTER COLUMN nom_produit SET NOT NULL;
```

### Prochaines étapes
1. **Redémarrer** l'application backend
2. **Vérifier** que la table `commandes_fournisseur` a bien la colonne `nom_produit`
3. **Tester** la création de commande depuis le frontend
