# Zukii NestJS API

API REST Zukii : Application collaborative d'analyse de données CSV.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 20+
- PostgreSQL (via conteneurisation gérée par infra/)

### Installation et développement local

1. **Installation des dépendances**
   ```bash
   cd zukii-nest
   npm install
   ```

2. **Configuration locale**
   ```bash
   cp .env.example .env
   # Éditer .env pour développement local
   ```

3. **Démarrage en mode développement**
   ```bash
   npm run start:dev
   ```

**Note** : La conteneurisation complète est gérée dans le dossier `infra/`.
Voir la [documentation infra](../infra/README.md) pour Docker Compose.
   
## ⚙️ Configuration

#### Variables d'environnement requises
```env
# === DATABASE ===
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=zukii_user
DB_PASSWORD=zukii_password
DB_DATABASE=zukii_db

# === JWT ===
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# === APPLICATION ===
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# === MICROSERVICE IA ===
MICROSERVICE_API_KEY=your_secure_random_key_here_change_in_production
MICROSERVICE_URL=https://your-lambda-url.execute-api.region.amazonaws.com/prod
MICROSERVICE_TIMEOUT=30000

# === TESTS ===
TEST_USER_PASSWORD=MotDePasse123!
```

### Base de données

**Auto-seeding automatique** : Les statuts de référence sont initialisés automatiquement au démarrage si la table est vide.

**Conteneurisation** : La base de données est gérée par la conteneurisation dans `infra/`. 
Voir [documentation Docker](../infra/docs/docker-setup.md) pour le démarrage complet.

### Scripts de développement

```bash
# Développement avec hot-reload
npm run start:dev

# Build de production
npm run build
npm run start:prod

# Tests
npm run test              # Tests unitaires (118 tests)
npm run test:watch        # Tests en mode watch
npm run test:cov          # Tests avec couverture

# Qualité du code
npm run lint              # ESLint
npm run format            # Prettier
```

#### URLs de développement
- **API** : http://localhost:3000
- **Documentation Swagger** : http://localhost:3000/api

### Données de référence

Le projet utilise un système de statuts centralisé pour gérer les états des différentes entités :

```typescript
// Exemples d'utilisation
import { UserStatus, BoardStatus } from './modules/status/enums/status.enum';

// Dans le code
user.statusId = UserStatus.ACTIVE;
board.statusId = BoardStatus.ARCHIVED;
```

**Statuts disponibles :**
- **Users** : `user-active`, `user-inactive`
- **Boards** : `board-active`, `board-archived`
- **BoardMembers** : `board-member-active`, `board-member-inactive` ✅ *Implémenté*
- **Blocks** : `block-draft`, `block-active`, `block-archived` *Future*
- **Invitations** : `invitation-pending`, `invitation-accepted`, `invitation-declined`, `invitation-expired` *Future*

## 🛠️ Développement

### Workflow de développement
1. **Démarrer l'environnement complet** : Voir [infra/README.md](../infra/README.md)
2. **Développement backend seul** : `npm run start:dev` dans ce dossier
3. **Tests** : `npm run test` ou `npm run test:watch`
4. **Linting** : `npm run lint && npm run format`

## 📊 État du projet

**✅ 141/141 tests unitaires passants**
**✅ 31 tests CRITICAL pour développement focalisé**

### ✅ Modules opérationnels
- **Users** : CRUD avec authentification bcrypt et gestion des statuts
- **Status** : États centralisés par catégorie avec auto-seeding
- **Auth** : JWT, Guards, protection des routes sensibles
- **Boards** : CRUD complet, validation ownership, suppression cascade
- **BoardMembers** : Collaboration opérationnelle avec permissions granulaires (view, edit, admin)
- **SuperBlocks** : Groupes visuels de blocks avec ordre d'affichage et couleurs
- **Blocks** : Système de contenu positionné avec types (TEXT, FILE, ANALYSIS)
- **BlockRelations** : Relations entre blocks (generated_from, comment_on, references, derived_from)
- **TextContent** : Contenu textuel avec formats (plain, markdown, html)
- **FileContent** : Upload et stockage de fichiers en base64 avec métadonnées

### 🔒 Sécurité
- **Hachage bcrypt** : Mots de passe avec 12 rounds de sel
- **JWT Strategy** : Tokens sécurisés pour authentification
- **JWT Guard Global** : Protection automatique de TOUTES les routes
- **DTOs class-validator** : Validation stricte de toutes les entrées
- **SecurityInterceptor global** : Protection XSS, limites payload
- **Conformité OWASP Top 10** : Protection contre les 10 vulnérabilités critiques

### 🔄 Système de statuts centralisé

Le backend utilise un système de statuts centralisé pour gérer les états des différentes entités :

```typescript
// Exemples d'utilisation
import { UserStatus, BoardStatus } from './modules/status/enums/status.enum';

// Dans le code
user.statusId = UserStatus.ACTIVE;
board.statusId = BoardStatus.ARCHIVED;
```

**Statuts disponibles :**
- **Users** : `user-active`, `user-inactive`
- **Boards** : `board-active`, `board-archived`
- **BoardMembers** : `board-member-active`, `board-member-inactive` ✅ *Implémenté*
- **Blocks** : `block-active` ✅ *Implémenté*

### 🏗️ Architecture
- **Suppression cascade** avec gestion automatique Board → Blocks → Content + Relations
- **Base Entity** : Héritage cohérent avec timestamps
- **Interfaces centralisées** : JwtUser, test mocks typés
- **Séparation permissions/statuts** : Architecture claire et maintenable
- **Organisation modulaire** : SuperBlocks pour groupement visuel, BlockRelations pour traçabilité

**Détails complets** : [`docs/architecture-technique.md`](docs/architecture-technique.md)

### 📋 Roadmap (modules à implémenter)
- **AnalysisContent** : Résultats d'analyse IA avec stockage JSONB
- **Microservice Python** : Service d'analyse CSV avec OpenAI
- **Intégration NestJS ↔ Python** : Communication entre services
- **Invitations** : Système d'invitation avec tokens temporaires (entité prête)

### 🧪 Stratégie de tests MVP
- **Focus business-critical** : Tests prioritaires sur fonctionnalités essentielles
- **TDD pragmatique** : Red-Green-Refactor sur les flux critiques uniquement
- **Sécurité 100%** : Authentification, permissions, validation obligatoirement testées
- **Détails** : [`.cursor/rules/test-strategy-mvp.mdc`](.cursor/rules/test-strategy-mvp.mdc)

### 🎯 Fonctionnalités de collaboration actuelles
- **Gestion des membres** : Ajout/suppression de membres aux boards
- **Permissions granulaires** : view (consultation), edit (modification), admin (gestion membres)
- **Validation ownership** : Seuls les propriétaires et admins peuvent gérer les membres
- **Protection des accès** : Vérification des permissions sur chaque action
- **🆕 Analysis Templates** : Templates préconfigurés pour IA (analyse prévisionnelle, extraction données, etc.)
- **🆕 Microservice IA** : Intégration Lambda AWS Python -> Microservice de traitement IA et processing des données

## 🏗️ Architecture

- **NestJS** : Framework, injection de dépendances
- **PostgreSQL** : Base de données relationnelle
- **TypeORM** : ORM avec gestion des relations
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
- **[`docs/DEVELOPMENT_GUIDE.md`](docs/DEVELOPMENT_GUIDE.md)** : Guide de développement complet
- **[`docs/architecture-technique.md`](docs/architecture-technique.md)** : Architecture détaillée
- **[`docs/database-schema.puml`](docs/database-schema.puml)** : Modèle de données
- **[`docs/ci-cd.md`](docs/ci-cd.md)** : Pipeline CI/CD
- **[`diagramme PlantUML`](https://www.plantuml.com/plantuml/svg/pLZlSkEs4V-kfzYg7oJDo8rxcPjsD6TFP1zznqQMNObAhlt2WSYLX9WaM02KfUJoFAsVGozM_145YXPhJv9hgnaFoSLlWSLl_s3XRuGaN1PfqlfTZ0kQ8GJ3gv7NpKYA_HX5r8Ce8KA05W0HqDR2Dhnx1zsW__kRcw7wzU3oyg1__srtquDtnUNctLU54zzOCTLYwiJ--qz67h64yS4yAL03pDTbgoMfJ11kMRpxbth627CYp3DcMRPxGW5dyFVYWT9MgmCN5nTmVJVnm1i7Vk1xKorfsUtC1F8-jFMZtOEVMg3Df75l0BEP_xu5nWvC2KsKwBlXvFhZSD9zy_Pj3sPZ_wyp3yPt0Ondev62vegEHyRZS4N4geQkm68gyeHiGqsSG_tn_BoAqhG8IMGXmeCrrU688v4OXqGE8F1llMamlBs7zzxDS3OA5F3xRa-XYZn-1Ih619-Xx49kSBwrHbZvpwqzVrUCy5WHQ9wd6JI-gj1HswWE6qvpILccblS-1NRpx353Nj_xgwYPa-XXoLcHnQ495xVqdtg7lNTKXEfVv_-DorjCvoOaArydUTKqp3McaQH2D36O8q-f48hoCC4r9WEL6hFRRcTDyR7JXmx6LEedYLEQTOxSzGEZsIkvgc_q2t9eyzIcfDflkVK-71Y2xpzw4wyoD_ZJ6lz-jgQIw41KzBkFNyA-gHZr4l0h-NVxf0VRGiaUCEjLoiYRFvygJLh3iLQpTPDJZg9ETxtM_0gl_LnMuQlHtVMtCFtRDF1keJl11OaaurJiddgLcdoLiEX1kS0yVs7ibpRFjwSgX9uubDiSI-8bRWpX2vgW8JuZoLPGKUN-P2LJqWxSCq6rDu2iCO8rIMXilACzlHyADmFmnu7tmPiSPeJhZvwYe-imS7a1Uawdjds5slQWzaXZkN8QfOk-FZylbGm2BYryXNIvai_nRnpUGag57qEQnRXvhd7-Sbdkm6JtjDWzSSmYXENkALFlz1y5mXgvW0GXOfd4hB1JsG_PD5V0LPMdsL8V7v2oc2veP3WNQZWXGePMM8dv_tsbjzbh0rVaoboYkuf39FShqL9vt_Qiue6IXB678jUQZgH-9QXxhgG5k97N5gGIgl9rEgtsyzbpk4huWl6KoAEKoHD2CvqhAU4FCNiqxokP9ftAAMj1loNpRcytD46tD_VLi3UTshMUgrwMnTVX0sxT-Dlpy_hul8WUK3QsRNOLGNzKgrpv7rIQr0SjXsw9O_MKfWxHs1WMUS98t5JTx6XeSx7qbXMgXD5UYbYQc_Wq9O_G1EEgqnpsopXkk2-kpdbLIQC3ovhy0ZySHP78KDb31l2NwTtugjuxie9761fdLEV73KQ5phWQTJbc9N6yoBBNSLWg7SqhQOg7sgb7E6SyJ548iaIRTByfuxPi77WJI7YqqdNZYCh-ivsNcZy8bit3Y6MwGXCDq6nD_V47KA4DtMw5wxFBJXNeApPwxk2VUADXuD-Df_eEDl5i8p2jd_aJJChsotqtTc3EbRRqDRK2al0boly4uljrZkhR4ZFaXk85PwdnFYxGd5vY7m2fhhtC5BuOELsNsEEKHaagmVYAziGEVlakkKvV7sfKzO-PQUwXxSpbVAMIEB566LfsfMDeRVLAnPYQi5HXOL-QR-gH8cx9kBrSgw63e0zQKhR62bqED9PYZQyEldXffI8aaQHhNVhlxaRUS7pmMJ2PUV-zzkD4rjrF_F6rVpySUJRfPW8vVFvyTiP-0dFHh4lAgsVBlByuu6vBDGNjoyFSJjAoZYo56k14RgcwpEhMDtTzDmvKpfgD6OZ1V_uCbNu71j1stPBgWrUOWGxg2wb0lVQnecucNbJK1qXTiNQGDIkN5LXDKAMdldBbf6-tgcCMVcgzu-Ej_K85TfmvZbtXrVFL4hZz0hoMn6sxkoQqguEbeJhBF6Naf_kHVwqi_cuViHcJ2DnSHjZ2JgHpNbz7WEMIfleMAM2WX6Tmr68FG5-hSyObgDi6foWCvhYR7i3kIL-HpVyt1AH58ccUA2XcCUYrMpKBQiohAQTIsKIM2FS9aydsAtzehNdUaS2-UO3kafDyfIz1eWyeep_qZ8BTbUrTSaK_S8nMoDMV0AL0u_qM0avs_oHpcb2vUxBNg0MDLXGvMAyrMc_pgYJGsAEl6sWjRYoRUcnoiCNnlhV7smp0TX2guHJ8zS5eIsAdvqpvHhqLQV9l)** : Diagramme plantUML

## 🤝 Contribution

1. Créer une branche : `git checkout -b feature/ma-fonctionnalite`
2. Développer avec tests unitaires obligatoires
3. Valider : `npm run lint && npm run format && npm run test`
4. Commit : `git commit -m "feat: description"`
5. Push et créer une PR

## ⚡ Hot Reload

Modifications automatiquement reflétées grâce au volume mapping du dossier `src/`.

---

*Projet Zukii - Analyse collaborative de données CSV avec IA*
