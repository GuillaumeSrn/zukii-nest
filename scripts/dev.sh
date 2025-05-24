#!/bin/bash

# Script de démarrage pour l'environnement de développement

echo "🚀 Démarrage de l'environnement de développement Zukii NestJS..."

# Vérification de l'existence du fichier .env
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env manquant. Création depuis .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Fichier .env créé. Veuillez le configurer avant de continuer."
        exit 1
    else
        echo "❌ Fichier .env.example manquant. Veuillez créer un fichier .env."
        exit 1
    fi
fi

# Démarrage des services
echo "🐳 Démarrage des conteneurs Docker..."
docker compose up --build -d

echo "⏳ Attente du démarrage des services..."
sleep 10

echo "✅ Services démarrés !"
echo "📍 API NestJS : http://localhost:3000"
echo "📍 Base de données : localhost:5432"
echo "📍 Adminer (DB management) : http://localhost:8080"
echo ""
echo "Pour voir les logs : docker compose logs -f"
echo "Pour arrêter : docker compose down" 