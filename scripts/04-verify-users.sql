-- Script de vérification des utilisateurs

-- Afficher tous les utilisateurs avec leurs informations
SELECT 
    id,
    username,
    password,
    is_admin,
    created_at,
    updated_at
FROM users 
ORDER BY username;

-- Compter le nombre d'utilisateurs
SELECT COUNT(*) as total_users FROM users;

-- Compter le nombre d'administrateurs
SELECT COUNT(*) as admin_count FROM users WHERE is_admin = TRUE;
