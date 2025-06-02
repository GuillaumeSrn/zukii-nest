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
   ./scripts/dev.sh
   # ou manuellement : docker compose up --build
   ```

3. **Vérifier le fonctionnement**
   - API : http://localhost:3000
   - Base de données : localhost:5432
   - Adminer : http://localhost:8080

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

## 🤝 Contribution

1. Créer une branche : `git checkout -b feature/ma-fonctionnalite`
2. Développer avec tests
3. Valider : `npm run precommit`
4. Commit : `git commit -m "feat: description"`
5. Push et créer une PR

## 📚 Documentation complète

Consultez le dossier [`docs/`](docs/) pour :
- Architecture technique détaillée
- Modèle de données et relations
- Configuration CI/CD
- État du projet et roadmap

---

```
src/
├── common/entities/base.entity.ts    # Entité abstraite
├── modules/
│   ├── users/                        # Gestion utilisateurs
│   ├── roles/                        # Système permissions
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
