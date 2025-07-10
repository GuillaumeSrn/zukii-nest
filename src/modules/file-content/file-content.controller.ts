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

@ApiTags('File Content')
@Controller('files')
@UseInterceptors(ClassSerializerInterceptor)
export class FileContentController {
  private readonly logger = new Logger(FileContentController.name);

  constructor(private readonly fileContentService: FileContentService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau fichier via JSON' })
  @ApiResponse({
    status: 201,
    description: 'Fichier créé avec succès',
    type: FileContentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiBearerAuth()
  async create(@Body() createFileContentDto: CreateFileContentDto) {
    return this.fileContentService.create(createFileContentDto);
  }

  @Post('upload')
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
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  async uploadFile(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const base64Data = file.buffer.toString('base64');

    return this.fileContentService.uploadFile(
      file.originalname,
      file.mimetype,
      base64Data,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les fichiers' })
  @ApiResponse({
    status: 200,
    description: 'Liste des fichiers récupérée avec succès',
    type: [FileContentResponseDto],
  })
  @ApiBearerAuth()
  async findAll() {
    return this.fileContentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un fichier par son ID' })
  @ApiParam({ name: 'id', description: 'ID unique du fichier' })
  @ApiResponse({
    status: 200,
    description: 'Fichier récupéré avec succès',
    type: FileContentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fichier non trouvé' })
  @ApiBearerAuth()
  async findOne(@Param('id', UuidValidationPipe) id: string) {
    return this.fileContentService.findOne(id);
  }

  @Get(':id/download')
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
  @ApiBearerAuth()
  async downloadFile(
    @Param('id', UuidValidationPipe) id: string,
    @Res() res: Response,
  ) {
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
  @ApiOperation({ summary: 'Mettre à jour un fichier' })
  @ApiParam({ name: 'id', description: 'ID unique du fichier' })
  @ApiResponse({
    status: 200,
    description: 'Fichier mis à jour avec succès',
    type: FileContentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fichier non trouvé' })
  @ApiBearerAuth()
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() updateFileContentDto: UpdateFileContentDto,
  ) {
    return this.fileContentService.update(id, updateFileContentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un fichier' })
  @ApiParam({ name: 'id', description: 'ID unique du fichier' })
  @ApiResponse({ status: 204, description: 'Fichier supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Fichier non trouvé' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  async remove(@Param('id', UuidValidationPipe) id: string) {
    await this.fileContentService.remove(id);
  }
} 