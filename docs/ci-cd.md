# CI/CD - Documentation

## Vue d'ensemble

Le projet Zukii utilise GitHub Actions pour l'intégration continue et la gestion des releases.

## Workflows

### 1. CI (Intégration Continue) - `.github/workflows/ci.yml`

**Déclencheurs :**
- Push sur `main`
- Pull Requests vers `main`

**Jobs :**

#### Lint et formatage
- Vérification ESLint
- Validation du formatage Prettier
- Échec si le code n'est pas conforme

#### Tests unitaires
- Exécution des tests Jest
- Génération du rapport de couverture

#### Tests e2e
- Base de données PostgreSQL en service
- Tests d'intégration complets
- Variables d'environnement de test

#### Build Docker
- Construction de l'image Docker
- Validation du build
- Cache optimisé pour les builds

#### Audit de sécurité
- `npm audit` pour les vulnérabilités
- Seuil de sévérité : MODERATE

### 2. CD (Gestion des Releases) - `.github/workflows/cd.yml`

**Déclencheurs :**
- Tags `v*` (releases)
- Succès du workflow CI sur `main`

**Jobs :**

#### Déploiement Démo
- Automatique après CI réussi sur `main`
- Simulation d'un déploiement
- Démonstration des capacités DevOps

#### Création de Release
- Déclenché par les tags de version
- Création automatique de release GitHub
- Gestion des versions

#### Notifications
- Statut des opérations
- Logs des actions effectuées

## Configuration

### Variables d'environnement
Les variables d'environnement sont gérées via les secrets GitHub et les fichiers `.env` locaux.

### Branches
- **main** : Branche principale, déclenchement de la CI
- **feature/** : Branches de fonctionnalités pour les PR

## Scripts NPM

### Développement
```bash
npm run start:dev        # Démarrage développement
npm run test:watch       # Tests en mode watch
npm run docker:run       # Base de données locale
```

### CI/CD
```bash
npm run test:ci          # Tests avec couverture
npm run lint:check       # Vérification linting
npm run format:check     # Vérification formatage
npm run precommit        # Vérifications pré-commit
```

### Docker
```bash
npm run docker:build     # Build image
npm run docker:logs      # Logs conteneur
npm run db:reset         # Reset base de données
```

## Workflow de développement

### 1. Développement local
```bash
git checkout -b feature/ma-fonctionnalite
# Développement...
npm run precommit
git commit -m "feat: ajouter nouvelle fonctionnalité"
git push origin feature/ma-fonctionnalite
```

### 2. Pull Request
- Création automatique des checks CI
- Review obligatoire pour `main`
- Merge après validation

### 3. Déploiement staging
- Automatique après merge sur `main`
- Tests sur environnement staging

### 4. Release production
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Monitoring et logs

### GitHub Actions
- Logs détaillés de chaque job
- Artifacts de build conservés
- Historique des déploiements

### Codecov
- Rapports de couverture
- Évolution de la couverture
- Commentaires automatiques sur PR

### Container Registry
- Images Docker versionnées
- Nettoyage automatique des anciennes images
- Sécurité avec GitHub Container Registry

## Optimisations

### Cache
- Cache npm pour les dépendances
- Cache Docker layers
- Cache des builds précédents

### Parallélisation
- Jobs indépendants en parallèle
- Tests unitaires et e2e séparés
- Build Docker après tests

### Sécurité
- Permissions minimales
- Secrets chiffrés
- Audit automatique des dépendances

## Troubleshooting

### Tests qui échouent
1. Vérifier les logs GitHub Actions
2. Reproduire localement avec `npm run test:ci`
3. Vérifier la configuration de la base de données

### Build Docker qui échoue
1. Tester localement avec `npm run docker:build`
2. Vérifier le Dockerfile
3. Contrôler les dépendances

### Déploiement qui échoue
1. Vérifier les secrets d'environnement
2. Contrôler les permissions
3. Examiner les logs de déploiement

## Évolutions futures

### À implémenter
- [ ] Notifications Slack/Discord
- [ ] Tests de performance automatisés
- [ ] Déploiement blue-green
- [ ] Rollback automatique
- [ ] Monitoring applicatif

### Améliorations possibles
- [ ] Cache plus agressif
- [ ] Tests de sécurité SAST/DAST
- [ ] Analyse de qualité SonarQube
- [ ] Déploiement multi-région

---

Cette configuration CI/CD assure la qualité, la sécurité et la fiabilité des déploiements du projet Zukii. 