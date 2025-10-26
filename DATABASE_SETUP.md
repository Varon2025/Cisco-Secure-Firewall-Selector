# Guide de Configuration PostgreSQL pour Cisco Secure Firewall Selector

Ce guide vous explique comment connecter votre application à une base de données PostgreSQL existante.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Installation de PostgreSQL](#installation-de-postgresql)
3. [Configuration de la base de données](#configuration-de-la-base-de-données)
4. [Installation des dépendances Node.js](#installation-des-dépendances-nodejs)
5. [Configuration de l'application](#configuration-de-lapplication)
6. [Initialisation de la base de données](#initialisation-de-la-base-de-données)
7. [Démarrage du serveur](#démarrage-du-serveur)
8. [Utilisation de l'API](#utilisation-de-lapi)
9. [Déploiement sur GitHub/Heroku](#déploiement)

---

## 🔧 Prérequis

- **Node.js** version 16 ou supérieure
- **PostgreSQL** version 12 ou supérieure
- **npm** ou **yarn**
- Un éditeur de texte (VS Code, Sublime, etc.)

---

## 📦 Installation de PostgreSQL

### Sur Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Sur macOS (avec Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Sur Windows:
Téléchargez et installez depuis: https://www.postgresql.org/download/windows/

---

## 🗄️ Configuration de la base de données

### 1. Accéder à PostgreSQL

```bash
# Se connecter en tant qu'utilisateur postgres
sudo -u postgres psql
```

### 2. Créer une base de données et un utilisateur

```sql
-- Créer un utilisateur
CREATE USER cisco_user WITH PASSWORD 'votre_mot_de_passe_securise';

-- Créer la base de données
CREATE DATABASE cisco_firewalls OWNER cisco_user;

-- Accorder tous les privilèges
GRANT ALL PRIVILEGES ON DATABASE cisco_firewalls TO cisco_user;

-- Quitter psql
\q
```

### 3. Tester la connexion

```bash
psql -h localhost -U cisco_user -d cisco_firewalls
```

Si vous pouvez vous connecter, votre base de données est prête!

---

## 📥 Installation des dépendances Node.js

Dans le répertoire du projet:

```bash
# Installer les dépendances
npm install

# Ou avec yarn
yarn install
```

Cela installera:
- `express` - Framework web
- `pg` - Client PostgreSQL pour Node.js
- `dotenv` - Gestion des variables d'environnement
- `cors` - Gestion des requêtes cross-origin
- `nodemon` - Redémarrage automatique en développement (dev only)

---

## ⚙️ Configuration de l'application

### 1. Créer le fichier `.env`

Copiez le fichier `.env.example` en `.env`:

```bash
cp .env.example .env
```

### 2. Éditer le fichier `.env`

Ouvrez `.env` et configurez vos paramètres:

```env
# Configuration PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cisco_firewalls
DB_USER=cisco_user
DB_PASSWORD=votre_mot_de_passe_securise

# Configuration du serveur
PORT=3000
NODE_ENV=development

# CORS - Domaines autorisés
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**⚠️ IMPORTANT:** Ne commitez JAMAIS le fichier `.env` sur GitHub!

Ajoutez `.env` à votre `.gitignore`:

```bash
echo ".env" >> .gitignore
```

---

## 🚀 Initialisation de la base de données

### 1. Créer le schéma et importer les données

```bash
npm run init-db
```

Ce script va:
1. ✅ Créer les tables dans PostgreSQL
2. ✅ Charger les données depuis `data/firewalls.json`
3. ✅ Insérer les données dans la base
4. ✅ Créer les index pour optimiser les performances

### 2. Vérifier l'importation

Connectez-vous à PostgreSQL:

```bash
psql -h localhost -U cisco_user -d cisco_firewalls
```

Exécutez quelques requêtes de test:

```sql
-- Compter le nombre de produits
SELECT COUNT(*) FROM products;

-- Voir les 5 premiers produits
SELECT model, family, form_factor, fw_gbps FROM products LIMIT 5;

-- Voir toutes les familles
SELECT DISTINCT family FROM products ORDER BY family;

-- Rechercher un modèle spécifique
SELECT * FROM products WHERE model LIKE '%FPR1120%';
```

---

## 🌐 Démarrage du serveur

### Mode développement (avec redémarrage automatique):

```bash
npm run dev
```

### Mode production:

```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

### Vérifier que tout fonctionne:

Ouvrez votre navigateur et testez:

1. **Page d'accueil**: http://localhost:3000
2. **Health check**: http://localhost:3000/api/health
3. **Tous les produits**: http://localhost:3000/api/firewalls
4. **Produit spécifique**: http://localhost:3000/api/firewalls/FPR1120

---

## 📡 Utilisation de l'API

### Endpoints disponibles:

#### 1. Health Check
```
GET /api/health
```
Vérifier l'état du serveur et de la connexion à la base de données.

**Réponse:**
```json
{
  "status": "OK",
  "database": "connected",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### 2. Récupérer tous les produits
```
GET /api/firewalls
```

**Paramètres de requête (optionnels):**
- `search` - Rechercher dans modèle ou famille
- `family` - Filtrer par famille
- `form_factor` - Filtrer par format
- `fw_min` - Débit firewall minimum (Gbps)
- `threat_min` - Débit threat minimum (Gbps)
- `ips_min` - Débit IPS minimum (Gbps)

**Exemples:**
```bash
# Tous les produits
curl http://localhost:3000/api/firewalls

# Recherche par modèle
curl "http://localhost:3000/api/firewalls?search=FPR"

# Filtrer par famille et performances
curl "http://localhost:3000/api/firewalls?family=1100&fw_min=5"
```

**Réponse:**
```json
{
  "products": [
    {
      "model": "FPR1120",
      "family": "1100",
      "form_factor": "Desktop",
      "perf": {
        "fw_gbps": 4.5,
        "threat_gbps": 2.1,
        "ips_gbps": 1.8
      },
      "hardware": {
        "sku": "FPR1120-NGFW-K9",
        "gpl": 2500.00
      },
      ...
    }
  ],
  "meta": {
    "license_terms_supported": [1, 3, 5],
    "count": 42
  }
}
```

#### 3. Récupérer un produit spécifique
```
GET /api/firewalls/:model
```

**Exemple:**
```bash
curl http://localhost:3000/api/firewalls/FPR1120
```

#### 4. Récupérer toutes les familles
```
GET /api/families
```

**Réponse:**
```json
{
  "families": ["1100", "2100", "4100", "9300"]
}
```

---

## 🚀 Déploiement

### Sur Heroku (avec PostgreSQL):

#### 1. Installer Heroku CLI
```bash
# Sur macOS
brew install heroku/brew/heroku

# Sur Ubuntu
curl https://cli-assets.heroku.com/install.sh | sh
```

#### 2. Créer une application Heroku
```bash
heroku login
heroku create cisco-firewall-selector
```

#### 3. Ajouter PostgreSQL
```bash
heroku addons:create heroku-postgresql:essential-0
```

#### 4. Configurer les variables d'environnement
```bash
heroku config:set NODE_ENV=production
heroku config:set ALLOWED_ORIGINS=https://cisco-firewall-selector.herokuapp.com
```

#### 5. Créer un Procfile
```bash
echo "web: node server.js" > Procfile
```

#### 6. Déployer
```bash
git add .
git commit -m "Add PostgreSQL backend"
git push heroku main
```

#### 7. Initialiser la base de données
```bash
heroku run npm run init-db
```

#### 8. Ouvrir l'application
```bash
heroku open
```

### Sur un serveur VPS (Ubuntu):

#### 1. Installer Node.js et PostgreSQL
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs postgresql postgresql-contrib nginx
```

#### 2. Configurer PostgreSQL (voir section précédente)

#### 3. Cloner le projet
```bash
git clone https://github.com/votre-username/Cisco-Secure-Firewall-Selector.git
cd Cisco-Secure-Firewall-Selector
npm install
```

#### 4. Configurer `.env`
```bash
nano .env
# Ajoutez vos paramètres
```

#### 5. Initialiser la base de données
```bash
npm run init-db
```

#### 6. Installer PM2 pour la gestion des processus
```bash
sudo npm install -g pm2
pm2 start server.js --name cisco-firewall
pm2 startup
pm2 save
```

#### 7. Configurer Nginx comme reverse proxy
```bash
sudo nano /etc/nginx/sites-available/cisco-firewall
```

Contenu:
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/cisco-firewall /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔍 Dépannage

### Problème: "Connection refused" à PostgreSQL

**Solution:**
1. Vérifiez que PostgreSQL est démarré:
   ```bash
   sudo systemctl status postgresql
   ```
2. Vérifiez les paramètres de connexion dans `.env`
3. Vérifiez que l'utilisateur a les permissions:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE cisco_firewalls TO cisco_user;
   ```

### Problème: "CORS error" dans le navigateur

**Solution:**
Ajoutez votre domaine frontend à `ALLOWED_ORIGINS` dans `.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,https://votre-domaine.com
```

### Problème: Port 3000 déjà utilisé

**Solution:**
Changez le port dans `.env`:
```env
PORT=8080
```

---

## 📚 Ressources supplémentaires

- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Documentation Express.js](https://expressjs.com/)
- [Documentation node-postgres](https://node-postgres.com/)
- [Guide Heroku PostgreSQL](https://devcenter.heroku.com/articles/heroku-postgresql)

---

## 🆘 Support

Si vous rencontrez des problèmes, vérifiez:
1. Les logs du serveur: `npm start` (regardez les messages d'erreur)
2. Les logs PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql-15-main.log`
3. Testez la connexion à la base: `psql -h localhost -U cisco_user -d cisco_firewalls`

---

## 📝 Structure des fichiers

```
Cisco-Secure-Firewall-Selector/
├── config/
│   └── db.js                 # Configuration PostgreSQL
├── database/
│   └── schema.sql            # Schéma de la base de données
├── scripts/
│   └── init-db.js            # Script d'initialisation
├── data/
│   └── firewalls.json        # Données source
├── js/
│   └── app.js                # Frontend JavaScript (modifié pour API)
├── css/
│   └── styles.css
├── index.html
├── server.js                 # Serveur Express
├── package.json
├── .env.example              # Template de configuration
├── .env                      # Configuration (à créer)
└── DATABASE_SETUP.md         # Ce fichier
```

---

## ✅ Checklist de déploiement

- [ ] PostgreSQL installé et démarré
- [ ] Base de données créée
- [ ] Utilisateur PostgreSQL créé avec permissions
- [ ] `.env` configuré avec les bonnes informations
- [ ] `.env` ajouté à `.gitignore`
- [ ] Dépendances installées (`npm install`)
- [ ] Base de données initialisée (`npm run init-db`)
- [ ] Serveur démarre sans erreur (`npm start`)
- [ ] API accessible (`http://localhost:3000/api/health`)
- [ ] Frontend fonctionne et charge les données depuis l'API

---

**Bonne chance avec votre déploiement! 🚀**
