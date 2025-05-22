# Zukii Backend

API REST NestJS pour le projet Zukii.

## Description

Ce backend gère l’authentification, la gestion des utilisateurs, des boards, l’upload des fichiers CSV, et l’orchestration des analyses de données via le microservice Python.

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

Créer un fichier `.env` à la racine du projet avec les variables nécessaires :
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
- `npm run build` : Compiler l’application
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
- Documenter l’API avec Swagger
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

> Ce projet fait partie de l’écosystème Zukii.