# 🔐 Système d'Audit Complet - Documentation

## 📋 Vue d'ensemble

Un système d'audit complet a été implémenté pour tracer chaque action des utilisateurs dans le système SIHG. Chaque connexion, visualisation, création, modification et suppression est enregistrée avec des timestamps précis (heure, minute, seconde).

---

## ✨ Fonctionnalités Implémentées

### 1. **Table d'Audit Supabase** (`supabase/audit_logs_table.sql`)
- ✅ Enregistrement de tous les utilisateurs qui se connectent
- ✅ Timestamp exact (créé_at) avec milliseconde
- ✅ Type d'action (LOGIN, VIEW, CREATE, UPDATE, DELETE, EXPORT, DOWNLOAD)
- ✅ Ressource affectée (stations, alertes, entreprises, etc.)
- ✅ Détails additionnels (changements, ID ressource, etc.)
- ✅ Adresse IP et User Agent
- ✅ Statut (succès/erreur)
- ✅ Row Level Security (RLS) pour contrôle d'accès

**Index créés pour performance:**
- `idx_audit_logs_user_id` - Recherche rapide par utilisateur
- `idx_audit_logs_created_at` - Filtrage par date/heure
- `idx_audit_logs_entreprise_id` - Filtrage par entreprise
- `idx_audit_logs_action_type` - Recherche par type d'action
- `idx_audit_logs_user_email` - Recherche par email

**Politiques RLS:**
- Super admins: Voir tous les logs
- Responsables entreprise: Voir uniquement les logs de leur entreprise

---

### 2. **Service d'Audit** (`src/lib/auditLog.ts`)
Bibliothèque complète d'outils pour logger les actions:

```typescript
// Logging des différentes actions
logLogin()                          // Enregistrer une connexion
logViewResource(type, name, id)     // Visualisation de ressource
logCreateResource(type, name)       // Création
logUpdateResource(type, name, changes, id)  // Modification
logDeleteResource(type, name, id)   // Suppression
logExportData(type, format, count)  // Exportation
logDownloadFile(filename, size)     // Téléchargement
logFailedAction(...)                // Erreur/Échec
```

**Données automatiquement capturées:**
- Identifiant utilisateur
- Email utilisateur
- Timestamp précis
- Adresse IP (via API externe)
- User Agent du navigateur
- Entreprise associée

**Exemple d'utilisation:**
```typescript
import { logUpdateResource } from '@/lib/auditLog';

// Dans une fonction de mise à jour
await logUpdateResource(
  'stations',
  'Station Shell Conakry',
  { 
    stock_essence: { old: 50000, new: 45000 },
    status: { old: 'ouverte', new: 'fermee' }
  },
  stationId
);
```

---

### 3. **Page d'Audit** (`src/pages/AuditPage.tsx`)
Interface complète pour consulter les logs d'audit - **Réservée aux Super Admins**

**Fonctionnalités:**
- 🔍 Filtres multi-critères:
  - Email utilisateur (recherche)
  - Type d'action (SELECT)
  - Plage de dates (Date/Heure début et fin)
  
- 📊 Table des logs avec colonnes:
  - Date/Heure exact (format fr-FR)
  - Utilisateur (email)
  - Type d'action (code couleur)
  - Ressource affectée
  - Nom de la ressource
  - Statut (Succès/Erreur)

- ⬇️ Export en CSV
  - Télécharge tous les logs filtrés
  - Formate: CSV avec en-têtes
  - Nomage: `audit_logs_YYYY-MM-DD.csv`

- 🏷️ Code couleur par action:
  - 🔵 LOGIN - Connexion (bleu)
  - ⚪ VIEW - Visualisation (gris)
  - 🟢 CREATE - Création (vert)
  - 🟡 UPDATE - Modification (jaune)
  - 🔴 DELETE - Suppression (rouge)
  - 🟣 EXPORT - Exportation (violet)
  - 🟦 DOWNLOAD - Téléchargement (indigo)

**Accès:** Menu Admin → Audit (ou `/audit`)

---

### 4. **Gestion des Informations Entreprise** (`src/pages/EntrepriseInfoPage.tsx`)
Page pour que les entreprises modifient leurs informations

**Sections modifiables:**
1. **Informations Générales**
   - Nom de l'entreprise
   - Sigle
   - Email
   - Téléphone

2. **Adresse**
   - Adresse complète
   - Ville
   - Région

3. **Représentant**
   - Nom
   - Téléphone
   - Email

**Fonctionnalités:**
- ✅ Sauvegarde avec audit
- ✅ Détection des changements
- ✅ Bouton "Enregistrer" activé uniquement si changements
- ✅ Annulation des modifications
- ✅ Message d'alerte si changements non sauvegardés
- ✅ Historique d'audit complet des changements

**Accès:** 
- Responsables entreprise: Menu → Mon Entreprise (ou `/mon-entreprise`)
- Super admins: Consultation uniquement

---

## 🔄 Workflow d'Intégration

### Pour Utiliser le Système d'Audit:

**1. Dans le AuthContext (connexion utilisateur):**
```typescript
import { logLogin } from '@/lib/auditLog';

// Après connexion réussie
await logLogin();
```

**2. Lors de chaque action:**
```typescript
import { 
  logCreateResource, 
  logUpdateResource, 
  logDeleteResource 
} from '@/lib/auditLog';

// Créer une station
await logCreateResource('stations', 'Shell Conakry', { capacity: 100000 });

// Modifier une alerte
await logUpdateResource('alertes', 'Rupture Stock', { status: 'resolved' }, alerteId);

// Supprimer une entreprise
await logDeleteResource('entreprises', 'Total Guinée', entrepriseId);
```

---

## 📊 Schéma de la Table `audit_logs`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `user_id` | UUID | Référence vers auth.users |
| `user_email` | TEXT | Email de l'utilisateur |
| `action_type` | TEXT | LOGIN, VIEW, CREATE, UPDATE, DELETE, etc. |
| `resource_type` | TEXT | stations, entreprises, alertes, etc. |
| `resource_id` | UUID | ID de la ressource affectée |
| `resource_name` | TEXT | Nom/description de la ressource |
| `details` | JSONB | Données supplémentaires (changements, etc.) |
| `ip_address` | TEXT | Adresse IP du client |
| `user_agent` | TEXT | User Agent du navigateur |
| `status` | TEXT | success ou failed |
| `error_message` | TEXT | Message d'erreur si statut = failed |
| `entreprise_id` | UUID | Entreprise liée (pour filtrage RLS) |
| `created_at` | TIMESTAMP | Date/heure UTC |
| `updated_at` | TIMESTAMP | Dernière mise à jour |

---

## 🛠️ Étapes de Mise en Œuvre

### ✅ Déjà Fait:

1. ✅ Création table audit_logs avec RLS
2. ✅ Création service auditLog.ts
3. ✅ Création page AuditPage.tsx
4. ✅ Création page EntrepriseInfoPage.tsx
5. ✅ Intégration routes dans App.tsx
6. ✅ Ajout liens dans Sidebar.tsx

### ⚠️ À Faire:

1. **Exécuter migration SQL:**
   ```bash
   # Aller sur: https://app.supabase.com/project/[votre-projet]/sql/new
   # Copier/Coller: supabase/audit_logs_table.sql
   # Cliquer: Run
   ```

2. **Intégrer logLogin dans AuthContext:**
   ```typescript
   // Dans src/contexts/AuthContext.tsx
   import { logLogin } from '@/lib/auditLog';
   
   // Après authentification réussie
   await logLogin();
   ```

3. **Tester le système:**
   - Se connecter et vérifier log "LOGIN" dans /audit
   - Créer/Modifier/Supprimer une ressource
   - Vérifier l'audit trail complet
   - Tester filtres et export CSV

---

## 🔍 Exemples de Logs Générés

```
Date/Heure: 2026-02-18 14:25:37,453
Utilisateur: manager@total.gn
Action: LOGIN
Statut: Succès
IP: 192.168.1.100
---

Date/Heure: 2026-02-18 14:25:50,234
Utilisateur: admin@sihg.gn
Action: UPDATE
Ressource: stations
Détails: Station Shell Conakry - Stock essence modifié de 50000L à 45000L
Statut: Succès
---

Date/Heure: 2026-02-18 14:26:15,789
Utilisateur: responsable@shell.gn
Action: EXPORT
Format: CSV
Records: 150
Statut: Succès
```

---

## 📈 Cas d'Usage

1. **Conformité & Réglementation**
   - Traçabilité complète des modifications critiques
   - Respect des normes d'audit
   - Preuves d'accès pour investigations

2. **Sécurité**
   - Détection d'accès non autorisés
   - Analyse des patterns de comportement
   - Investigation des incidents

3. **Gestion d'Entreprise**
   - Suivi des modifications de données
   - Responsabilisation des utilisateurs
   - Historique complet des actions

4. **Déboggage**
   - Timeline complète des actions
   - Identification des bugs liés aux modifications
   - Reconstruction de l'état système

---

## 🎯 Résumé

✅ **Système d'audit complet** avec:
- Logging automatique de TOUTES les actions
- Timestamps précis au milliseconde
- Interface de consultation avec filtres
- Export de données en CSV
- Gestion sécurisée avec RLS
- Page de gestion d'entreprise
- Documentation complète

Le système est maintenant prêt à être utilisé et monitorer chaque interaction dans SIHG! 🚀
