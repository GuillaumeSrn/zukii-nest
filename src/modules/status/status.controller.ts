import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatusService } from './status.service';

@ApiTags('Statuts')
@Controller('statuses')
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
    example: [
      {
        id: 'user-active',
        category: 'user',
        name: 'active',
        isActive: true,
      },
    ],
  })
  @ApiResponse({
    status: 400,
    description: 'Catégorie invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  getStatusByCategory(@Param('category') category: string) {
    // Validation supplémentaire au niveau controller
    const validCategories = ['user', 'board', 'block', 'invitation'];
    if (!validCategories.includes(category)) {
      throw new BadRequestException('Catégorie invalide');
    }

    return this.statusService.findByCategory(category);
  }
}
