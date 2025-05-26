# Documentation technique - Module utilisateur

## Vue d'ensemble

Module utilisateur de l'API **zukii-nest** développé avec NestJS, démontrant l'application des bonnes pratiques de développement et l'architecture SOLID.

## Fonctionnalités implémentées

### CRUD utilisateur
- **POST /users** : Création avec validation stricte
- **GET /users/:id** : Récupération avec relations

### Sécurité
- Hachage bcrypt des mots de passe (12 rounds)
- Validation des entrées (email, mot de passe complexe)
- Exclusion automatique des données sensibles

### Architecture
- Pattern Repository avec TypeORM
- Injection de dépendances NestJS
- DTOs avec class-validator
- Tests unitaires avec objets simulés
- Soft delete sur toutes les entités

## Structure technique

```
src/modules/users/
├── entities/user.entity.ts      # Entité avec soft delete
├── dto/                         # Validation entrée/sortie
├── users.controller.ts          # Endpoints REST
├── users.service.ts             # Logique métier
└── users.controller.spec.ts     # Tests unitaires
```

## Documentation

- **architecture-technique.md** : Détails de l'architecture du module
- **database-schema.puml** : Diagramme UML de la base de données

## Conformité technique

- ✅ Architecture SOLID appliquée
- ✅ Tests unitaires avec couverture
- ✅ Gestion d'erreurs structurée
- ✅ Logging pour traçabilité
- ✅ Documentation API Swagger
- ✅ Sécurité (hachage, validation)

---

*Ce module constitue une démonstration pratique des compétences de développement d'applications avec NestJS.* 