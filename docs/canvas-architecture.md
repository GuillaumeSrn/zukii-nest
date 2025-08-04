# Architecture Canvas et Système d'Analyse IA

## 🎯 **Vue d'ensemble**

Ce document explique l'architecture technique du canvas HTML5 et du système d'analyse IA de Zukii, conçu pour être compréhensible par un nouveau développeur arrivant sur le projet.

## 🏗️ **Architecture Canvas HTML5**

### **Principe de Rendu**
Le canvas utilise une approche **"Option 1"** : tous les éléments (grille, blocks, superblocks) sont rendus directement sur le canvas HTML5 via le contexte 2D, contrairement à une approche DOM/CSS.

### **Composants Clés**

#### **1. Canvas Principal (`board.ts`)**
```typescript
// Dimensions du canvas
readonly canvasWidth = signal(6000);  // Largeur totale
readonly canvasHeight = signal(4000); // Hauteur totale

// Système de zoom et navigation
readonly zoomLevel = signal(1);
private canvasOffsetX = 0;
private canvasOffsetY = 0;
```

#### **2. Boucle de Rendu**
```typescript
private startRenderLoop(): void {
  const render = () => {
    this.renderCanvas();
    this.animationFrameId = requestAnimationFrame(render);
  };
  render();
}
```

#### **3. Rendu des Éléments**
- **Grille** : `drawGrid()` - Grille 200x50px avec points d'intersection
- **Blocks** : `drawBlocks()` - Rendu de tous les blocks standalone
- **SuperBlocks** : `drawSuperBlocks()` - Groupements visuels

### **Navigation et Interactions**

#### **Zoom et Pan**
- **Zoom** : Limite minimale 30% pour éviter les zones blanches
- **Pan** : Mouvement limité aux dimensions du canvas
- **Recentrage** : Bouton pour centrer le canvas

#### **Limites de Mouvement**
```typescript
// Calcul des limites basées sur la taille du canvas et du wrapper
const minOffsetX = -(this.canvasWidth() * this.zoomLevel() - wrapperWidth);
const maxOffsetX = 0;
const minOffsetY = -(this.canvasHeight() * this.zoomLevel() - wrapperHeight);
const maxOffsetY = 0;

// Application des limites
this.canvasOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, newOffsetX));
this.canvasOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, newOffsetY));
```

## 🧩 **Système de Positionnement Intelligent**

### **SmartPositioningService**
Service dédié au calcul de positions optimales pour éviter les chevauchements.

#### **Algorithme de Positionnement**
```typescript
getAnalysisPosition(existingBlocks: BlockPosition[]): Position {
  const centerX = 1500; // Centre de la grille 6000x4000
  const centerY = 1000;
  
  // Positions candidates autour du centre
  const positions = [
    { x: centerX, y: centerY },
    { x: centerX + this.gridSize, y: centerY },
    // ... autres positions
  ];
  
  // Vérification de disponibilité
  for (const pos of positions) {
    if (this.isPositionFree(pos.x, pos.y, existingBlocks)) {
      return { positionX: pos.x, positionY: pos.y, zIndex: this.getNextZIndex(existingBlocks) };
    }
  }
}
```

#### **Détection de Chevauchements**
```typescript
hasOverlaps(blocks: BlockPosition[]): boolean {
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      if (this.blocksOverlap(blocks[i], blocks[j])) {
        return true;
      }
    }
  }
  return false;
}
```

## 🔍 **Système d'Analyse IA**

### **Architecture Hybride**

#### **1. Endpoint Optimisé (`/boards/:id/full`)**
Retourne les informations minimales pour l'affichage initial :
```typescript
// Données minimales retournées
{
  id: string;
  title: string;
  status: string;
  linkedFileIds?: string[];
  createdAt: string;
  updatedAt: string;
}
```

#### **2. Endpoint Détaillé (`/analysis-content/:id/details`)**
Retourne les détails complets à la demande :
```typescript
// Données complètes retournées
{
  id: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: Record<string, unknown>;
  linkedFileIds?: string[];
  linkedFilesMetadata?: Array<{...}>;
  createdAt: string;
  updatedAt: string;
}
```

### **Cache Intelligent (AnalysisDetailsService)**

#### **Principe**
- Cache local pour éviter les requêtes répétées
- Gestion des états de chargement
- Invalidation automatique

#### **Interface**
```typescript
interface AnalysisDetails {
  id: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: Record<string, unknown>;
  linkedFileIds?: string[];
  linkedFilesMetadata?: Array<{...}>;
  createdAt: string;
  updatedAt: string;
}
```

#### **Méthodes Principales**
```typescript
// Récupération avec cache
getAnalysisDetails(analysisId: string): Observable<AnalysisDetails>

// Gestion du cache
updateCache(analysisId: string, details: AnalysisDetails): void
clearCache(analysisId: string): void
isCached(analysisId: string): boolean
```

## 🔄 **Flux d'Analyse Complet**

### **1. Création d'Analyse**
```typescript
// 1. Ouverture du dialog
const dialogRef = this.dialog.open(CreateAnalysisDialog, {
  data: { boardId, selectedFileIds }
});

// 2. Création du block d'analyse
dialogRef.afterClosed().subscribe(result => {
  if (result.success) {
    this.createAnalysisBlock(result);
  }
});
```

### **2. Création Immédiate du Block**
```typescript
private createAnalysisBlock(dialogResult: {...}): void {
  // 1. Créer le block d'analyse
  this.blockService.createBlock(boardId, blockData).subscribe({
    next: (analysisBlock) => {
      // 2. Démarrer le polling immédiatement
      this.analysisPollingService.startPolling(analysisBlock.contentId);
      
      // 3. Recharger les données après 1 seconde
      setTimeout(() => {
        this.boardService.getBoardFull(boardId).subscribe(/* ... */);
      }, 1000);
    }
  });
}
```

### **3. Polling Automatique**
```typescript
// AnalysisPollingService
startPolling(analysisContentId: string): void {
  // Polling toutes les 2 secondes
  interval(2000).pipe(
    switchMap(() => this.analysisService.getAnalysisStatus(analysisContentId)),
    takeWhile(status => status === 'pending' || status === 'processing'),
    finalize(() => this.stopPolling(analysisContentId))
  ).subscribe(/* ... */);
}
```

### **4. Affichage des Résultats**
```typescript
// Clic sur un block d'analyse
onAnalysisBlockClick(block: CanvasBlock): void {
  // 1. Trouver le block complet
  const fullBlock = boardFullData.blocks.find(b => b.id === block.id);
  
  // 2. Ouvrir le dialog avec les détails
  const dialogRef = this.dialog.open(AnalysisResultsDialog, {
    data: {
      boardId: this.board()?.id || '',
      blockId: block.id,
      analysisContentId: fullBlock.contentId,
      title: block.title || 'Résultats d\'analyse',
    },
  });
}
```

## 🎨 **Rendu des Blocks sur Canvas**

### **Types de Blocks Supportés**
1. **Text Content** : Blocs de texte
2. **File Content** : Fichiers uploadés
3. **Analysis** : Résultats d'analyses IA

### **Rendu Spécifique par Type**
```typescript
private drawBlock(ctx: CanvasRenderingContext2D, block: CanvasBlock): void {
  // Fond et bordure
  this.roundRect(ctx, x, y, width, height, 8);
  
  // Contenu selon le type
  switch (block.type) {
    case 'analysis':
      this.drawAnalysisContent(ctx, block, x, y, width, height);
      break;
    case 'text-content':
      this.drawTextContent(ctx, block, x, y, width, height);
      break;
    case 'file-content':
      this.drawFileContent(ctx, block, x, y, width, height);
      break;
  }
}
```

### **Rendu des Blocks d'Analyse**
```typescript
private drawAnalysisContent(ctx: CanvasRenderingContext2D, block: CanvasBlock, x: number, y: number, width: number, height: number): void {
  // Icône de statut
  const statusIcon = this.getStatusIcon(block.analysisStatus || 'pending');
  const statusColor = this.getStatusColor(block.analysisStatus || 'pending');
  
  // Titre et métadonnées
  const title = block.title || 'Analyse';
  const statusText = this.getStatusText(block.analysisStatus || 'pending');
  const fileCount = block.linkedFileCount || 0;
  
  // Dessin des éléments
  // ...
}
```

## 🔧 **Configuration et Optimisations**

### **Dimensions Recommandées**
- **Canvas** : 6000x4000px pour un espace de travail confortable
- **Grille** : 200x50px pour une navigation claire
- **Blocks** : 300x200px par défaut (responsive)

### **Limites de Performance**
- **Zoom minimum** : 30% pour éviter les zones blanches
- **Zoom maximum** : 300% pour la lisibilité
- **FPS** : 60fps avec requestAnimationFrame

### **Gestion Mémoire**
- **Cache** : Limité à 50 analyses en mémoire
- **Nettoyage** : Automatique lors du changement de board
- **Optimisation** : Rendu uniquement des blocks visibles

## 🚀 **Points d'Extension**

### **Futures Améliorations**
1. **Drag & Drop** : Déplacement des blocks sur le canvas
2. **Sélection Multiple** : Sélection de plusieurs blocks
3. **Relations Visuelles** : Lignes de connexion entre blocks
4. **Animations** : Transitions fluides entre les états
5. **Virtualisation** : Rendu optimisé pour gros boards

### **Architecture Scalable**
- **Modulaire** : Chaque composant est indépendant
- **Extensible** : Facile d'ajouter de nouveaux types de blocks
- **Performance** : Optimisé pour les gros datasets
- **Maintenable** : Code propre et documenté

---

*Document d'architecture - Version 1.0*  
*Canvas HTML5 + Système d'Analyse IA - Zukii* 