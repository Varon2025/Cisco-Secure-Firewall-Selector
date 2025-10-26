/**
 * Script d'initialisation de la base de données
 * Ce script:
 * 1. Crée le schéma de la base de données
 * 2. Charge les données depuis le fichier JSON
 * 3. Insère les données dans PostgreSQL
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function initDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔄 Début de l\'initialisation de la base de données...\n');

    // 1. Créer le schéma
    console.log('📋 Étape 1/3: Création du schéma...');
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '../database/schema.sql'),
      'utf8'
    );

    await client.query(schemaSQL);
    console.log('✓ Schéma créé avec succès\n');

    // 2. Charger les données JSON
    console.log('📋 Étape 2/3: Chargement des données depuis firewalls.json...');
    const jsonData = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../data/firewalls.json'),
        'utf8'
      )
    );

    const products = jsonData.products || [];
    console.log(`✓ ${products.length} produits chargés\n`);

    // 3. Insérer les données
    console.log('📋 Étape 3/3: Insertion des données dans PostgreSQL...');

    let insertedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        await client.query(
          `INSERT INTO products (
            model,
            family,
            form_factor,
            fw_gbps,
            threat_gbps,
            ips_gbps,
            hardware_sku,
            hardware_gpl,
            support_sku,
            support_gpl,
            license_roots,
            license_prices
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            product.model,
            product.family || null,
            product.form_factor || null,
            product.perf?.fw_gbps || null,
            product.perf?.threat_gbps || null,
            product.perf?.ips_gbps || null,
            product.hardware?.sku || null,
            product.hardware?.gpl || null,
            product.support?.sku || null,
            product.support?.gpl || null,
            JSON.stringify(product.licenses?.roots || {}),
            JSON.stringify(product.licenses?.prices || {})
          ]
        );
        insertedCount++;

        if (insertedCount % 10 === 0) {
          process.stdout.write(`\r  Progression: ${insertedCount}/${products.length} produits insérés...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`\n⚠️  Erreur lors de l'insertion de ${product.model}:`, error.message);
      }
    }

    console.log(`\n✓ ${insertedCount} produits insérés avec succès`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} erreurs rencontrées`);
    }

    // Afficher un résumé
    console.log('\n📊 Résumé de la base de données:');
    const stats = await client.query(`
      SELECT
        COUNT(*) as total_products,
        COUNT(DISTINCT family) as total_families,
        COUNT(DISTINCT form_factor) as total_form_factors,
        ROUND(AVG(fw_gbps)::numeric, 2) as avg_fw_gbps,
        ROUND(AVG(threat_gbps)::numeric, 2) as avg_threat_gbps,
        ROUND(AVG(ips_gbps)::numeric, 2) as avg_ips_gbps
      FROM products
    `);

    const summary = stats.rows[0];
    console.log(`  • Total produits: ${summary.total_products}`);
    console.log(`  • Familles distinctes: ${summary.total_families}`);
    console.log(`  • Form factors: ${summary.total_form_factors}`);
    console.log(`  • Débit FW moyen: ${summary.avg_fw_gbps} Gbps`);
    console.log(`  • Débit Threat moyen: ${summary.avg_threat_gbps} Gbps`);
    console.log(`  • Débit IPS moyen: ${summary.avg_ips_gbps} Gbps`);

    console.log('\n✅ Initialisation de la base de données terminée avec succès!');
    console.log('\n💡 Vous pouvez maintenant démarrer le serveur avec: npm start');

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'initialisation:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter le script
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('\n🎉 Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Échec du script:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase };
