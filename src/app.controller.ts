import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('API Info')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({
    summary: "Informations de l'API",
    description: "Retourne les informations générales sur l'API Zukii",
  })
  @ApiResponse({
    status: 200,
    description: "Informations de l'API",
    example: {
      name: 'Zukii API',
      version: '1.0.0',
      description:
        "API Zukii : application collaborative d'analyse de données CSV",
      endpoints: {
        auth: '/auth',
        users: '/users',
        boards: '/boards',
        statuses: '/statuses',
        'board-members': '/boards/:boardId/members',
        'super-blocks': '/boards/:boardId/super-blocks',
        blocks: '/boards/:boardId/blocks',
      },
    },
  })
  getApiInfo(): object {
    return {
      name: 'Zukii API',
      version: '1.0.0',
      description:
        "API Zukii : application collaborative d'analyse de données CSV",
      endpoints: {
        auth: '/auth',
        users: '/users',
        boards: '/boards',
        statuses: '/statuses',
        'board-members': '/boards/:boardId/members',
        'super-blocks': '/boards/:boardId/super-blocks',
        blocks: '/boards/:boardId/blocks',
      },
    };
  }

  @Public()
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: "Vérification de la santé de l'API",
  })
  @ApiResponse({
    status: 200,
    description: 'API en bonne santé',
    example: {
      status: 'healthy',
      service: 'zukii-api',
      version: '1.0.0',
      timestamp: '2025-01-27T10:00:00Z',
    },
  })
  getHealth(): object {
    return {
      status: 'healthy',
      service: 'zukii-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
