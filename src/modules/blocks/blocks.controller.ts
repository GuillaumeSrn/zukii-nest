import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  HttpStatus,
  HttpCode,
  Logger,
  UseInterceptors,
  ClassSerializerInterceptor,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiProperty,
} from '@nestjs/swagger';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto, UpdateBlockPositionDto } from './dto/update-block.dto';
import { BlockResponseDto } from './dto/block-response.dto';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { TextContentService } from '../text-content/text-content.service';
import { FileContentService } from '../file-content/file-content.service';
import { BlockRelationsService } from '../block-relations/block-relations.service';
import { CreateTextContentDto } from '../text-content/dto/create-text-content.dto';
import {
  CreateBlockRelationDto,
  CreateBlockRelationFromUrlDto,
} from '../block-relations/dto/create-block-relation.dto';
import { BlockRelationResponseDto } from '../block-relations/dto/block-relation-response.dto';
import { BlockType } from './enums/block.enum';
import { TextContentFormat } from '../text-content/enums/text-content.enum';
import { IsOptional, IsString, IsInt, Min, IsUUID } from 'class-validator';

// DTO pour créer un block avec du texte
export class CreateTextBlockDto {
  @ApiProperty({
    description: 'Titre du block',
    example: 'Ma note',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  title?: string;

  @ApiProperty({
    description: 'Position X (optionnel)',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'La position X doit être un entier' })
  @Min(0, { message: 'La position X doit être positive ou nulle' })
  positionX?: number;

  @ApiProperty({
    description: 'Position Y (optionnel)',
    example: 200,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'La position Y doit être un entier' })
  @Min(0, { message: 'La position Y doit être positive ou nulle' })
  positionY?: number;

  @ApiProperty({
    description: 'Type de zone',
    example: 'notes',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le type de zone doit être une chaîne de caractères' })
  zoneType?: string;

  @ApiProperty({
    description: 'ID du super-block parent',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: "L'ID du super-block doit être un UUID valide" })
  superBlockId?: string;

  @ApiProperty({
    description: 'Largeur du block',
    example: 300,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'La largeur doit être un entier' })
  @Min(1, { message: 'La largeur doit être supérieure à 0' })
  width?: number;

  @ApiProperty({
    description: 'Hauteur du block',
    example: 200,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'La hauteur doit être un entier' })
  @Min(1, { message: 'La hauteur doit être supérieure à 0' })
  height?: number;

  @ApiProperty({
    description: 'Contenu textuel',
    example: 'Voici ma note...',
  })
  @IsString({ message: 'Le contenu doit être une chaîne de caractères' })
  content: string;

  @ApiProperty({
    description: 'Format du contenu',
    example: 'plain',
    enum: TextContentFormat,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le format doit être une chaîne de caractères' })
  formatType?: TextContentFormat;
}

// DTO pour métadonnées fichier
interface FileUploadMetadata {
  title?: string;
  positionX?: string; // Reçu comme string du form-data
  positionY?: string; // Reçu comme string du form-data
  zoneType?: string;
  superBlockId?: string; // Sera nettoyé pour éviter les chaînes vides
  width?: string; // Reçu comme string du form-data
  height?: string; // Reçu comme string du form-data
}

@ApiTags('Blocks')
@Controller('boards/:boardId/blocks')
@UseInterceptors(ClassSerializerInterceptor)
export class BlocksController {
  private readonly logger = new Logger(BlocksController.name);

  constructor(
    private readonly blocksService: BlocksService,
    private readonly textContentService: TextContentService,
    private readonly fileContentService: FileContentService,
    private readonly blockRelationsService: BlockRelationsService,
  ) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau block',
    description:
      'Crée un block (text/file/analysis) selon le type spécifié (permission EDIT requise)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: CreateBlockDto })
  @ApiResponse({
    status: 201,
    description: 'Block créé avec succès',
    type: BlockResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données de création invalides ou UUID invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes pour créer un block',
  })
  @ApiResponse({
    status: 404,
    description: 'Board non trouvé',
  })
  @ApiResponse({
    status: 409,
    description: 'Statut par défaut non disponible',
  })
  async create(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Body() createBlockDto: CreateBlockDto,
    @Request() req: { user: JwtUser },
  ): Promise<BlockResponseDto> {
    this.logger.log(`Création d'un block dans le board ${boardId}`);
    return this.blocksService.create(boardId, createBlockDto, req.user.id);
  }

  @Post('content/text')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un block avec contenu textuel',
    description:
      'Crée un TextContent et un Block associé en une seule opération',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: CreateTextBlockDto })
  @ApiResponse({
    status: 201,
    description: 'Block avec contenu textuel créé avec succès',
    type: BlockResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données de création invalides ou UUID invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes pour créer un block',
  })
  @ApiResponse({
    status: 404,
    description: 'Board non trouvé',
  })
  @ApiResponse({
    status: 409,
    description: 'Statut par défaut non disponible',
  })
  async createTextBlock(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Body() createTextBlockDto: CreateTextBlockDto,
    @Request() req: { user: JwtUser },
  ): Promise<BlockResponseDto> {
    this.logger.log(`Création d'un block texte dans le board ${boardId}`);

    // 1. Créer le TextContent
    const textContentDto: CreateTextContentDto = {
      content: createTextBlockDto.content,
      formatType: createTextBlockDto.formatType as
        | TextContentFormat.PLAIN
        | TextContentFormat.MARKDOWN
        | TextContentFormat.HTML,
    };
    const textContent = await this.textContentService.create(textContentDto);

    // 2. Créer le Block associé
    const blockDto: CreateBlockDto = {
      blockType: BlockType.TEXT,
      title: createTextBlockDto.title || 'Note',
      positionX: createTextBlockDto.positionX,
      positionY: createTextBlockDto.positionY,
      width: createTextBlockDto.width,
      height: createTextBlockDto.height,
      zoneType: createTextBlockDto.zoneType,
      // Nettoyer superBlockId : ne pas l'inclure s'il est vide
      superBlockId: createTextBlockDto.superBlockId?.trim() || undefined,
      contentId: textContent.id,
    };

    return this.blocksService.create(boardId, blockDto, req.user.id);
  }

  @Post('content/file')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limite
        files: 1,
      },
      fileFilter: (req, file, callback) => {
        // Autoriser les types de fichiers communs pour l'analyse
        const allowedMimes = [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/json',
          'text/plain',
          'application/pdf',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error(`Type de fichier non autorisé: ${file.mimetype}`),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Créer un block avec fichier',
    description:
      'Upload un fichier et crée un Block associé en une seule opération',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    description: 'Fichier à uploader avec métadonnées du block',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Fichier à uploader (requis)',
        },
        title: {
          type: 'string',
          example: 'Mon fichier CSV',
          description:
            'Titre du block (optionnel, utilise le nom du fichier par défaut)',
        },
        positionX: {
          type: 'number',
          example: 100,
          description: 'Position X du block (optionnel)',
        },
        positionY: {
          type: 'number',
          example: 200,
          description: 'Position Y du block (optionnel)',
        },
        zoneType: {
          type: 'string',
          example: 'data',
          description: 'Type de zone (optionnel, défaut: "data")',
        },
        superBlockId: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174001',
          description:
            'ID du super-block parent (OPTIONNEL - laissez vide pour un block indépendant)',
          nullable: true,
        },
        width: {
          type: 'number',
          example: 400,
          description: 'Largeur du block (optionnel, défaut: 400)',
        },
        height: {
          type: 'number',
          example: 300,
          description: 'Hauteur du block (optionnel, défaut: 300)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Block avec fichier créé avec succès',
    type: BlockResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Fichier manquant, données invalides ou UUID invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes pour créer un block',
  })
  @ApiResponse({
    status: 404,
    description: 'Board non trouvé',
  })
  @ApiResponse({
    status: 409,
    description: 'Statut par défaut non disponible',
  })
  async createFileBlock(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() metadata: FileUploadMetadata,
    @Request() req: { user: JwtUser },
  ): Promise<BlockResponseDto> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    this.logger.log(
      `Upload fichier dans le board ${boardId}: ${file.originalname} (${file.size} bytes)`,
    );

    try {
      // 1. Validation de la taille
      if (file.size > 50 * 1024 * 1024) {
        throw new BadRequestException(
          `Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(1)}MB. Limite: 50MB`,
        );
      }

      // 2. Créer le FileContent
      const base64Data = file.buffer.toString('base64');
      const fileContent = await this.fileContentService.uploadFile(
        file.originalname,
        file.mimetype,
        base64Data,
      );

      // 3. Créer le Block associé
      const blockDto: CreateBlockDto = {
        blockType: BlockType.FILE,
        title: metadata.title || file.originalname,
        positionX: metadata.positionX
          ? parseInt(metadata.positionX)
          : undefined,
        positionY: metadata.positionY
          ? parseInt(metadata.positionY)
          : undefined,
        width: metadata.width ? parseInt(metadata.width) : 400,
        height: metadata.height ? parseInt(metadata.height) : 300,
        zoneType: metadata.zoneType || 'data',
        // Nettoyer superBlockId : ne pas l'inclure s'il est vide
        superBlockId: metadata.superBlockId?.trim() || undefined,
        contentId: fileContent.id,
      };

      const result = await this.blocksService.create(
        boardId,
        blockDto,
        req.user.id,
      );

      this.logger.log(
        `Block fichier créé avec succès: ${result.id} pour le fichier ${file.originalname}`,
      );

      return result;
    } catch (error: unknown) {
      this.logger.error(
        `Erreur lors de l'upload du fichier ${file.originalname}:`,
        error,
      );

      if (error instanceof BadRequestException) {
        throw error; // Re-lancer les erreurs déjà formatées
      }

      // Gestion des erreurs spécifiques
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('hash MD5')) {
        throw new BadRequestException(
          "Intégrité du fichier compromise - réessayez l'upload",
        );
      }

      throw new BadRequestException(
        `Erreur lors du traitement du fichier: ${errorMessage || 'Erreur inconnue'}`,
      );
    }
  }

  @Post(':blockId/relations')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une relation pour un block',
    description:
      'Crée une relation entre ce block et un autre (permission EDIT requise)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
  })
  @ApiParam({
    name: 'blockId',
    description: 'Identifiant UUID du block source',
  })
  @ApiBody({ type: CreateBlockRelationFromUrlDto })
  @ApiResponse({
    status: 201,
    description: 'Relation créée avec succès',
    type: BlockRelationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou relation avec soi-même',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes pour créer une relation',
  })
  @ApiResponse({
    status: 404,
    description: 'Block source ou cible non trouvé',
  })
  @ApiResponse({
    status: 409,
    description: 'Cette relation existe déjà',
  })
  async createRelation(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Param('blockId', UuidValidationPipe) blockId: string,
    @Body() createRelationDto: CreateBlockRelationFromUrlDto,
    @Request() req: { user: JwtUser },
  ): Promise<BlockRelationResponseDto> {
    // 🆕 Construire le DTO complet en utilisant blockId de l'URL comme source
    const fullRelationDto: CreateBlockRelationDto = {
      sourceBlockId: blockId,
      targetBlockId: createRelationDto.targetBlockId,
      relationType: createRelationDto.relationType,
    };

    return this.blockRelationsService.create(fullRelationDto, req.user.id);
  }

  @Get(':blockId/relations')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Récupérer les relations d'un block",
    description:
      "Récupère toutes les relations (entrantes et sortantes) d'un block",
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
  })
  @ApiParam({
    name: 'blockId',
    description: 'Identifiant UUID du block',
  })
  @ApiResponse({
    status: 200,
    description: 'Relations récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        outgoing: {
          type: 'array',
          items: { $ref: '#/components/schemas/BlockRelationResponseDto' },
        },
        incoming: {
          type: 'array',
          items: { $ref: '#/components/schemas/BlockRelationResponseDto' },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'UUID invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes pour voir les relations',
  })
  @ApiResponse({
    status: 404,
    description: 'Block non trouvé',
  })
  async getBlockRelations(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Param('blockId', UuidValidationPipe) blockId: string,
    @Request() req: { user: JwtUser },
  ): Promise<{
    outgoing: BlockRelationResponseDto[];
    incoming: BlockRelationResponseDto[];
  }> {
    // Les services de relations valident déjà les permissions
    const [outgoing, incoming] = await Promise.all([
      this.blockRelationsService.findBySourceBlock(blockId, req.user.id),
      this.blockRelationsService.findByTargetBlock(blockId, req.user.id),
    ]);

    return { outgoing, incoming };
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Récupérer tous les blocks d'un board",
    description:
      'Récupère tous les blocks actifs du board (permission VIEW requise)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des blocks récupérée avec succès',
    type: [BlockResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'UUID invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé à ce board',
  })
  @ApiResponse({
    status: 404,
    description: 'Board non trouvé',
  })
  async findByBoard(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Request() req: { user: JwtUser },
  ): Promise<BlockResponseDto[]> {
    const blocks = await this.blocksService.findByBoard(boardId, req.user.id);
    return blocks;
  }

  @Get(':blockId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer un block spécifique',
    description:
      'Récupère les métadonnées complètes du block (permission VIEW requise)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'blockId',
    description: 'Identifiant UUID du block',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 200,
    description: 'Block récupéré avec succès',
    type: BlockResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'UUID invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes pour voir ce block',
  })
  @ApiResponse({
    status: 404,
    description: 'Block non trouvé',
  })
  async findOne(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Param('blockId', UuidValidationPipe) blockId: string,
    @Request() req: { user: JwtUser },
  ): Promise<BlockResponseDto> {
    return this.blocksService.findOne(blockId, req.user.id);
  }

  @Patch(':blockId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Modifier un block',
    description:
      "Met à jour les propriétés d'un block (permission EDIT requise)",
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'blockId',
    description: 'Identifiant UUID du block',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiBody({ type: UpdateBlockDto })
  @ApiResponse({
    status: 200,
    description: 'Block modifié avec succès',
    type: BlockResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données de mise à jour invalides ou UUID invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes pour modifier ce block',
  })
  @ApiResponse({
    status: 404,
    description: 'Block non trouvé',
  })
  async update(
    @Param('blockId', UuidValidationPipe) blockId: string,
    @Body() updateBlockDto: UpdateBlockDto,
    @Request() req: { user: JwtUser },
  ): Promise<BlockResponseDto> {
    const block = await this.blocksService.update(
      blockId,
      updateBlockDto,
      req.user.id,
    );
    return block;
  }

  @Patch(':blockId/position')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Modifier la position d'un block",
    description:
      'Met à jour uniquement la position et les dimensions (permission EDIT requise)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'blockId',
    description: 'Identifiant UUID du block',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiBody({ type: UpdateBlockPositionDto })
  @ApiResponse({
    status: 200,
    description: 'Position du block modifiée avec succès',
    type: BlockResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données de position invalides ou UUID invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes pour modifier ce block',
  })
  @ApiResponse({
    status: 404,
    description: 'Block non trouvé',
  })
  async updatePosition(
    @Param('blockId', UuidValidationPipe) blockId: string,
    @Body() positionDto: UpdateBlockPositionDto,
    @Request() req: { user: JwtUser },
  ): Promise<BlockResponseDto> {
    const block = await this.blocksService.updatePosition(
      blockId,
      positionDto,
      req.user.id,
    );
    return block;
  }

  @Patch(':blockId/content')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Modifier le contenu d'un block",
    description:
      "Met à jour le contenu textuel ou fichier d'un block (permission EDIT requise)",
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'blockId',
    description: 'Identifiant UUID du block',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiBody({
    description: 'Nouveau contenu (selon le type de block)',
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', example: 'Nouveau contenu textuel...' },
        formatType: {
          type: 'string',
          enum: ['plain', 'markdown', 'html'],
          example: 'plain',
        },
      },
      required: ['content'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Contenu du block modifié avec succès',
    type: BlockResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou type de block non supporté',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes pour modifier ce block',
  })
  @ApiResponse({
    status: 404,
    description: 'Block non trouvé',
  })
  async updateBlockContent(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Param('blockId', UuidValidationPipe) blockId: string,
    @Body() contentUpdate: { content: string; formatType?: string },
    @Request() req: { user: JwtUser },
  ): Promise<BlockResponseDto> {
    this.logger.log(`Mise à jour du contenu du block ${blockId}`);

    // 1. Récupérer le block pour connaître son type et contentId
    const block = await this.blocksService.findOne(blockId, req.user.id);

    // 2. Mettre à jour le contenu selon le type
    switch (block.blockType) {
      case BlockType.TEXT:
        await this.textContentService.update(block.contentId, {
          content: contentUpdate.content,
          formatType:
            (contentUpdate.formatType as TextContentFormat) ||
            TextContentFormat.PLAIN,
        });
        break;
      case BlockType.FILE:
        throw new BadRequestException(
          'Modification de fichier non supportée via cet endpoint',
        );
      case BlockType.ANALYSIS:
        throw new BadRequestException("Modification d'analyse non supportée");
      default:
        throw new BadRequestException('Type de block non supporté');
    }

    // 3. Retourner le block mis à jour
    return this.blocksService.findOne(blockId, req.user.id);
  }

  @Get(':blockId/content')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Récupérer le contenu détaillé d'un block",
    description:
      "Récupère le contenu complet d'un block (TextContent ou FileContent)",
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'blockId',
    description: 'Identifiant UUID du block',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 200,
    description: 'Contenu du block récupéré avec succès',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'TEXT' },
            content: { type: 'string', example: 'Le contenu textuel...' },
            formatType: { type: 'string', example: 'plain' },
          },
        },
        {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'FILE' },
            fileName: { type: 'string', example: 'document.pdf' },
            mimeType: { type: 'string', example: 'application/pdf' },
            fileSize: { type: 'number', example: 1024567 },
            fileType: { type: 'string', example: 'pdf' },
            downloadUrl: { type: 'string', example: '/api/files/download/...' },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'UUID invalide ou type de block non supporté',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes pour voir ce contenu',
  })
  @ApiResponse({
    status: 404,
    description: 'Block ou contenu non trouvé',
  })
  async getBlockContent(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Param('blockId', UuidValidationPipe) blockId: string,
    @Request() req: { user: JwtUser },
  ): Promise<any> {
    this.logger.log(`Récupération du contenu du block ${blockId}`);

    // 1. Récupérer le block pour connaître son type et contentId
    const block = await this.blocksService.findOne(blockId, req.user.id);

    // 2. Récupérer le contenu selon le type
    switch (block.blockType) {
      case BlockType.TEXT: {
        const textContent = await this.textContentService.findOne(
          block.contentId,
        );
        return {
          type: 'TEXT',
          content: textContent.content,
          formatType: textContent.formatType,
        };
      }

      case BlockType.FILE: {
        const fileContent = await this.fileContentService.findOne(
          block.contentId,
        );
        return {
          type: 'FILE',
          fileName: fileContent.fileName,
          mimeType: fileContent.mimeType,
          fileSize: fileContent.fileSize,
          fileType: fileContent.fileType,
          // Pas de base64Data pour éviter les réponses trop lourdes
          downloadUrl: `/api/boards/${boardId}/blocks/${blockId}/download`,
        };
      }

      case BlockType.ANALYSIS:
        throw new BadRequestException(
          "Récupération d'analyse pas encore supportée",
        );

      default:
        throw new BadRequestException('Type de block non supporté');
    }
  }

  @Get(':blockId/download')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Télécharger le fichier du block',
    description:
      'Télécharge le fichier associé à un block FILE (permission VIEW requise)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'blockId',
    description: 'Identifiant UUID du block',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 200,
    description: 'Fichier téléchargé avec succès',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'UUID invalide ou block pas de type FILE',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes pour télécharger ce fichier',
  })
  @ApiResponse({
    status: 404,
    description: 'Block ou fichier non trouvé',
  })
  async downloadFile(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Param('blockId', UuidValidationPipe) blockId: string,
    @Request() req: { user: JwtUser },
  ): Promise<any> {
    this.logger.log(`Téléchargement du fichier du block ${blockId}`);

    // 1. Récupérer le block pour vérifier qu'il s'agit bien d'un FILE
    const block = await this.blocksService.findOne(blockId, req.user.id);

    if (block.blockType !== BlockType.FILE) {
      throw new BadRequestException(
        'Ce block ne contient pas de fichier téléchargeable',
      );
    }

    // 2. Récupérer et retourner le fichier via le service FileContent
    return this.fileContentService.downloadFile(block.contentId);
  }

  @Delete(':blockId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un block',
    description: 'Supprime définitivement un block (permission EDIT requise)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'blockId',
    description: 'Identifiant UUID du block',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 204,
    description: 'Block supprimé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'UUID invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes pour supprimer ce block',
  })
  @ApiResponse({
    status: 404,
    description: 'Block non trouvé ou déjà supprimé',
  })
  async remove(
    @Param('blockId', UuidValidationPipe) blockId: string,
    @Request() req: { user: JwtUser },
  ): Promise<void> {
    await this.blocksService.remove(blockId, req.user.id);
  }

  @Delete(':blockId/relations/:relationId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une relation spécifique',
    description: 'Supprime une relation entre blocks (permission EDIT requise)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
  })
  @ApiParam({
    name: 'blockId',
    description: 'Identifiant UUID du block source',
  })
  @ApiParam({
    name: 'relationId',
    description: 'Identifiant UUID de la relation',
  })
  @ApiResponse({
    status: 204,
    description: 'Relation supprimée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'UUID invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes pour supprimer cette relation',
  })
  @ApiResponse({
    status: 404,
    description: 'Relation non trouvée',
  })
  async deleteRelation(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Param('blockId', UuidValidationPipe) blockId: string,
    @Param('relationId', UuidValidationPipe) relationId: string,
    @Request() req: { user: JwtUser },
  ): Promise<void> {
    await this.blockRelationsService.remove(relationId, req.user.id);
  }
}
