# Architecture technique - Module utilisateur

## Vue d'ensemble

Ce document présente l'architecture du module utilisateur de l'API **zukii-nest**, développée avec NestJS et conforme aux exigences RNCP bloc 3.

## Stack technologique

- **Framework** : NestJS 10 (Node.js 20)
- **Base de données** : PostgreSQL avec TypeORM
- **Validation** : class-validator et class-transformer
- **Sécurité** : bcryptjs (hachage 12 rounds)
- **Tests** : Jest avec objets simulés
- **Documentation** : Swagger/OpenAPI

## Architecture modulaire

```
src/modules/users/
├── entities/
│   ├── user.entity.ts           # Entité principale avec soft delete
│   └── user-role.entity.ts      # Relation utilisateur-rôle
├── dto/
│   ├── create-user.dto.ts       # Validation entrée
│   └── user-response.dto.ts     # Sérialisation sortie
├── users.controller.ts          # Endpoints REST
├── users.service.ts             # Logique métier
└── users.controller.spec.ts     # Tests unitaires
```

## Fonctionnalités implémentées

### CRUD complet
- **POST /users** : Création avec validation et assignation rôle
- **GET /users/:id** : Récupération avec relations

### Sécurité
- Hachage bcrypt des mots de passe (12 rounds)
- Validation stricte des entrées (email, mot de passe complexe)
- Exclusion automatique des données sensibles (`passwordHash`)
- Gestion des contraintes d'unicité (email)

### Architecture SOLID
- **Single Responsibility** : Séparation contrôleur/service/entité
- **Dependency Injection** : Injection NestJS, pas de `new` direct
- **Interface Segregation** : DTOs spécialisés (création/réponse)

## Patterns utilisés

### Repository Pattern
```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private rolesService: RolesService,
  ) {}
}
```

### DTO Pattern avec validation
```typescript
export class CreateUserDto {
  @IsEmail()
  email: string;

  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  password: string;
}
```

### Response Pattern sécurisé
```typescript
export class UserResponseDto {
  @Expose() id: string;
  @Expose() email: string;
  @Exclude() passwordHash?: string; // Exclu des réponses
}
```

## Tests unitaires

### Stratégie de test
- **Isolation** : Objets simulés pour Repository et services
- **Couverture** : Scénarios positifs et négatifs
- **Pattern AAA** : Arrange-Act-Assert

### Cas testés
- Création utilisateur valide
- Gestion erreurs (email dupliqué, utilisateur introuvable)
- Validation DTOs
- Propagation d'exceptions

## Gestion d'erreurs

### Types d'erreurs gérées
- **ConflictException** : Email déjà existant
- **NotFoundException** : Utilisateur introuvable
- **ValidationException** : Données d'entrée invalides

### Logging
```typescript
private readonly logger = new Logger(UsersService.name);

this.logger.log(`Création utilisateur : ${email}`);
this.logger.error(`Erreur : ${error.message}`, error.stack);
```

## Base de données

### Soft Delete
Héritage de `BaseEntity` avec suppression logique :
- `deletedAt` : Date de suppression
- `deletedBy` : Utilisateur ayant supprimé

### Relations
- `User` ↔ `UserRole` ↔ `Role` (Many-to-Many)
- Chargement automatique des rôles lors de la récupération

## Documentation API

### Swagger
Tous les endpoints documentés avec :
- Descriptions des opérations
- Codes de réponse
- Exemples de requêtes/réponses
- Schémas DTOs

## Conformité RNCP

Ce module répond aux exigences du **bloc 3 - Développer une application** :
- ✅ Code modulaire et documenté
- ✅ Tests unitaires avec couverture
- ✅ Gestion d'erreurs structurée
- ✅ Logging pour traçabilité
- ✅ Sécurité (hachage, validation)
- ✅ Bonnes pratiques (SOLID, patterns)