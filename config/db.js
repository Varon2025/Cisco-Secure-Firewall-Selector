const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cisco_firewalls',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Nombre maximum de clients dans le pool
  idleTimeoutMillis: 30000, // Temps avant qu'un client inactif soit fermé
  connectionTimeoutMillis: 2000, // Temps d'attente max pour une connexion
});

// Test de connexion au démarrage
pool.on('connect', () => {
  console.log('✓ Connecté à la base de données PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Erreur inattendue sur le client PostgreSQL:', err);
  process.exit(-1);
});

// Fonction utilitaire pour exécuter des requêtes
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Requête exécutée', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la requête:', error);
    throw error;
  }
};

// Fonction pour obtenir un client du pool (pour les transactions)
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // Wrapper pour logger les requêtes
  client.query = (...args) => {
    client.lastQuery = args;
    return query(...args);
  };

  // Amélioration de la fonction release
  client.release = () => {
    client.query = query;
    client.release = release;
    return release();
  };

  return client;
};

module.exports = {
  pool,
  query,
  getClient,
};
