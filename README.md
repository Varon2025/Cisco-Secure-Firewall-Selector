
# Cisco Secure Firewall Selector

Outil web interactif pour sélectionner et comparer les firewalls Cisco Secure Firewall, basé sur votre Excel **Calculette Firewall V2 unprotected.xlsx**.

## 🚀 Deux modes de déploiement

### Mode 1: Site statique (GitHub Pages)
Version simple sans base de données, utilisant un fichier JSON local.

### Mode 2: Application avec PostgreSQL (Recommandé)
Version complète avec backend Node.js et base de données PostgreSQL pour une meilleure scalabilité et gestion des données.

📖 **[Guide complet de configuration PostgreSQL](DATABASE_SETUP.md)**

## Structure du projet
```
/
├─ index.html                 # Page principale
├─ css/styles.css            # Styles
├─ js/app.js                 # Frontend JavaScript
├─ data/firewalls.json       # Données source
├─ server.js                 # Serveur Express (PostgreSQL)
├─ config/db.js              # Configuration PostgreSQL
├─ database/schema.sql       # Schéma de la base de données
├─ scripts/init-db.js        # Script d'initialisation
└─ DATABASE_SETUP.md         # Guide de configuration
```

## 📦 Installation et Déploiement

### Option 1: Déploiement statique (GitHub Pages)
1. Créez un repo GitHub (public).
2. Uploadez les fichiers à la racine du repo.
3. Dans **Settings → Pages**, sélectionnez **Deploy from a branch** sur la branche `main` et le dossier `/root`.
4. Le site sera accessible à l'URL GitHub Pages fournie par GitHub.

### Option 2: Déploiement avec PostgreSQL

#### Installation rapide:
```bash
# 1. Cloner le projet
git clone https://github.com/votre-username/Cisco-Secure-Firewall-Selector.git
cd Cisco-Secure-Firewall-Selector

# 2. Installer les dépendances
npm install

# 3. Configurer PostgreSQL (voir DATABASE_SETUP.md)
cp .env.example .env
# Éditez .env avec vos paramètres PostgreSQL

# 4. Initialiser la base de données
npm run init-db

# 5. Démarrer le serveur
npm start
```

Le serveur démarre sur `http://localhost:3000`

📖 **Pour un guide détaillé, consultez [DATABASE_SETUP.md](DATABASE_SETUP.md)**

## Fonctionnalités
- AUCUN filtre actif par défaut : l’utilisateur choisit ses filtres manuellement.
- Filtres par recherche, série, form factor et débits (FW/Threat/IPS).
- Tableau de résultats dynamique (compte de résultats, export CSV).
- **Comparateur A/B** : deux panneaux indépendants, même fonctionnement que votre "Calculette Firewall" :
  - Choisir un **modèle** (autocomplete)
  - Choisir une **durée** (1 / 3 / 5 ans) — détectée depuis l’Excel
  - Inclure **T (IPS)**, **AMP**, **URL** : si un SKU combiné (TM/TC/TMC) existe dans l’Excel, il est utilisé; sinon, la somme T+AMP+URL est calculée.
  - Option **Inclure SSSNT (12 mois)**
  - Affichage du **GPL** et calcul du **NET** avec remises paramétrables (HW/SW/SSSNT). Par défaut 0.6/0.6/0.6.

## Données & limitations
- `data/firewalls.json` est généré à partir de l'onglet **champs** (modèles, performances, racines de licences) et de l'onglet **Price Estimate** (GPL, délais). 
- Si un SKU spécifique n’existe pas dans l’onglet **Price Estimate**, l’outil :
  - Essaie un SKU combiné (ex: TMC) si présent,
  - Sinon additionne les SKUs disponibles (T + AMP + URL).
- Les performances affichées (Gbps) proviennent de l’Excel (colonnes : Firewall / Threat / IPS / FW+AVC+IPS).

## 🔄 Mise à jour des données

### Mode statique:
- Pour régénérer `data/firewalls.json` avec un nouvel Excel, relancez le script Python utilisé pour construire ce site.

### Mode PostgreSQL:
1. Mettez à jour le fichier `data/firewalls.json`
2. Réexécutez le script d'initialisation:
   ```bash
   npm run init-db
   ```

## 📡 API Endpoints (Mode PostgreSQL)

- `GET /api/health` - Vérifier l'état du serveur
- `GET /api/firewalls` - Récupérer tous les produits (avec filtres optionnels)
- `GET /api/firewalls/:model` - Récupérer un produit spécifique
- `GET /api/families` - Récupérer toutes les familles

**Paramètres de filtrage:**
- `?search=` - Rechercher dans modèle ou famille
- `?family=` - Filtrer par famille
- `?form_factor=` - Filtrer par format
- `?fw_min=` - Débit firewall minimum (Gbps)
- `?threat_min=` - Débit threat minimum (Gbps)
- `?ips_min=` - Débit IPS minimum (Gbps)

Exemple: `http://localhost:3000/api/firewalls?family=1100&fw_min=5`

---

*Prototype non-officiel, à adapter selon la charte Cisco si usage externe.*
