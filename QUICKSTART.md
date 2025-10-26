# 🚀 Guide de Démarrage Rapide - PostgreSQL

Ce guide vous permet de démarrer rapidement avec PostgreSQL.

## ⏱️ Installation en 5 minutes

### Étape 1: Installer PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Étape 2: Créer la base de données

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Dans psql, exécutez:
CREATE USER cisco_user WITH PASSWORD 'changeme123';
CREATE DATABASE cisco_firewalls OWNER cisco_user;
GRANT ALL PRIVILEGES ON DATABASE cisco_firewalls TO cisco_user;
\q
```

### Étape 3: Installer les dépendances Node.js

```bash
npm install
```

### Étape 4: Configurer l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env
nano .env
```

Contenu minimal de `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cisco_firewalls
DB_USER=cisco_user
DB_PASSWORD=changeme123
PORT=3000
```

### Étape 5: Initialiser la base de données

```bash
npm run init-db
```

### Étape 6: Démarrer le serveur

```bash
npm start
```

✅ **C'est terminé!** Ouvrez http://localhost:3000

---

## 🧪 Tester l'installation

### Test 1: Health check
```bash
curl http://localhost:3000/api/health
```

Résultat attendu:
```json
{
  "status": "OK",
  "database": "connected",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Test 2: Récupérer les produits
```bash
curl http://localhost:3000/api/firewalls | jq
```

### Test 3: Recherche
```bash
curl "http://localhost:3000/api/firewalls?search=FPR" | jq
```

---

## 🔧 Commandes utiles

### Développement
```bash
# Démarrer avec auto-reload
npm run dev

# Réinitialiser la base de données
npm run init-db
```

### PostgreSQL
```bash
# Se connecter à la base
psql -h localhost -U cisco_user -d cisco_firewalls

# Voir tous les produits (dans psql)
SELECT model, family, fw_gbps FROM products LIMIT 10;

# Compter les produits
SELECT COUNT(*) FROM products;
```

### Dépannage
```bash
# Vérifier que PostgreSQL tourne
sudo systemctl status postgresql

# Voir les logs Node.js
npm start

# Voir les logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

---

## 📝 Exemples de requêtes API

### Filtrer par famille
```bash
curl "http://localhost:3000/api/firewalls?family=1100"
```

### Filtrer par performance minimale
```bash
curl "http://localhost:3000/api/firewalls?fw_min=10&threat_min=5"
```

### Rechercher un modèle spécifique
```bash
curl "http://localhost:3000/api/firewalls/FPR1120"
```

### Obtenir toutes les familles
```bash
curl "http://localhost:3000/api/families"
```

---

## 🐛 Problèmes courants

### "ECONNREFUSED" ou "Connection refused"
➡️ PostgreSQL n'est pas démarré:
```bash
sudo systemctl start postgresql
```

### "password authentication failed"
➡️ Vérifiez le mot de passe dans `.env`:
```bash
psql -h localhost -U cisco_user -d cisco_firewalls
# Si erreur, recréez l'utilisateur dans psql
```

### "Port 3000 already in use"
➡️ Changez le port dans `.env`:
```env
PORT=8080
```

### "Cannot find module"
➡️ Réinstallez les dépendances:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Documentation complète

Pour plus de détails, consultez:
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Guide complet
- [README.md](README.md) - Vue d'ensemble du projet

---

## 🎯 Prochaines étapes

1. ✅ Application fonctionne en local
2. 📦 Déployez sur Heroku ou un VPS (voir DATABASE_SETUP.md)
3. 🔒 Configurez HTTPS avec Let's Encrypt
4. 🚀 Ajoutez un nom de domaine personnalisé

**Besoin d'aide?** Consultez le [guide complet](DATABASE_SETUP.md) ou les logs d'erreur.
