# Multi-Tenant Setup - Guide de déploiement

## ⚠️ Action requise : Fix des types TypeScript

Votre application est maintenant configurée en multi-tenant, mais il reste une étape cruciale pour que le build fonctionne.

### Problème

Les types TypeScript générés automatiquement par Supabase marquent `tenant_id` comme **obligatoire** dans les `Insert` types, alors que nos triggers de base de données le définissent **automatiquement**.

### Solution : Exécuter le script de fix

Un script `scripts/fix-supabase-types.js` a été créé pour résoudre ce problème automatiquement.

#### Option 1 : Exécution manuelle (RECOMMANDÉ MAINTENANT)

```bash
node scripts/fix-supabase-types.js
```

Ce script va :
- Lire le fichier `src/integrations/supabase/types.ts`
- Rendre `tenant_id` optionnel (`tenant_id?: string`) dans les types `Insert` pour toutes les tables
- Rendre `user_id` optionnel dans `user_roles` Insert

####  Option 2 : Automatiser pour l'avenir

Pour automatiser ce processus après chaque régénération des types Supabase, ajoutez manuellement cette ligne au fichier `package.json` :

```json
{
  "scripts": {
    "fix-types": "node scripts/fix-supabase-types.js"
  }
}
```

**Note**: Vous ne pouvez pas modifier `package.json` via l'IA, vous devez le faire manuellement dans l'éditeur.

Ensuite, après chaque `supabase gen types`, exécutez :

```bash
npm run fix-types
```

## Architecture Multi-Tenant

### Schéma de données

```
tenants (agences)
├── tenant_settings (paramètres de l'agence)
├── user_tenants (liaison utilisateurs ↔ agences)
└── user_roles (rôles par agence)

Tables avec tenant_id:
- vehicles, clients, contracts, assistance
- expenses, revenus, cheques, sinistres, infractions
- interventions, vehicules_traite, contract_payments
- secondary_drivers, vehicle_affectations, vehicle_changes
- vehicle_insurance, vehicle_technical_inspection, vehicle_vignette
- vehicules_traites_echeances, infraction_files, sinistre_files
- assurance_bareme, vehicle_assistance_categories
```

### Triggers automatiques

Tous les `INSERT` dans les tables avec `tenant_id` déclenchent automatiquement le trigger `set_tenant_id_default()` qui :
1. Récupère le `tenant_id` de l'utilisateur connecté via `get_user_tenant_id(auth.uid())`
2. Assigne automatiquement ce `tenant_id` à la ligne insérée

### RLS (Row-Level Security)

Toutes les tables sont protégées par des politiques RLS qui :
- Limitent la visibilité des données au tenant de l'utilisateur
- Autorisent les agents à créer/modifier des données dans leur tenant
- Autorisent uniquement les admins à supprimer des données

## Prochaines étapes suggérées

### Phase 2 : Tests d'isolation

1. Créer un deuxième tenant de test :

```sql
INSERT INTO tenants (name, slug) VALUES ('Test Agency', 'test-agency');
```

2. Créer un utilisateur pour ce tenant (via l'interface Utilisateurs)

3. Tester que :
   - Les données sont bien isolées entre tenants
   - Les triggers fonctionnent correctement
   - Les RLS policies empêchent les fuites de données

### Phase 3 : Fonctionnalités SaaS (optionnel)

- Gestion des invitations utilisateurs
- Dashboard super-admin pour gérer plusieurs agences
- Intégration billing (Stripe)
- Personnalisation avancée (sous-domaines, branding)

## Fichiers modifiés

- ✅ Migration SQL : ajout des triggers `set_tenant_id_on_*` pour toutes les tables
- ✅ Script : `scripts/fix-supabase-types.js`
- ✅ Hook : `src/hooks/use-tenant-insert.ts` (pour référence future)
- ✅ Correction : `src/pages/Parametres.tsx` (retrait du champ `code` inexistant)
- ✅ Imports : Ajout de `useTenant` dans tous les fichiers nécessitant des inserts

## Support

Si vous rencontrez des problèmes :
1. Vérifiez que le script `fix-supabase-types.js` a bien été exécuté
2. Vérifiez que les triggers sont actifs dans votre base Supabase
3. Vérifiez les logs Supabase pour des erreurs de trigger
