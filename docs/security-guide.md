# Guide de Sécurité

## Vue d'ensemble

L'application implémente des protections robustes contre les vulnérabilités web les plus critiques, en suivant les recommandations OWASP Top 10.

## Protection globale automatique

### SecurityInterceptor

```typescript
@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  // Limites intelligentes selon Content-Type
  private readonly MAX_JSON_SIZE = 1024 * 1024; // 1MB pour JSON
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB pour uploads
  
  // Détection automatique patterns XSS
  private readonly DANGEROUS_PATTERNS = [
    /<script/gi, /<iframe/gi, /javascript:/gi, /vbscript:/gi
  ];
  
  // Validation headers suspects
  // Logging tentatives d'attaque
}
```

### Configuration globale (main.ts)

```typescript
// Headers sécurisés avec Helmet
app.use(helmet({
  contentSecurityPolicy: true,
  hsts: { maxAge: 31536000 }
}));

// CORS configuré
app.enableCors({
  origin: process.env.FRONTEND_URL || false,
  credentials: true
});

// ValidationPipe global avec protection
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // Supprime propriétés non autorisées
  forbidNonWhitelisted: true,   // Rejette surplus
  transform: true               // Transformation sécurisée
}));
```

## OWASP Top 10 - Protections détaillées

### A01 - Broken Access Control

**Problème** : Accès non autorisé aux ressources

**Protections implémentées** :
```typescript
// JWT Guards sur routes sensibles
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')

// Validation ownership dans services
if (req.user.id !== resourceOwnerId) {
  throw new ForbiddenException('Accès non autorisé');
}

// Permissions granulaires par board
enum BoardPermission { VIEW, EDIT, ADMIN }
```

### A02 - Cryptographic Failures

**Problème** : Données sensibles exposées ou mal chiffrées

**Protections implémentées** :
```typescript
// Exclusion données sensibles
@Exclude() passwordHash: string;
@Exclude() deletedAt?: Date;
@Exclude() statusId?: string;

// Hachage sécurisé bcrypt
const saltRounds = 12; // Coût élevé
const passwordHash = await bcrypt.hash(password, saltRounds);

// JWT avec secret fort
JWT_SECRET=your_secure_random_key_here_change_in_production
```

### A03 - Injection

**Problème** : SQL injection, XSS, injection de commandes

**Protections implémentées** :
```typescript
// DTOs avec validation stricte
@IsEmail() @IsNotEmpty() email: string;
@MinLength(8) @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) password: string;

// TypeORM requêtes paramétrées (protection SQL injection automatique)
const user = await repository.findOne({ where: { email } });

// Sanitisation XSS automatique via SecurityInterceptor
const sanitized = value.replace(/<script.*?>/gi, '');
```

### A04 - Insecure Design

**Problème** : Conception vulnérable par design

**Protections implémentées** :
- Architecture modulaire NestJS avec séparation responsabilités
- Principes SOLID appliqués systématiquement
- Isolation données par board et utilisateur
- Pas de rôles globaux : simplicité et sécurité
- Permissions granulaires au niveau approprié

### A05 - Security Misconfiguration

**Problème** : Configuration insécurisée par défaut

**Protections implémentées** :
```typescript
// Variables d'environnement pour tous les secrets
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your_secret_key_here
MICROSERVICE_API_KEY=your_secure_random_key

// Headers sécurisés par défaut
Content-Security-Policy, X-Frame-Options, X-Content-Type-Options

// Désactivation features dangereuses en production
synchronize: process.env.NODE_ENV !== 'production'
```

### A06 - Vulnerable and Outdated Components

**Problème** : Dépendances vulnérables

**Protections implémentées** :
- Audit npm automatique dans CI/CD
- Dépendances maintenues à jour
- Scan sécurité sur chaque push
- Monitoring Dependabot GitHub

### A07 - Identification and Authentication Failures

**Problème** : Authentification faible ou cassée

**Protections implémentées** :
```typescript
// Strategy JWT robuste
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  validate(payload: any): Promise<User> {
    return this.usersService.findById(payload.sub);
  }
}

// Validation stricte credentials
const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

// Regex mot de passe fort obligatoire
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
```

### A08 - Software and Data Integrity Failures

**Problème** : Données corrompues ou code non vérifié

**Protections implémentées** :
```typescript
// Validation stricte toutes entrées
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // Supprime propriétés non définies
  forbidNonWhitelisted: true,   // Rejette propriétés inconnues
  transform: true               // Transformation contrôlée
}));

// DTOs typés strictement
export class CreateBoardDto {
  @IsString() @MinLength(3) @MaxLength(200) title: string;
  @IsOptional() @MaxLength(1000) description?: string;
}
```

### A09 - Security Logging and Monitoring Failures

**Problème** : Manque de visibilité sur les attaques

**Protections implémentées** :
```typescript
// Logger NestJS sur toutes opérations critiques
private readonly logger = new Logger(ServiceName.name);

// Logging events sécurité
this.logger.log(`Connexion réussie: ${user.email}`);
this.logger.warn(`Tentative accès non autorisé: ${req.user.id}`);
this.logger.error(`Erreur critique: ${error.message}`, error.stack);

// SecurityInterceptor log tentatives attaque
this.logger.warn(`User-Agent suspect détecté: ${userAgent}`);
this.logger.warn(`Pattern malveillant détecté: ${pattern}`);
```

### A10 - Server-Side Request Forgery (SSRF)

**Problème** : Requêtes forgées vers services internes

**Protections implémentées** :
- Validation stricte des URLs externes
- Pas d'appels HTTP non contrôlés
- Microservice IA via API Key authentifiée
- Timeout configuré (30s max)
- Whitelist des domaines autorisés

## Checklist de sécurité par endpoint

Avant de déployer un nouvel endpoint, vérifier :

- [ ] **JWT Guard** sur routes sensibles
- [ ] **DTO validation** avec class-validator
- [ ] **Ownership verification** si applicable
- [ ] **Données sensibles exclues** avec @Exclude
- [ ] **Logging approprié** des opérations
- [ ] **Tests sécurité** couvrant cas limites
- [ ] **Variables d'env** pour secrets
- [ ] **Gestion d'erreurs** sans fuite d'info

## Outils et monitoring

### CI/CD
- `npm audit` automatique sur chaque push
- Tests sécurité dans pipeline
- Scan Dependabot pour vulnérabilités

### Développement
- ESLint avec règles sécurité
- Rules Cursor avec checklist OWASP
- SecurityInterceptor en développement

### Production
- Logs centralisés avec alertes
- Monitoring tentatives d'attaque
- Headers sécurisés par défaut

---

*Guide complet pour maintenir la sécurité de l'application* 