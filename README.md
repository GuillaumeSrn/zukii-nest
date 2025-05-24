# Zukii Backend

API REST NestJS pour le projet Zukii.

## Description

Ce backend gère l'authentification, la gestion des utilisateurs, des boards, l'upload des fichiers CSV, et l'orchestration des analyses de données via le microservice Python.

## Prérequis

- Node.js >= 20.x
- npm >= 10.x
- NestJS CLI (`npm install -g @nestjs/cli`)
- PostgreSQL (local ou distant)

## Installation
```shell
git clone https://github.com/<ton-username>/zukii-backend.git
cd zukii-backend
npm install
```

## Configuration

Créer un fichier `.env` à la racine du projet avec les variables nécessaires :
```text
DATABASE_URL=postgresql://user:password@localhost:5432/zukii
JWT_SECRET=your_jwt_secret
PYTHON_SERVICE_URL=http://localhost:5000
```

## Démarrage en développement

```shell
npm run start:dev
```

API accessible sur [http://localhost:3000](http://localhost:3000)

## Scripts utiles

- `npm run start:dev` : Lancer en mode développement
- `npm run build` : Compiler l'application
- `npm run test` : Lancer les tests unitaires

## Structure du projet

```text
src/
├── app.module.ts
├── main.ts
├── modules/
│ ├── auth/
│ ├── users/
│ ├── boards/
│ └── ...
├── common/
└── ...
```

## Bonnes pratiques

- Utiliser les modules pour organiser le code
- Protéger les routes sensibles avec des guards (auth, rôles)
- Utiliser DTOs et validation (class-validator)
- Documenter l'API avec Swagger
- Utiliser des interceptors pour les logs et les erreurs
- Utiliser des pipes pour la validation des données
- Utiliser des guards pour la validation des rôles
- Utiliser des filtres pour les erreurs
- Utiliser des interceptors pour les logs

## Contribution

1. Cloner le projet
2. Créer une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Commit (`git commit -m "feat: ajout de ... "`)
4. Push (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une Pull Request

> Ce projet fait partie de l'écosystème Zukii.

# Zukii NestJS - Guide de développement Docker

## 🚀 Démarrage rapide

### Prérequis
- Docker et Docker Compose installés
- Node.js 20+ (optionnel, pour développement local)

### Configuration de l'environnement

1. **Cloner le projet et naviguer dans le dossier**
   ```bash
   cd zukii-nest
   ```

2. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   ```
   Puis éditer le fichier `.env` avec vos propres valeurs.

3. **Démarrer l'environnement de développement**
   ```bash
   ./scripts/dev.sh
   ```
   Ou manuellement :
   ```bash
   docker compose up --build
   ```

## 📍 Services disponibles

- **API NestJS** : http://localhost:3000
- **Base de données PostgreSQL** : localhost:5432
- **Adminer (DB management)** : http://localhost:8080

## 🛠️ Commandes utiles

### Développement
```bash
# Démarrer les services
docker compose up -d

# Voir les logs en temps réel
docker compose logs -f api

# Redémarrer l'API après modifications
docker compose restart api

# Accéder au conteneur API
docker compose exec api sh

# Arrêter tous les services
docker compose down
```

### Base de données
```bash
# Sauvegarder la base de données
docker compose exec db pg_dump -U $DB_USERNAME $DB_NAME > backup.sql

# Restaurer la base de données
docker compose exec -T db psql -U $DB_USERNAME $DB_NAME < backup.sql

# Réinitialiser la base de données
docker compose down -v
docker compose up -d
```

### Production
```bash
# Lancer en mode production
docker compose -f docker-compose.prod.yml up --build -d
```

## 📁 Structure Docker

```
├── docker/
│   └── postgres/
│       └── init/           # Scripts d'initialisation DB
├── scripts/
│   └── dev.sh             # Script de démarrage développement
├── Dockerfile             # Production
├── Dockerfile.dev         # Développement (multi-stage)
├── docker-compose.yml     # Configuration développement
└── docker-compose.prod.yml # Configuration production
```

## 🔄 Hot Reload

Le hot reload est activé automatiquement grâce au volume mapping du dossier `src/`. 
Toute modification dans le code sera automatiquement reflétée dans le conteneur.

## 📊 Persistance des données

La base de données utilise un volume Docker nommé `postgres_data` qui persiste même après l'arrêt des conteneurs. 
Les données sont conservées entre les redémarrages. 