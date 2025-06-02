# Documentation

## Vue d'ensemble

API collaborative d'analyse de données avec architecture modulaire NestJS.

## 📋 Index de documentation

### Architecture et modèle
- **[`database-schema.puml`](database-schema.puml)** : Diagramme UML complet des entités et relations
- **[`architecture-technique.md`](architecture-technique.md)** : Patterns, conventions, sécurité, déploiement

### DevOps et workflow  
- **[`ci-cd.md`](ci-cd.md)** : Pipeline d'intégration et déploiement continu
- **[`../README.md`](../README.md)** : Guide de démarrage avec Docker

## 📊 État du projet

### ✅ Modules opérationnels
- **Users** : CRUD avec authentification bcrypt, relations Status/Roles
- **Roles** : Permissions admin/user avec seeding automatique  
- **Status** : États centralisés par catégorie (user, board, block, invitation)

### 🔄 En développement
- **Auth** : JWT, Guards, protection des routes sensibles

### 📋 Roadmap
- **Boards** : Espaces collaboratifs avec members et permissions
- **Blocks** : Contenu interactif (text, file, analysis) avec positionnement
- **Invitations** : Système d'invitation avec tokens temporaires

## 🏗️ Architecture résumée

### Stack technique
- **Backend** : NestJS + TypeORM + PostgreSQL
- **Authentification** : bcrypt + JWT (en cours)
- **DevOps** : Docker + GitHub Actions
- **Tests** : e2e sans mocks

### Principes
- Architecture SOLID et modulaire
- Injection de dépendances native
- Validation stricte (class-validator)
- Soft delete centralisé (BaseEntity)

## 🎯 Standards appliqués

### Code
- TypeScript strict
- Patterns Repository + Service Layer
- DTOs avec validation et transformation
- Gestion d'erreurs structurée

### API
- Conventions REST standardisées
- Codes HTTP appropriés
- Documentation Swagger automatique
- Logging centralisé

### Sécurité
- Aucune clé en dur (variables d'environnement)
- Hachage bcrypt 12 rounds
- Validation des entrées utilisateur
- Exclusion des données sensibles

---

*Documentation évolutive - consultez les fichiers spécialisés pour les détails complets.*