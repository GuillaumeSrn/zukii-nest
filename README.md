# Zukii NestJS API

API REST Zukii : Application collaborative d'analyse de données CSV.

## 🚀 Démarrage rapide

### Prérequis
- Docker et Docker Compose installés
- Node.js 20+ (optionnel, pour développement local)

### Installation

1. **Cloner et configurer**
   ```bash
   git clone <repository-url>
   cd zukii-nest
   cp .env.example .env
   # Éditer .env avec vos valeurs
   ```

2. **Démarrer l'environnement**
   ```bash
   docker compose up --build
   ```

3. **Vérifier le fonctionnement**
   - API : http://localhost:3000
   - Base de données : localhost:5432
   
## 🚀 Installation et configuration

### Prérequis
- Node.js 20+
- Docker et Docker Compose
- PostgreSQL (via Docker)

### Installation
```bash
# Installation des dépendances
npm install

# Configuration de l'environnement
cp .env.example .env
# Modifier les variables selon vos besoins
```

#### Variables d'environnement requises
```env
# === DATABASE ===
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=zukii_user
DB_PASSWORD=zukii_password
DB_DATABASE=zukii_db

# === JWT ===
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# === APPLICATION ===
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# === MICROSERVICE IA ===
MICROSERVICE_API_KEY=your_secure_random_key_here_change_in_production
MICROSERVICE_URL=https://your-lambda-url.execute-api.region.amazonaws.com/prod
MICROSERVICE_TIMEOUT=30000

# === TESTS ===
TEST_USER_PASSWORD=MotDePasse123!
```

### Base de données

#### Démarrage de PostgreSQL
```bash
# Démarrer PostgreSQL et Adminer
docker compose up -d db
docker compose --profile tools up -d adminer
```

#### Initialisation des données de référence
```bash
# ✅ Auto-seeding 
# Les statuts de référence sont automatiquement initialisés au démarrage
# si la table statuses est vide

# Aucune action manuelle requise - tout est automatique
```

#### Accès aux outils
- **Adminer** : http://localhost:8080
  - Serveur : `db`
  - Utilisateur : `zukii_user`
  - Mot de passe : `zukii_password`
  - Base : `zukii_db`

### Démarrage de l'application

```bash
# Développement avec hot-reload
npm run start:dev

# Production
npm run build
npm run start:prod
```

#### Accès aux services
- **API** : http://localhost:3000
- **Documentation Swagger** : http://localhost:3000/api

### Données de référence

Le projet utilise un système de statuts centralisé pour gérer les états des différentes entités :

```typescript
// Exemples d'utilisation
import { UserStatus, BoardStatus } from './modules/status/enums/status.enum';

// Dans le code
user.statusId = UserStatus.ACTIVE;
board.statusId = BoardStatus.ARCHIVED;
```

**Statuts disponibles :**
- **Users** : `user-active`, `user-inactive`
- **Boards** : `board-active`, `board-archived`
- **BoardMembers** : `board-member-active`, `board-member-inactive`
- **Blocks** : `block-draft`, `block-active`, `block-archived`
- **Invitations** : `invitation-pending`, `invitation-accepted`, `invitation-declined`, `invitation-expired`

### Scripts disponibles

```bash
# Tests
npm run test              # Tests unitaires
npm run test:watch        # Tests en mode watch
npm run test:cov          # Tests avec couverture

# Code quality
npm run lint              # ESLint
npm run format            # Prettier
npm run lint:check        # Vérification sans correction
npm run format:check      # Vérification formatage

# Base de données (Auto-seeding)
# Aucune commande manuelle requise - seeding automatique au démarrage

# Docker
npm run docker:build     # Build de l'image Docker
```

## 🛠️ Développement

### Commandes essentielles
```bash
# Services
docker compose up -d              # Démarrer
docker compose logs -f api        # Logs en temps réel
docker compose restart api        # Redémarrer après modifs
docker compose down               # Arrêter

# Base de données
docker compose down -v            # Reset complet avec données
docker compose exec api sh        # Accès conteneur
```

### Scripts NPM
```bash
npm run build                     # Compilation
npm run start:dev                 # Développement local (sans Docker)
npm run lint                      # Vérification code
npm run format                    # Formatage automatique
```

## 📊 État du projet

### ✅ Modules opérationnels (92/92 tests ✅)
- **Users** : CRUD avec authentification bcrypt et gestion des statuts
- **Status** : États centralisés par catégorie avec auto-seeding
- **Auth** : JWT, Guards, protection des routes sensibles
- **Boards** : CRUD complet, validation ownership, soft delete
- **BoardMembers** : Collaboration avec permissions granulaires (view, edit, admin)

### 🏗️ Architecture consolidée
- **Interfaces centralisées** : JwtUser, test mocks typés
- **ESLint strict** : Configuration spécialisée pour tests
- **BaseEntity** : Héritage cohérent avec timestamps et soft delete
- **Séparation permissions/statuts** : Architecture claire et maintenable

### 📋 Roadmap
- **Blocks** : Contenu interactif (text, file, analysis) avec positionnement
- **Block Relations** : Liens entre blocks (generated_from, references, etc.)
- **Content Types** : TextContent, FileContent, AnalysisContent spécialisés
- **Invitations** : Système d'invitation avec tokens temporaires
- **🆕 Analysis Templates** : Templates préconfigurés pour IA (analyse prévisionnelle, extraction données, etc.)
- **🆕 Microservice IA** : Intégration Lambda AWS Python -> Microservice de traitement IA et processing des données

## 🏗️ Architecture

- **NestJS** : Framework, injection de dépendances
- **PostgreSQL** : Base de données relationnelle
- **TypeORM** : ORM avec soft delete
- **Docker** : Environnement de développement

### Structure du projet
```
src/
├── common/entities/base.entity.ts    # Entité abstraite
├── modules/
│   ├── users/                        # Gestion utilisateurs
│   ├── status/                       # États centralisés
│   ├── auth/                         # Authentification JWT
│   └── [entity]/                     # Pattern modulaire
│       ├── entities/
│       ├── dto/
│       ├── *.controller.ts
│       ├── *.service.ts
│       └── *.module.ts
└── app.module.ts
```

### Principes SOLID appliqués
- **SRP** : Responsabilité unique par classe/service
- **OCP** : Extension via héritage (BaseEntity, modules)
- **LSP** : Substitution des abstractions respectée
- **ISP** : DTOs spécialisés (Create, Update, Response)
- **DIP** : Injection de dépendances NestJS obligatoire

## 🔒 Sécurité

- Hachage bcrypt des mots de passe (12 rounds)
- JWT pour authentification
- Guards NestJS pour protection des routes
- Validation stricte des entrées (class-validator)
- Exclusion données sensibles (@Exclude)
- Permissions granulaires au niveau des boards

## 📚 Documentation

### Référence technique
- **[`docs/DEVELOPMENT_GUIDE.md`](docs/DEVELOPMENT_GUIDE.md)** : Guide de développement complet
- **[`docs/architecture-technique.md`](docs/architecture-technique.md)** : Architecture détaillée
- **[`docs/database-schema.puml`](docs/database-schema.puml)** : Modèle de données
- **[`docs/ci-cd.md`](docs/ci-cd.md)** : Pipeline CI/CD

## 🤝 Contribution

1. Créer une branche : `git checkout -b feature/ma-fonctionnalite`
2. Développer avec tests unitaires obligatoires
3. Valider : `npm run lint && npm run format && npm run test`
4. Commit : `git commit -m "feat: description"`
5. Push et créer une PR

## ⚡ Hot Reload

Modifications automatiquement reflétées grâce au volume mapping du dossier `src/`.

---

*Projet Zukii - Analyse collaborative de données CSV avec IA*
