-- Insertion des données initiales

-- Insertion des utilisateurs par défaut
INSERT INTO users (id, username, password, is_admin) VALUES
    ('lulu', 'Lulu', 'Misty123', FALSE),
    ('lolo', 'Lolo', 'Misty123', FALSE),
    ('admin', 'Admin', 'Misty123', TRUE)
ON CONFLICT (id) DO UPDATE SET
    password = EXCLUDED.password,
    is_admin = EXCLUDED.is_admin;

-- Insertion de quelques articles d'exemple pour Lulu
INSERT INTO shopping_items (name, category, user_id, price, weight, store, description) VALUES
    ('Pommes Golden', 'Fruits & Légumes', 'lulu', 2.50, '1kg', 'Carrefour', 'Pommes bio de saison'),
    ('Lait demi-écrémé', 'Produits Laitiers', 'lulu', 1.20, '1L', 'Leclerc', 'Lait frais local'),
    ('Pain de mie', 'Épicerie', 'lulu', 1.80, '500g', 'Boulangerie', 'Pain complet'),
    ('Yaourts nature', 'Produits Laitiers', 'lulu', 3.20, '8x125g', 'Monoprix', 'Yaourts bio')
ON CONFLICT DO NOTHING;

-- Insertion de quelques articles d'exemple pour Lolo
INSERT INTO shopping_items (name, category, user_id, price, weight, store, description) VALUES
    ('Bananes', 'Fruits & Légumes', 'lolo', 1.90, '1kg', 'Carrefour', 'Bananes équitables'),
    ('Fromage râpé', 'Produits Laitiers', 'lolo', 2.80, '200g', 'Leclerc', 'Emmental râpé'),
    ('Pâtes', 'Épicerie', 'lolo', 1.50, '500g', 'Intermarché', 'Pâtes italiennes'),
    ('Shampoing', 'Hygiène & Beauté', 'lolo', 4.50, '250ml', 'Pharmacie', 'Shampoing doux')
ON CONFLICT DO NOTHING;

-- Insertion de quelques catégories personnalisées d'exemple
INSERT INTO custom_categories (name) VALUES
    ('Produits bio'),
    ('Sans gluten'),
    ('Animaux de compagnie')
ON CONFLICT (name) DO NOTHING;

-- Insertion des paramètres par défaut pour les utilisateurs
INSERT INTO user_settings (user_id, group_by_category) VALUES
    ('lulu', TRUE),
    ('lolo', FALSE),
    ('admin', FALSE)
ON CONFLICT (user_id) DO UPDATE SET
    group_by_category = EXCLUDED.group_by_category;
