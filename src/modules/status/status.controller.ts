import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
}
