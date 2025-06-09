import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatusService } from './status.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Statut')
@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: "Vérifier le statut de l'API",
    description:
      "Endpoint de santé pour vérifier que l'API fonctionne correctement",
  })
  @ApiResponse({
    status: 200,
    description: 'API opérationnelle',
    example: {
      status: 'OK',
      timestamp: '2024-01-15T10:30:00.000Z',
      database: 'connected',
    },
  })
  getStatus() {
    return this.statusService.getStatus();
  }

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
    status: 401,
    description: 'Token JWT requis',
  })
  getStatusByCategory(@Param('category') category: string) {
    return this.statusService.findByCategory(category);
  }
}
