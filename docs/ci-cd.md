# CI/CD Pipeline

## Vue d'ensemble

Pipeline d'intégration et déploiement continu basé sur GitHub Actions pour validation automatique du code et déploiement sécurisé.

## Workflows principaux

### Intégration Continue (CI)
**Déclencheurs** : Push sur `main`, Pull Requests

**Étapes de validation** :
- **Code Quality** : ESLint, Prettier, TypeScript compilation
- **Tests** : Tests unitaires (.spec.ts) avec mocks appropriés
- **Build** : Construction et validation Docker
- **Security** : Audit des dépendances npm

### Déploiement Continu (CD)
**Déclencheurs** : Tags de version (`v*`)

**Étapes de release** :
- **Release GitHub** : Création automatique avec artifacts
- **Container Registry** : Publication d'images Docker versionnées
- **Deployment** : Déploiement automatisé sur environnements cibles

## Configuration

### Variables d'environnement
Configuration via GitHub Secrets et fichiers `.env` :
- Variables de base de données
- Clés d'authentification
- Endpoints de déploiement

### Branches et protection
- **main** : Branche protégée avec review obligatoire
- **feature/** : Branches de développement avec CI automatique

## Scripts de validation

### Vérifications automatiques
```bash
npm run build              # Compilation TypeScript
npm run test               # Tests unitaires (tous les .spec.ts)
npm run lint               # Analyse statique du code
npm run format             # Formatage du code
```

### Validation locale complète
```bash
npm run lint && npm run format && npm run test
```

## Optimisations

### Performance
- Cache npm et Docker layers
- Jobs parallélisés
- Build conditionnel basé sur les changements

### Sécurité
- Permissions minimales par job
- Secrets chiffés GitHub
- Audit automatique des vulnérabilités

## Stratégie de tests

### Approche privilégiée
- **Tests unitaires** : Services avec mocks appropriés (27 tests .spec.ts)
- **Build validation** : Compilation TypeScript stricte
- **Code quality** : Linting et formatage automatisés
- **Security audit** : Détection automatique des vulnérabilités

### Justification
- Focus sur la logique métier via tests unitaires
- Pipeline CI/CD rapide et fiable
- Validation par compilation stricte
- Sécurité garantie par audit automatique

## Workflow de développement

1. **Branche feature** : Développement avec CI automatique
2. **Pull Request** : Review et validation complète
3. **Merge main** : Déclenchement du pipeline complet
4. **Tag version** : Release automatique

## Troubleshooting

### Échecs courants
- **Build** : Vérifier compilation TypeScript locale
- **Tests** : Contrôler configuration base de données
- **Docker** : Valider Dockerfile et dépendances
- **Déploiement** : Vérifier secrets et permissions

### Debug local
```bash
# Reproduire la CI localement
npm run lint && npm run format && npm run test

# Tests avec couverture (optionnel)
npm run test:cov  # Tests avec rapport de couverture
```

## Métriques et monitoring

### Indicateurs
- Temps de build moyen
- Taux de succès des déploiements
- Couverture des tests
- Vulnérabilités détectées

### Logs et artifacts
- Logs structurés par job
- Artifacts de build conservés
- Historique des releases

---

*Pipeline robuste garantissant qualité, sécurité et déploiements fiables.* 