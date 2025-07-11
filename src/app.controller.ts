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
        'text-content': '/text-content',
        'file-content': '/files',
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
        'text-content': '/text-content',
        'file-content': '/files',
        blocks: '/boards/:boardId/blocks',
      },
    };
  }
}
