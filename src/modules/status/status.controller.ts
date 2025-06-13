import {
  Controller,
  Get,
  Param,
  BadRequestException,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatusService } from './status.service';
import { StatusResponseDto } from './dto/status-response.dto';

@ApiTags('Statuts')
@Controller('statuses')
@UseInterceptors(ClassSerializerInterceptor)
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get('category/:category')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lister les statuts par catégorie',
    description: 'Récupère tous les statuts actifs pour une catégorie donnée',
  })
  @ApiParam({
    name: 'category',
    description: 'Catégorie de statuts (user, board, block, invitation)',
    example: 'user',
    enum: ['user', 'board', 'block', 'invitation'],
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des statuts pour la catégorie',
    type: [StatusResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Catégorie invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  async getStatusByCategory(
    @Param('category') category: string,
  ): Promise<StatusResponseDto[]> {
    // Validation supplémentaire au niveau controller
    const validCategories = ['user', 'board', 'block', 'invitation'];
    if (!validCategories.includes(category)) {
      throw new BadRequestException('Catégorie invalide');
    }

    return this.statusService.findByCategory(category);
  }
}
