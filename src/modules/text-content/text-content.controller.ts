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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { TextContentService } from './text-content.service';
import { CreateTextContentDto } from './dto/create-text-content.dto';
import { UpdateTextContentDto } from './dto/update-text-content.dto';
import { TextContentResponseDto } from './dto/text-content-response.dto';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';

@ApiTags('Text Content')
@Controller('text-content')
@UseInterceptors(ClassSerializerInterceptor)
export class TextContentController {
  private readonly logger = new Logger(TextContentController.name);

  constructor(private readonly textContentService: TextContentService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau contenu textuel',
    description: 'Permet de créer un contenu textuel (texte, markdown, HTML)',
  })
  @ApiBody({ type: CreateTextContentDto })
  @ApiResponse({
    status: 201,
    description: 'Contenu textuel créé avec succès',
    type: TextContentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données de création invalides',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  async create(
    @Body() createTextContentDto: CreateTextContentDto,
    @Request() req: { user: JwtUser },
  ): Promise<TextContentResponseDto> {
    this.logger.log(
      `Création d'un contenu textuel par l'utilisateur ${req.user.id}`,
    );
    const textContent =
      await this.textContentService.create(createTextContentDto);
    this.logger.log(`Contenu textuel créé avec succès: ${textContent.id}`);
    return this.textContentService.toResponseDto(textContent);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer tous les contenus textuels',
    description: 'Récupère la liste de tous les contenus textuels',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des contenus textuels récupérée avec succès',
    type: [TextContentResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  async findAll(
    @Request() req: { user: JwtUser },
  ): Promise<TextContentResponseDto[]> {
    this.logger.log(
      `Récupération des contenus textuels par l'utilisateur ${req.user.id}`,
    );
    const textContents = await this.textContentService.findAll();
    this.logger.log(`${textContents.length} contenus textuels récupérés`);
    return textContents.map((tc) => this.textContentService.toResponseDto(tc));
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer un contenu textuel par son ID',
    description: "Récupère les détails d'un contenu textuel spécifique",
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant UUID du contenu textuel',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Contenu textuel récupéré avec succès',
    type: TextContentResponseDto,
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
    status: 404,
    description: 'Contenu textuel non trouvé',
  })
  async findOne(
    @Param('id', UuidValidationPipe) id: string,
    @Request() req: { user: JwtUser },
  ): Promise<TextContentResponseDto> {
    this.logger.log(
      `Récupération du contenu textuel ${id} par l'utilisateur ${req.user.id}`,
    );
    const textContent = await this.textContentService.findOne(id);
    this.logger.log(`Contenu textuel ${id} récupéré avec succès`);
    return this.textContentService.toResponseDto(textContent);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Mettre à jour un contenu textuel',
    description: 'Met à jour un contenu textuel existant',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant UUID du contenu textuel',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateTextContentDto })
  @ApiResponse({
    status: 200,
    description: 'Contenu textuel mis à jour avec succès',
    type: TextContentResponseDto,
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
    status: 404,
    description: 'Contenu textuel non trouvé',
  })
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() updateTextContentDto: UpdateTextContentDto,
    @Request() req: { user: JwtUser },
  ): Promise<TextContentResponseDto> {
    this.logger.log(
      `Mise à jour du contenu textuel ${id} par l'utilisateur ${req.user.id}`,
    );
    const textContent = await this.textContentService.update(
      id,
      updateTextContentDto,
    );
    this.logger.log(`Contenu textuel ${id} mis à jour avec succès`);
    return this.textContentService.toResponseDto(textContent);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un contenu textuel',
    description: 'Supprime définitivement un contenu textuel',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant UUID du contenu textuel',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Contenu textuel supprimé avec succès',
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
    status: 404,
    description: 'Contenu textuel non trouvé ou déjà supprimé',
  })
  async remove(
    @Param('id', UuidValidationPipe) id: string,
    @Request() req: { user: JwtUser },
  ): Promise<void> {
    this.logger.log(
      `Suppression du contenu textuel ${id} par l'utilisateur ${req.user.id}`,
    );
    await this.textContentService.remove(id);
    this.logger.log(`Contenu textuel ${id} supprimé avec succès`);
  }
}
