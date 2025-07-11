import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  HttpCode,
  Logger,
  ClassSerializerInterceptor,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { FileContentService } from './file-content.service';
import { CreateFileContentDto } from './dto/create-file-content.dto';
import { UpdateFileContentDto } from './dto/update-file-content.dto';
import { FileContentResponseDto } from './dto/file-content-response.dto';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';

@ApiTags('File Content')
@Controller('files')
@UseInterceptors(ClassSerializerInterceptor)
export class FileContentController {
  private readonly logger = new Logger(FileContentController.name);

  constructor(private readonly fileContentService: FileContentService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Créer un nouveau fichier via JSON' })
  @ApiResponse({
    status: 201,
    description: 'Fichier créé avec succès',
    type: FileContentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Token JWT requis' })
  async create(
    @Body() createFileContentDto: CreateFileContentDto,
    @Request() req: { user: JwtUser },
  ) {
    this.logger.log(`Création d'un fichier par l'utilisateur ${req.user.id}`);
    return this.fileContentService.create(createFileContentDto, req.user.id);
  }

  @Post('upload')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Uploader un fichier' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Fichier à uploader',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Fichier uploadé avec succès',
    type: FileContentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Fichier invalide' })
  @ApiResponse({ status: 401, description: 'Token JWT requis' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Request() req: { user: JwtUser },
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    this.logger.log(
      `Upload de fichier ${file.originalname} par l'utilisateur ${req.user.id}`,
    );
    const base64Data = file.buffer.toString('base64');

    return this.fileContentService.uploadFile(
      file.originalname,
      file.mimetype,
      base64Data,
      req.user.id,
    );
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer tous les fichiers' })
  @ApiResponse({
    status: 200,
    description: 'Liste des fichiers récupérée avec succès',
    type: [FileContentResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Token JWT requis' })
  async findAll(@Request() req: { user: JwtUser }) {
    this.logger.log(`Récupération des fichiers par l'utilisateur ${req.user.id}`);
    return this.fileContentService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer un fichier par son ID' })
  @ApiParam({ name: 'id', description: 'ID unique du fichier' })
  @ApiResponse({
    status: 200,
    description: 'Fichier récupéré avec succès',
    type: FileContentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fichier non trouvé' })
  @ApiResponse({ status: 401, description: 'Token JWT requis' })
  async findOne(
    @Param('id', UuidValidationPipe) id: string,
    @Request() req: { user: JwtUser },
  ) {
    this.logger.log(`Récupération du fichier ${id} par l'utilisateur ${req.user.id}`);
    return this.fileContentService.findOne(id);
  }

  @Get(':id/download')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Télécharger un fichier' })
  @ApiParam({ name: 'id', description: 'ID unique du fichier' })
  @ApiResponse({
    status: 200,
    description: 'Fichier téléchargé avec succès',
    content: {
      'application/octet-stream': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Fichier non trouvé' })
  @ApiResponse({ status: 401, description: 'Token JWT requis' })
  async downloadFile(
    @Param('id', UuidValidationPipe) id: string,
    @Res() res: Response,
    @Request() req: { user: JwtUser },
  ) {
    this.logger.log(`Téléchargement du fichier ${id} par l'utilisateur ${req.user.id}`);
    const { content, fileContent } =
      await this.fileContentService.downloadFile(id);

    res.set({
      'Content-Type': fileContent.mimeType,
      'Content-Disposition': `attachment; filename="${fileContent.fileName}"`,
      'Content-Length': content.length.toString(),
    });

    res.send(content);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mettre à jour un fichier' })
  @ApiParam({ name: 'id', description: 'ID unique du fichier' })
  @ApiResponse({
    status: 200,
    description: 'Fichier mis à jour avec succès',
    type: FileContentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fichier non trouvé' })
  @ApiResponse({ status: 401, description: 'Token JWT requis' })
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() updateFileContentDto: UpdateFileContentDto,
    @Request() req: { user: JwtUser },
  ) {
    this.logger.log(`Mise à jour du fichier ${id} par l'utilisateur ${req.user.id}`);
    return this.fileContentService.update(id, updateFileContentDto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Supprimer un fichier' })
  @ApiParam({ name: 'id', description: 'ID unique du fichier' })
  @ApiResponse({ status: 204, description: 'Fichier supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Fichier non trouvé' })
  @ApiResponse({ status: 401, description: 'Token JWT requis' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', UuidValidationPipe) id: string,
    @Request() req: { user: JwtUser },
  ) {
    this.logger.log(`Suppression du fichier ${id} par l'utilisateur ${req.user.id}`);
    await this.fileContentService.remove(id);
  }
} 