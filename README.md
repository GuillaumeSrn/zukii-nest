# Zukii NestJS API

API REST pour application collaborative d'analyse de données CSV avec IA.

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
npm run test:e2e                  # Tests d'intégration
npm run lint                      # Vérification code
npm run format                    # Formatage automatique
```

## 📊 État du projet

### ✅ Modules opérationnels
- **Users** : CRUD avec authentification bcrypt et gestion des statuts
- **Status** : États centralisés par catégorie (user, board, block, invitation)
- **Auth** : JWT, Guards, protection des routes sensibles

### 📋 Roadmap
- **Boards** : Espaces collaboratifs avec membres et permissions granulaires
- **Blocks** : Contenu interactif (text, file, analysis) avec positionnement
- **Invitations** : Système d'invitation avec tokens temporaires

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
- **[`docs/architecture-technique.md`](docs/architecture-technique.md)** : Architecture détaillée
- **[`docs/database-schema.puml`](docs/database-schema.puml)** : Modèle de données

## 🤝 Contribution

1. Créer une branche : `git checkout -b feature/ma-fonctionnalite`
2. Développer avec tests unitaires obligatoires
3. Valider : `npm run precommit`
4. Commit : `git commit -m "feat: description"`
5. Push et créer une PR

## ⚡ Hot Reload

Modifications automatiquement reflétées grâce au volume mapping du dossier `src/`.

---

*Projet Zukii - Analyse collaborative de données CSV avec IA*

```
src/
├── common/entities/base.entity.ts    # Entité abstraite
├── modules/
│   ├── users/                        # Gestion utilisateurs
│   ├── status/                       # États centralisés
│   └── [entity]/                     # Pattern modulaire
│       ├── entities/
│       ├── dto/
│       ├── *.controller.ts
│       ├── *.service.ts
│       └── *.module.ts
└── app.module.ts
```

## 🏗️ Architecture

- **NestJS** : Framework, injection de dépendances
- **PostgreSQL** : Base de données relationnelle
- **TypeORM** : ORM avec soft delete
- **Docker** : Environnement de développement

### Patterns
- Repository Pattern + Service Layer
- DTO avec class-validator
- Architecture modulaire SOLID

## 🔒 Sécurité

- Hachage bcrypt (12 rounds)
- JWT pour authentification (à venir)
- Guards NestJS pour protection des routes
- Validation stricte des entrées

## 📚 Documentation

### Référence technique
- **[`docs/`](docs/)** : Index de la documentation
- **[`docs/architecture-technique.md`](docs/architecture-technique.md)** : Architecture détaillée
- **[`docs/database-schema.puml`](docs/database-schema.puml)** : Modèle de données

### Workflow
- **[`docs/ci-cd.md`](docs/ci-cd.md)** : CI/CD et déploiement
- **[`.github/workflows/`](.github/workflows/)** : GitHub Actions

## 🤝 Contribution

1. Créer une branche : `git checkout -b feature/ma-fonctionnalite`
2. Développer avec tests
3. Valider : `npm run precommit`
4. Commit : `git commit -m "feat: description"`
5. Push et créer une PR

## ⚡ Hot Reload

Modifications automatiquement reflétées grâce au volume mapping du dossier `src/`.

---

*Projet Zukii - Analyse collaborative de données CSV avec IA*
