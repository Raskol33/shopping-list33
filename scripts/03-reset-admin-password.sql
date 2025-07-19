-- Script pour réinitialiser le mot de passe du compte Admin

-- Supprimer le compte admin existant s'il existe
DELETE FROM users WHERE id = 'admin' OR username = 'Admin';

-- Recréer le compte admin avec le bon mot de passe
INSERT INTO users (id, username, password, is_admin, created_at, updated_at) VALUES
    ('admin', 'Admin', 'Misty123', TRUE, NOW(), NOW());

-- Vérifier que le compte a été créé
SELECT id, username, password, is_admin, created_at FROM users WHERE id = 'admin';

-- Afficher tous les utilisateurs pour vérification
SELECT id, username, is_admin FROM users ORDER BY username;
