# Zukii NestJS API

API REST Zukii : Application collaborative d'analyse de données CSV.

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
   docker compose up --build
   ```

3. **Vérifier le fonctionnement**
   - API : http://localhost:3000
   - Base de données : localhost:5432
   
## 🚀 Installation et configuration

### Prérequis
- Node.js 20+
- Docker et Docker Compose
- PostgreSQL (via Docker)

### Installation
```bash
# Installation des dépendances
npm install

# Configuration de l'environnement
cp .env.example .env
# Modifier les variables selon vos besoins
```

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

#### Démarrage de PostgreSQL
```bash
# Démarrer PostgreSQL et Adminer
docker compose up -d db
docker compose --profile tools up -d adminer
```

#### Initialisation des données de référence
```bash
# ✅ Auto-seeding 
# Les statuts de référence sont automatiquement initialisés au démarrage
# si la table statuses est vide

# Aucune action manuelle requise - tout est automatique
```

#### Accès aux outils
- **Adminer** : http://localhost:8080
  - Serveur : `db`
  - Utilisateur : `zukii_user`
  - Mot de passe : `zukii_password`
  - Base : `zukii_db`

### Démarrage de l'application

```bash
# Développement avec hot-reload
npm run start:dev

# Production
npm run build
npm run start:prod
```

#### Accès aux services
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
- **Blocks** : `block-draft`, `block-active`, `block-archived`
- **Invitations** : `invitation-pending`, `invitation-accepted`, `invitation-declined`, `invitation-expired`

### Scripts disponibles

```bash
# Tests
npm run test              # Tests unitaires
npm run test:watch        # Tests en mode watch
npm run test:cov          # Tests avec couverture

# Code quality
npm run lint              # ESLint
npm run format            # Prettier
npm run lint:check        # Vérification sans correction
npm run format:check      # Vérification formatage

# Base de données (Auto-seeding)
# Aucune commande manuelle requise - seeding automatique au démarrage

# Docker
npm run docker:build     # Build de l'image Docker
```

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

# Adminer 
docker compose --profile tools up -d adminer # Accès à la base de données, 8080 par défaut
```

### Scripts NPM
```bash
npm run build                     # Compilation
npm run start:dev                 # Développement local (sans Docker)
npm run test:e2e                  # Tests d'intégration
npm run lint                      # Vérification code
npm run format                    # Formatage automatique
```

## 📊 État du projet

### ✅ Modules opérationnels
- **Users** : CRUD avec authentification bcrypt et gestion des statuts
- **Status** : États centralisés par catégorie
- **Auth** : JWT, Guards, protection des routes sensibles

### 📋 Roadmap
- **Boards** : Espaces collaboratifs avec membres et permissions granulaires
- **Blocks** : Contenu interactif (text, file, analysis) avec positionnement
- **Block Relations** : Liens entre blocks (generated_from, references, etc.)
- **Content Types** : TextContent, FileContent, AnalysisContent spécialisés
- **Invitations** : Système d'invitation avec tokens temporaires
- **🆕 Analysis Templates** : Templates préconfigurés pour IA (analyse prévisionnelle, extraction données, etc.)
- **🆕 Microservice IA** : Intégration Lambda AWS Python -> Microservice de traitement IA et processing des données

## 🏗️ Architecture

- **NestJS** : Framework, injection de dépendances
- **PostgreSQL** : Base de données relationnelle
- **TypeORM** : ORM avec soft delete
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
- **[`docs/architecture-technique.md`](docs/architecture-technique.md)** : Architecture détaillée
- **[`docs/database-schema.puml`](docs/database-schema.puml)** : Modèle de données
- **[`docs/ci-cd.md`](docs/ci-cd.md)** : Pipeline CI/CD
- **[`diagramme PlantUML`](https://www.plantuml.com/plantuml/svg/pLZlSkEs4V-kfzYg7oJDo8rxcPjsD6TFP1zznqQMNObAhlt2WSYLX9WaM02KfUJoFAsVGozM_145YXPhJv9hgnaFoSLlWSLl_s3XRuGaN1PfqlfTZ0kQ8GJ3gv7NpKYA_HX5r8Ce8KA05W0HqDR2Dhnx1zsW__kRcw7wzU3oyg1__srtquDtnUNctLU54zzOCTLYwiJ--qz67h64yS4yAL03pDTbgoMfJ11kMRpxbth627CYp3DcMRPxGW5dyFVYWT9MgmCN5nTmVJVnm1i7Vk1xKorfsUtC1F8-jFMZtOEVMg3Df75l0BEP_xu5nWvC2KsKwBlXvFhZSD9zy_Pj3sPZ_wyp3yPt0Ondev62vegEHyRZS4N4geQkm68gyeHiGqsSG_tn_BoAqhG8IMGXmeCrrU688v4OXqGE8F1llMamlBs7zzxDS3OA5F3xRa-XYZn-1Ih619-Xx49kSBwrHbZvpwqzVrUCy5WHQ9wd6JI-gj1HswWE6qvpILccblS-1NRpx353Nj_xgwYPa-XXoLcHnQ495xVqdtg7lNTKXEfVv_-DorjCvoOaArydUTKqp3McaQH2D36O8q-f48hoCC4r9WEL6hFRRcTDyR7JXmx6LEedYLEQTOxSzGEZsIkvgc_q2t9eyzIcfDflkVK-71Y2xpzw4wyoD_ZJ6lz-jgQIw41KzBkFNyA-gHZr4l0h-NVxf0VRGiaUCEjLoiYRFvygJLh3iLQpTPDJZg9ETxtM_0gl_LnMuQlHtVMtCFtRDF1keJl11OaaurJiddgLcdoLiEX1kS0yVs7ibpRFjwSgX9uubDiSI-8bRWpX2vgW8JuZoLPGKUN-P2LJqWxSCq6rDu2iCO8rIMXilACzlHyADmFmnu7tmPiSPeJhZvwYe-imS7a1Uawdjds5slQWzaXZkN8QfOk-FZylbGm2BYryXNIvai_nRnpUGag57qEQnRXvhd7-Sbdkm6JtjDWzSSmYXENkALFlz1y5mXgvW0GXOfd4hB1JsG_PD5V0LPMdsL8V7v2oc2veP3WNQZWXGePMM8dv_tsbjzbh0rVaoboYkuf39FShqL9vt_Qiue6IXB678jUQZgH-9QXxhgG5k97N5gGIgl9rEgtsyzbpk4huWl6KoAEKoHD2CvqhAU4FCNiqxokP9ftAAMj1loNpRcytD46tD_VLi3UTshMUgrwMnTVX0sxT-Dlpy_hul8WUK3QsRNOLGNzKgrpv7rIQr0SjXsw9O_MKfWxHs1WMUS98t5JTx6XeSx7qbXMgXD5UYbYQc_Wq9O_G1EEgqnpsopXkk2-kpdbLIQC3ovhy0ZySHP78KDb31l2NwTtugjuxie9761fdLEV73KQ5phWQTJbc9N6yoBBNSLWg7SqhQOg7sgb7E6SyJ548iaIRTByfuxPi77WJI7YqqdNZYCh-ivsNcZy8bit3Y6MwGXCDq6nD_V47KA4DtMw5wxFBJXNeApPwxk2VUADXuD-Df_eEDl5i8p2jd_aJJChsotqtTc3EbRRqDRK2al0boly4uljrZkhR4ZFaXk85PwdnFYxGd5vY7m2fhhtC5BuOELsNsEEKHaagmVYAziGEVlakkKvV7sfKzO-PQUwXxSpbVAMIEB566LfsfMDeRVLAnPYQi5HXOL-QR-gH8cx9kBrSgw63e0zQKhR62bqED9PYZQyEldXffI8aaQHhNVhlxaRUS7pmMJ2PUV-zzkD4rjrF_F6rVpySUJRfPW8vVFvyTiP-0dFHh4lAgsVBlByuu6vBDGNjoyFSJjAoZYo56k14RgcwpEhMDtTzDmvKpfgD6OZ1V_uCbNu71j1stPBgWrUOWGxg2wb0lVQnecucNbJK1qXTiNQGDIkN5LXDKAMdldBbf6-tgcCMVcgzu-Ej_K85TfmvZbtXrVFL4hZz0hoMn6sxkoQqguEbeJhBF6Naf_kHVwqi_cuViHcJ2DnSHjZ2JgHpNbz7WEMIfleMAM2WX6Tmr68FG5-hSyObgDi6foWCvhYR7i3kIL-HpVyt1AH58ccUA2XcCUYrMpKBQiohAQTIsKIM2FS9aydsAtzehNdUaS2-UO3kafDyfIz1eWyeep_qZ8BTbUrTSaK_S8nMoDMV0AL0u_qM0avs_oHpcb2vUxBNg0MDLXGvMAyrMc_pgYJGsAEl6sWjRYoRUcnoiCNnlhV7smp0TX2guHJ8zS5eIsAdvqpvHhqLQV9l)** : Diagramme plantUML

## 🤝 Contribution

1. Créer une branche : `git checkout -b feature/ma-fonctionnalite`
2. Développer avec tests unitaires obligatoires
3. Valider : `npm run lint && npm run format && npm run test:e2e`
4. Commit : `git commit -m "feat: description"`
5. Push et créer une PR

## ⚡ Hot Reload

Modifications automatiquement reflétées grâce au volume mapping du dossier `src/`.

---

*Projet Zukii - Analyse collaborative de données CSV avec IA*
