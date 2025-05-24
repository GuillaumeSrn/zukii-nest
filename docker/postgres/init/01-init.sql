-- Script d'initialisation de la base de données
-- Ce script sera exécuté automatiquement lors du premier démarrage de PostgreSQL

-- Création d'extensions utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configuration de base
SET timezone = 'UTC'; 