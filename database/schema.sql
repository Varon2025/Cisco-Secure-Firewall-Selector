-- ============================================================================
-- Schéma de base de données pour Cisco Secure Firewall Selector
-- ============================================================================

-- Supprimer les tables existantes si elles existent
DROP TABLE IF EXISTS products CASCADE;

-- Table principale des produits
CREATE TABLE products (
    id SERIAL PRIMARY KEY,

    -- Informations de base
    model VARCHAR(100) NOT NULL UNIQUE,
    family VARCHAR(100),
    form_factor VARCHAR(50),

    -- Performances (Gbps)
    fw_gbps DECIMAL(10, 2),
    threat_gbps DECIMAL(10, 2),
    ips_gbps DECIMAL(10, 2),

    -- Hardware
    hardware_sku VARCHAR(100),
    hardware_gpl DECIMAL(12, 2),

    -- Support
    support_sku VARCHAR(100),
    support_gpl DECIMAL(12, 2),

    -- Licences (stockées en JSON)
    -- Format: { "t": "racine_sku", "amp": "racine_sku", ... }
    license_roots JSONB,

    -- Prix des licences par durée
    -- Format: { "t": { "1": { "sku": "...", "gpl": 123 }, "3": {...}, "5": {...} }, ... }
    license_prices JSONB,

    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_products_model ON products(model);
CREATE INDEX idx_products_family ON products(family);
CREATE INDEX idx_products_form_factor ON products(form_factor);
CREATE INDEX idx_products_fw_gbps ON products(fw_gbps);
CREATE INDEX idx_products_threat_gbps ON products(threat_gbps);
CREATE INDEX idx_products_ips_gbps ON products(ips_gbps);

-- Index GIN pour recherche dans les champs JSON
CREATE INDEX idx_products_license_roots ON products USING GIN (license_roots);
CREATE INDEX idx_products_license_prices ON products USING GIN (license_prices);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vue pour faciliter les requêtes avec JSON
CREATE OR REPLACE VIEW products_with_details AS
SELECT
    id,
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
    license_prices,
    created_at,
    updated_at,
    -- Statistiques dérivées
    CASE
        WHEN fw_gbps IS NOT NULL AND threat_gbps IS NOT NULL AND ips_gbps IS NOT NULL
        THEN (fw_gbps + threat_gbps + ips_gbps) / 3
        ELSE NULL
    END AS avg_performance
FROM products;

-- Commentaires pour la documentation
COMMENT ON TABLE products IS 'Table principale contenant tous les produits Cisco Secure Firewall';
COMMENT ON COLUMN products.model IS 'Nom du modèle (ex: FPR1120, CSF1210)';
COMMENT ON COLUMN products.family IS 'Famille/série du produit (ex: 1100, 2100, 4100)';
COMMENT ON COLUMN products.form_factor IS 'Format physique (Desktop, Rack, Compact)';
COMMENT ON COLUMN products.fw_gbps IS 'Débit Firewall en Gbps';
COMMENT ON COLUMN products.threat_gbps IS 'Débit Threat Defense en Gbps';
COMMENT ON COLUMN products.ips_gbps IS 'Débit IPS en Gbps';
COMMENT ON COLUMN products.license_roots IS 'Racines des SKU de licences au format JSON';
COMMENT ON COLUMN products.license_prices IS 'Prix des licences par durée (1, 3, 5 ans) au format JSON';

-- Fonction utilitaire pour rechercher dans les produits
CREATE OR REPLACE FUNCTION search_products(search_term VARCHAR)
RETURNS TABLE (
    model VARCHAR,
    family VARCHAR,
    form_factor VARCHAR,
    fw_gbps DECIMAL,
    threat_gbps DECIMAL,
    ips_gbps DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.model,
        p.family,
        p.form_factor,
        p.fw_gbps,
        p.threat_gbps,
        p.ips_gbps
    FROM products p
    WHERE
        UPPER(p.model) LIKE UPPER('%' || search_term || '%')
        OR UPPER(p.family) LIKE UPPER('%' || search_term || '%')
    ORDER BY p.model;
END;
$$ LANGUAGE plpgsql;

-- Afficher un résumé
SELECT 'Schéma de base de données créé avec succès!' as status;
SELECT 'Tables créées:' as info, COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products';
