const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { pool } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Route de santé
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'disconnected',
      error: error.message
    });
  }
});

// API: Récupérer tous les produits avec filtres optionnels
app.get('/api/firewalls', async (req, res) => {
  try {
    const {
      search,
      family,
      form_factor,
      fw_min,
      threat_min,
      ips_min
    } = req.query;

    let query = `
      SELECT
        p.id,
        p.model,
        p.family,
        p.form_factor,
        p.fw_gbps,
        p.threat_gbps,
        p.ips_gbps,
        p.hardware_sku,
        p.hardware_gpl,
        p.support_sku,
        p.support_gpl,
        p.license_roots,
        p.license_prices,
        p.created_at,
        p.updated_at
      FROM products p
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Filtre de recherche (modèle ou famille)
    if (search) {
      query += ` AND (UPPER(p.model) LIKE UPPER($${paramIndex}) OR UPPER(p.family) LIKE UPPER($${paramIndex}))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filtre par famille
    if (family) {
      query += ` AND p.family = $${paramIndex}`;
      params.push(family);
      paramIndex++;
    }

    // Filtre par form factor
    if (form_factor) {
      query += ` AND LOWER(p.form_factor) LIKE LOWER($${paramIndex})`;
      params.push(`%${form_factor}%`);
      paramIndex++;
    }

    // Filtres de performance
    if (fw_min) {
      query += ` AND p.fw_gbps >= $${paramIndex}`;
      params.push(parseFloat(fw_min));
      paramIndex++;
    }

    if (threat_min) {
      query += ` AND p.threat_gbps >= $${paramIndex}`;
      params.push(parseFloat(threat_min));
      paramIndex++;
    }

    if (ips_min) {
      query += ` AND p.ips_gbps >= $${paramIndex}`;
      params.push(parseFloat(ips_min));
      paramIndex++;
    }

    query += ' ORDER BY p.model';

    const result = await pool.query(query, params);

    // Formater les données pour correspondre au format JSON actuel
    const products = result.rows.map(row => ({
      model: row.model,
      family: row.family,
      form_factor: row.form_factor,
      perf: {
        fw_gbps: row.fw_gbps,
        threat_gbps: row.threat_gbps,
        ips_gbps: row.ips_gbps
      },
      hardware: {
        sku: row.hardware_sku,
        gpl: row.hardware_gpl
      },
      support: {
        sku: row.support_sku,
        gpl: row.support_gpl
      },
      licenses: {
        roots: row.license_roots || {},
        prices: row.license_prices || {}
      }
    }));

    res.json({
      products,
      meta: {
        license_terms_supported: [1, 3, 5],
        count: products.length
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des firewalls:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la récupération des données',
      details: error.message
    });
  }
});

// API: Récupérer un produit spécifique par modèle
app.get('/api/firewalls/:model', async (req, res) => {
  try {
    const { model } = req.params;

    const result = await pool.query(
      `SELECT * FROM products WHERE UPPER(model) = UPPER($1)`,
      [model]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const row = result.rows[0];
    const product = {
      model: row.model,
      family: row.family,
      form_factor: row.form_factor,
      perf: {
        fw_gbps: row.fw_gbps,
        threat_gbps: row.threat_gbps,
        ips_gbps: row.ips_gbps
      },
      hardware: {
        sku: row.hardware_sku,
        gpl: row.hardware_gpl
      },
      support: {
        sku: row.support_sku,
        gpl: row.support_gpl
      },
      licenses: {
        roots: row.license_roots || {},
        prices: row.license_prices || {}
      }
    };

    res.json(product);
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  }
});

// API: Récupérer toutes les familles distinctes
app.get('/api/families', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT family FROM products WHERE family IS NOT NULL ORDER BY family`
    );

    res.json({
      families: result.rows.map(row => row.family)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des familles:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  }
});

// Servir les fichiers statiques pour le frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Serveur Cisco Firewall Selector démarré avec succès  ║
╚════════════════════════════════════════════════════════╝

🚀 Serveur en écoute sur le port ${PORT}
🌐 URL: http://localhost:${PORT}
📡 API disponible sur: http://localhost:${PORT}/api
🔍 Health check: http://localhost:${PORT}/api/health

Endpoints disponibles:
  - GET  /api/health              (Vérifier l'état du serveur)
  - GET  /api/firewalls           (Tous les produits avec filtres)
  - GET  /api/firewalls/:model    (Produit spécifique)
  - GET  /api/families            (Toutes les familles)

Environnement: ${process.env.NODE_ENV || 'development'}
  `);
});

// Gestion de l'arrêt gracieux
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, fermeture du serveur...');
  pool.end(() => {
    console.log('Pool de connexions fermé');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, fermeture du serveur...');
  pool.end(() => {
    console.log('Pool de connexions fermé');
    process.exit(0);
  });
});

module.exports = app;
