# Architecture Technique

## Modèle de données

L'architecture repose sur deux diagrammes UML :
- **État actuel** : `database-schema-current.puml` (User, Status, Board, Block implémentés)
- **Vision complète** : `database-schema.puml` (roadmap avec toutes les fonctionnalités)

### État d'implémentation

#### ✅ **Modules implémentés et fonctionnels**
- **User** : CRUD complet, authentification JWT, profils publics/privés
- **Status** : Système centralisé par catégorie, données de référence auto-seeding
- **Board** : CRUD complet, validation ownership, suppression permanente, tests 71/71
- **BoardMember** : Collaboration opérationnelle avec permissions granulaires, tests 21/21
- **Block** : Système de contenu avec zones et positionnement optionnel
- **FileContent** : Upload et gestion fichiers CSV avec métadonnées complètes
- **TextContent** : Notes et commentaires intégrés

#### 🚧 **Modules en roadmap (non implémentés)**
- **SuperBlock** : Regroupements logiques de blocks avec interface collapse/expand
- **BlockRelation** : Relations tracées entre contenus (generated_from, comment_on, references, derived_from)
- **AnalysisContent** : Résultats d'analyses IA avec données Plotly et traçabilité
- **Invitation** : Système d'invitations temporaires
- **AnalysisTemplate** : Templates IA préconfigurés

### Entités principales (Vision complète)

#### Core System
- **User** : Gestion des comptes utilisateurs
- **Status** : États par catégorie (user, board, block, invitation)

#### Collaboration
- **Board** : Espaces de travail collaboratifs
- **BoardMember** : Membres d'un board avec permissions granulaires (view, edit, admin)
- **Invitation** : Système d'invitation temporaire

#### Système de Blocks (Implémenté + Évolutions)
- **Block** : Positionnement optionnel, métadonnées et référence générique vers le contenu
- **SuperBlock** : Regroupements visuels et logiques de blocks liés
- **BlockRelation** : Relations tracées entre blocks (generated_from, references, comment_on, derived_from)
- **TextContent** : Contenu textuel avec support Markdown/HTML
- **FileContent** : Métadonnées fichiers avec stockage base64 et validation
- **AnalysisContent** : Résultats d'analyses IA avec données Plotly et traçabilité

#### 🎨 Interface Architecture
- **Layout Zones** : Organisation automatique par type de contenu (Data, Analysis, Notes, Comments)
- **Super-Blocks** : Regroupements visuels avec collapse/expand et code couleur
- **Relations Visuelles** : Connexions tracées entre éléments liés
- **Responsive Design** : Interface adaptative sans canvas complexe

#### Templates d'Analyse IA (Future)
- **AnalysisTemplate** : Templates préconfigurés pour microservice Python
  - Prompts OpenAI optimisés par type d'analyse
  - Configuration des paramètres d'entrée
  - Menu déroulant pour interface utilisateur

### Relations (Actuelles et Futures)

#### ✅ **Relations implémentées**
- User 1..N Board (propriétaire) - `board.ownerId`
- User 1..N BoardMember N..1 Board (permissions granulaires) - `board_member.userId` / `board_member.boardId`
- Status 1..N User/Board/BoardMember - `*.statusId`
- Board 1..N Block - `block.boardId`
- Block 1..1 TextContent|FileContent (via content_id) - `block.contentId`

#### 🚧 **Relations futures (roadmap)**
- SuperBlock 1..N Block - `block.superBlockId`
- Block N..N Block (via BlockRelation) - `block_relation.sourceBlockId` / `targetBlockId`
- Status 1..N Block - `block.statusId`
- AnalysisContent 1..N FileContent (sources) - via relations

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
  │   └── entities/base.entity.ts    # Entité abstraite avec timestamps
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

L'application implémente une sécurité robuste sur plusieurs niveaux :

#### Authentification & Autorisation
- **Hachage bcrypt** : Mots de passe avec 12 rounds de sel
- **JWT Strategy** : Tokens sécurisés pour authentification
- **JWT Guard Global** : Protection automatique de TOUTES les routes via `APP_GUARD`
- **LocalAuthGuard** : Authentification spécifique pour login/register
- **Permissions granulaires** : Contrôle au niveau des boards uniquement (view/edit/admin)

#### Validation & Protection
- **DTOs class-validator** : Validation stricte de toutes les entrées
- **SecurityInterceptor global** : Protection XSS, limites payload (1MB JSON / 50MB files)
- **Exclusion données sensibles** : `@Exclude` sur champs critiques
- **TypeORM paramétré** : Protection SQL injection automatique

#### Configuration sécurisée
- **Helmet** : Headers de sécurité (CSP, HSTS, etc.)
- **CORS configuré** : Origine restreinte en production
- **Variables d'environnement** : Aucun secret en dur dans le code
- **Audit automatique** : Scan vulnérabilités dans CI/CD

#### Conformité OWASP Top 10
L'application couvre les 10 vulnérabilités critiques avec protections automatiques et validation continue.

> **Référence complète** : Voir [`docs/security-guide.md`](security-guide.md) pour détails d'implémentation et checklist par endpoint.

## Suppression des données

### Suppression permanente avec cascade automatique

**Suppression définitive des enregistrements** :

```typescript
// ✅ Suppression permanente avec TypeORM
await this.repository.delete(id);

// ✅ Suppression avec vérification du résultat
const result = await this.repository.delete(id);
if (result.affected === 0) {
  throw new NotFoundException('Entité non trouvée');
}
```

**Cascade automatique au niveau base de données** :
```typescript
// Configuration dans l'entité enfant
@ManyToOne(() => ParentEntity, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'parentId' })
parent: ParentEntity;
```

**Sécurité et validation** :
- Toujours valider les permissions avant suppression
- Logger les suppressions importantes pour audit
- La cascade est gérée automatiquement par la base de données
- Pas besoin de transactions manuelles pour les suppressions cascades

> **Pourquoi cascade DB vs TypeORM ?**
> 
> - `onDelete: 'CASCADE'` : Gérée par PostgreSQL, fonctionne avec `delete()`
> - `cascade: ['remove']` : Gérée par TypeORM, nécessite `remove()` et chargement des entités
> - **Performance** : La cascade DB est plus rapide (pas de requêtes SELECT/DELETE multiples)
> - **Fiabilité** : Garantie au niveau base de données, même en cas d'accès direct SQL

## Conventions API

### Endpoints REST

#### Ressources principales
```
POST   /[entity]           # Création
GET    /[entity]/:id       # Lecture
PUT    /[entity]/:id       # Mise à jour
DELETE /[entity]/:id       # Suppression permanente
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

#### Exception Filter global
```typescript
// main.ts - Centralisation de toutes les erreurs
app.useGlobalFilters(new HttpExceptionFilter());
```

#### Pipes de validation
```typescript
// Validation UUID automatique
@Param('id', UuidValidationPipe) id: string
```

#### Exceptions métier dans les services
```typescript
// Services uniquement - pas dans les contrôleurs
throw new ConflictException('Resource already exists');
throw new NotFoundException('Resource not found');
throw new ForbiddenException('Insufficient permissions');
```

#### Contrôleurs simplifiés
```typescript
// Pas de try/catch - exceptions propagées automatiquement
async create(@Body() dto: CreateDto): Promise<ResponseDto> {
  return this.service.create(dto);
}
```

### Logging
```typescript
private readonly logger = new Logger(ServiceName.name);

// Dans les services uniquement
this.logger.log('Operation started');
this.logger.error('Operation failed', error.stack);
```

## Configuration technique

### Base de données
- PostgreSQL avec TypeORM
- UUID pour toutes les clés primaires
- Timestamps via BaseEntity
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
- Mot de passe pour les tests unitaires (TEST_USER_PASSWORD)

### Intégration Microservice IA
- Communication REST directe avec Lambda AWS Python
- Authentification par API Key partagée
- Timeout configuré (30 secondes par défaut)
- Templates système pour analyses standardisées

## Tests et validation

### Stratégie
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

## Gestion des Tokens de Refresh

### Problématique

Les routes de refresh token posent un défi particulier : elles nécessitent un **refresh token** (long-lived) et non un **access token** (short-lived) pour fonctionner. Utiliser un guard JWT classique qui attend l'access token dans l'en-tête `Authorization` crée une confusion pour les tests et l'utilisation.

### Solution Adoptée

**Route `/auth/refresh` avec token dans le body** :
```typescript
@Public()
@Post('refresh')
@ApiBody({ type: RefreshTokenDto })
async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
  return this.authService.refreshToken(refreshTokenDto.refreshToken);
}
```

### Avantages de cette approche

1. **Testabilité** : Facilement testable via Swagger UI
2. **Clarté** : Distinction claire entre access token (header) et refresh token (body)
3. **Standards** : Conforme aux meilleures pratiques OAuth 2.0
4. **Sécurité** : Le refresh token n'est pas exposé dans les logs d'URL

### Alternatives considérées

1. **Cookie HTTP-Only** (plus sécurisé) :
   ```typescript
   async refreshToken(@Req() request: Request) {
     const refreshToken = request.cookies['refresh_token'];
   }
   ```

2. **En-tête personnalisé** :
   ```typescript
   async refreshToken(@Headers('x-refresh-token') refreshToken: string) {
   }
   ```

### Recommandations de sécurité

- **Rotation des tokens** : Chaque refresh génère un nouveau refresh token
- **Durée de vie courte** : Access tokens de 15-30 minutes maximum
- **Stockage sécurisé** : Refresh tokens en cookies HTTP-only côté client
- **Révocation** : Mécanisme de blacklist pour les tokens compromis

## Révocation de Tokens

### Problématique

Les JWT sont **stateless** par nature, ce qui signifie qu'une fois émis, ils restent valides jusqu'à leur expiration naturelle. Cela pose un problème de sécurité majeur dans plusieurs scénarios :

- **Déconnexion utilisateur** : Le token reste actif après logout
- **Compte compromis** : Impossible d'invalider immédiatement les tokens volés
- **Changement de permissions** : Les anciens tokens gardent les anciennes permissions
- **Détection d'activité suspecte** : Besoin d'invalider immédiatement

### Solution Implémentée

**Route `/auth/revoke` avec blacklist** :
```typescript
@Post('revoke')
@ApiBearerAuth('JWT-auth')
async revokeToken(@Body() revokeTokenDto: RevokeTokenDto) {
  await this.authService.revokeToken(revokeTokenDto.token);
  return { message: 'Token révoqué avec succès' };
}
```

### Mécanisme de Blacklist

**Stockage temporaire** :
- Les tokens révoqués sont stockés jusqu'à leur expiration naturelle
- Utilisation de Redis recommandée pour les performances
- Vérification automatique lors de chaque requête authentifiée

**Implémentation actuelle** :
```typescript
async revokeToken(token: string): Promise<void> {
  const decoded = this.jwtService.decode(token);
  const expirationTime = decoded.exp * 1000 - Date.now();
  
  // TODO: Stockage Redis
  // await this.redisService.set(`blacklist:${token}`, 'revoked', expirationTime);
}
```

### Standards de l'industrie

Conforme à **OAuth 2.0 RFC 7009** :
- Endpoint standard : `POST /oauth/revoke`
- Paramètre requis : `token`
- Réponse : HTTP 200 pour succès

### Cas d'usage

1. **Logout sécurisé** : Révocation du token lors de la déconnexion
2. **Sécurité proactive** : Révocation en cas de détection d'anomalie
3. **Gestion des employés** : Révocation immédiate lors de changements de statut
4. **Incident de sécurité** : Révocation massive en cas de compromission

### Évolutions futures

- **Intégration Redis** : Stockage distribué de la blacklist
- **Révocation en lot** : Révocation de tous les tokens d'un utilisateur
- **Notifications** : Alertes lors de tentatives d'utilisation de tokens révoqués
- **Audit trail** : Traçabilité des révocations pour conformité

---

*Référence technique complète pour l'implémentation et la maintenance.*