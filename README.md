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


## 📝 Diagramme de classe UML

[Diagramme PlantUML](https://uml.planttext.com/plantuml/svg/jLVRSjis47tNLw3gJ6ErijrEtZHn9hHirQmTgIDIwVGH8Y4BDGYokDXMsdn0_wAlUUyV-CUwk90Y9Kg-jF6CnkHY0UoUFNlXEwcmK3fZdQzIig2Se1ZF6JdWE2FzbCYaXnA6fKH6WB14NIFieZTlq47S_teq2k2lXzw-xNHUePEJ4nJCuelpSHoEmc4GXvEn4PgrcQACIgo85XrtnKmIqKVTsaAtX_xe8FGTeka0pMRX6LppyoMSRMGamvGDa5I2ycjOq9p-hebVBC34kroa5rWkInsxa59PCBmQW_KDUI88N9a6Qe3EuC7AT95koLB2I4s6_aHSCrPVEbrvM_tI9-FjzE4VHj0ro-UOeOCWpIZl8-SmKSbHpqCmpHa12EhQUp7WDJSs8J1n4RHGDETD1Dezi6PQAq03_PPJhhGWriP3OrOjIDxAQgaoKOCaN9ivAiqKeBGf_rGI98g3U1P7Q0WicGPNOVJmLrII959OQILHaMk1LAuLaOZ1Zt15rSDdwOsoQX9CylfxCLEhOetP0UMt53O1I7sKaMnk8e8vPYj9uS05PQHdTzrYfclR2i9JU03T9245mDa7r186-G9FvBwWmZm8pRdLIlAiiAZ3aS1QgsJ3lYzGL0Q9ehTmwpm7035VOpQSN5q5fvDf8wDESopIOui8rd0bOtYU2_1juM6o2e2ILpcsxq_crrvRyplU7leld5Vl8MJ0qlILve0Ik5DtzRsFPxVK8kXnbtTns9w-YznhOc2NsYIbAeUhRocv8yB5kI0Yer82T7A0VeecOokLbhjj1rjgrlpUNceWQ59sBu2j6HzM_4SFVoD1p2afOBM1PrXBasvjp-DuxiIjKRyVSrZbDwJ9kDsukVIJ3N0oV0_b2d27ikPugOM0Aj8KIf0qji4nHSxJvyDgadGo_J4OXv7BqSjWV1fKgJhCMSuv5B9KEu3GmINcSypBHW0AEZDOUysdSNSdrbjvNEIIkYIk06b9rBt4KIIJnmaC2yODp2LGXfYgOymjMGCwXY_mxtXeDFTQdrYVdvLxq0NOqmhKjiCm8T1ho9WuRzILbkBLHiWlNDSCVs1YkWZFfn4wZr4m3gv-ZSwhnZYYoP8I8T4m-W1kviaDT4CaeKi6lqGeUbtIAFemehPP-mr6VsyG806pDgHD9znYKIxeDOLckJLDoTUNPBKXETN93L4DeJaqeX_9EYWPpKXSQz0EwoL9RgJE6a9Ti1odxS4frngHs5qmCg8mH0xNgl8-vWTsF03MXm4YYmL9b7xuJ1pwPZW1Y3tyGJL8TFsc5s6Vo5iJnRQbSbJPmgp00eAYW28rhw2SQQQUrdsUoVrgmdb9fMoECz_0DyDP6AzhPPP1NSQcfbSO6wXaLIkjWYsMbUgBWCPQBVFsCIRd2auU84NkTzVB_x40N538Qc76ULFIOCmqnKl2VA5Xia1AGE_irMSTfxy246ex_qF7s3K6EKCsIYuWpcH3PWVqLTmSjMqtI7ndAuVjXQrF9OzxjTtLzJN8Db6lA3GzlxBigIfa0B4qvoneOaULZlbSGTqVkkZm47M_FphwjelAZnaqG4iiE_PnfqRPBs0MyIsydA_R3xVWmpuOZMN7lRGek1dL6U0nQLMkpLm3CwUaSkUTrP6qEX7idOXhpCrtjJ6txGOtSi0smtLCmMWlsJ04ekZDDG5jiyAhk5YLTi9Icz86gbLV8yfp0WwmgXl6kiRc3J4SQbKh2x3NArdMARVlrBQQ7y6i-QhDm_NrhjMq1gDsN0d59c-icoQZMtrqrSpRdhYtrflMcgw2xU6RhnF-qALxsqcbjJRalQnzaNVS9_UZZ7RzfLsxGUd7b9i1twUv4NElsda7EQCpzYy0)


## 📚 Documentation technique
[Documentation technique](docs/architecture-technique.md)
