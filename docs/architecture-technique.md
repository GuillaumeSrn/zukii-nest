# Architecture Technique

## Modèle de données

L'architecture repose sur le diagramme UML défini dans `database-schema.puml`.

### Entités principales

#### Core System
- **User** : Gestion des comptes utilisateurs
- **Status** : États par catégorie (user, board, block, invitation)

#### Collaboration
- **Board** : Espaces de travail collaboratifs
- **BoardMember** : Membres d'un board avec permissions granulaires (view, edit, admin)
- **Invitation** : Système d'invitation temporaire

#### Système de Blocks (Refactorisé)
- **Block** : Positionnement, métadonnées et référence générique vers le contenu
- **TextContent** : Contenu textuel avec support Markdown/HTML
- **FileContent** : Métadonnées fichiers, statut upload et référence S3
- **AnalysisContent** : Résultats d'analyses IA avec données Plotly et traçabilité

#### Templates d'Analyse IA
- **AnalysisTemplate** : Templates préconfigurés pour microservice Python
  - Prompts OpenAI optimisés par type d'analyse
  - Configuration des paramètres d'entrée
  - Menu déroulant pour interface utilisateur

#### Relations entre Blocks
- **BlockRelation** : Relations inter-blocks (generated_from, references, comment_on, derived_from)

### Relations
- User 1..N Board (propriétaire)
- User 1..N BoardMember N..1 Board (permissions granulaires)
- Board 1..N Block
- Block 1..1 TextContent|FileContent|AnalysisContent (via content_id)
- Block N..N Block (via BlockRelation)
- Status 1..N User/Board/Block

### Permissions simplifiées
Les permissions sont gérées **uniquement au niveau des boards** via la table `BoardMember` :
- **view** : Consultation des données
- **edit** : Modification du contenu
- **admin** : Gestion des membres et permissions

## Architecture logicielle

### Structure modulaire
```
src/
├── common/
│   └── entities/base.entity.ts    # Entité abstraite avec soft delete
├── modules/
│   ├── [entity]/
│   │   ├── entities/              # Modèles de données
│   │   ├── dto/                   # Validation et sérialisation
│   │   ├── [entity].controller.ts # Endpoints REST
│   │   ├── [entity].service.ts    # Logique métier
│   │   └── [entity].module.ts     # Configuration NestJS
│   └── ...
└── app.module.ts                  # Configuration globale
```

### Patterns appliqués

#### Repository Pattern
```typescript
@Injectable()
export class EntityService {
  constructor(
    @InjectRepository(Entity) private repository: Repository<Entity>,
    private relatedService: RelatedService,
  ) {}
}
```

#### DTO Pattern
```typescript
// Entrée
export class CreateEntityDto {
  @IsEmail() email: string;
  @MinLength(8) field: string;
}

// Sortie
export class EntityResponseDto {
  @Expose() id: string;
  @Exclude() sensitiveField: string;
}
```

### Sécurité

#### Authentification
- Hachage bcrypt des mots de passe (12 rounds)
- Tokens JWT pour l'authentification
- Guards NestJS pour la protection des routes

#### Validation
- class-validator sur tous les DTOs
- Transformation automatique des données
- Exclusion des champs sensibles

#### Permissions
- **Pas de rôles globaux** : Simplicité et sécurité
- **Permissions granulaires au niveau board** : Contrôle fin des accès
- **Vérification d'ownership** : Utilisateur ne peut modifier que ses propres données
- **Isolation des données** par board et utilisateur

## Conventions API

### Endpoints REST

#### Ressources principales
```
POST   /[entity]           # Création
GET    /[entity]/:id       # Lecture
PUT    /[entity]/:id       # Mise à jour
DELETE /[entity]/:id       # Suppression (logique)
```

#### Ressources imbriquées
```
GET    /[parent]/:id/[child]     # Liste des enfants
POST   /[parent]/:id/[child]     # Création dans le parent
PUT    /[parent]/:id/[child]/:childId  # Mise à jour enfant
DELETE /[parent]/:id/[child]/:childId  # Suppression enfant
```

#### Recherche et filtrage
```
GET /[entity]/search?query=...
GET /[entity]?filter=...&page=...&limit=...
```

### Codes de réponse HTTP
- `200` : Succès avec données
- `201` : Création réussie
- `204` : Succès sans contenu
- `400` : Erreur de validation
- `401` : Non authentifié
- `403` : Non autorisé
- `404` : Ressource non trouvée
- `409` : Conflit (ex: email existant)
- `500` : Erreur serveur

### Gestion d'erreurs
```typescript
// Exceptions métier
throw new ConflictException('Resource already exists');
throw new NotFoundException('Resource not found');
throw new ForbiddenException('Insufficient permissions');
```

### Logging
```typescript
private readonly logger = new Logger(ServiceName.name);

this.logger.log('Operation started');
this.logger.error('Operation failed', error.stack);
```

## Configuration technique

### Base de données
- PostgreSQL avec TypeORM
- UUID pour toutes les clés primaires
- Soft delete via BaseEntity
- Relations chargées explicitement
- Index optimisés pour performance spatiale et JSONB

### TypeORM
```typescript
{
  type: 'postgres',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [...],
}
```

### Variables d'environnement
Configuration via fichier `.env` basé sur `.env.example` :
- Variables de base de données PostgreSQL
- Clé secrète JWT  
- Environnement d'exécution

### Intégration Microservice IA
- Communication REST directe avec Lambda AWS Python
- Authentification par API Key partagée
- Timeout configuré (30 secondes par défaut)
- Templates système pour analyses standardisées

## Tests et validation

### Stratégie
- Tests e2e avec base de données réelle
- Tests unitaires avec mocks pour services
- Validation de la compilation TypeScript
- Linting et formatage automatiques

### Configuration
- Jest pour l'exécution des tests
- Supertest pour les requêtes HTTP
- Base de données de test isolée

## Déploiement

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/main"]
```

### Production
- Images Docker multi-stage optimisées
- Variables d'environnement sécurisées
- Logs structurés pour monitoring

---

*Référence technique complète pour l'implémentation et la maintenance.*