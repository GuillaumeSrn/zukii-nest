import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
import { LoggingService } from './modules/logging/logging.service';

@ApiTags('API Info')
@Controller()
export class AppController {
  constructor(
    @Inject(LoggingService) private readonly loggingService: LoggingService,
  ) {}
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
  @Get('metrics')
  @ApiOperation({
    summary: 'Métriques Prometheus',
    description: 'Endpoint de métriques pour Prometheus',
  })
  getMetrics(): string {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const timestamp = Date.now();

    // Récupérer les métriques de logs via le service
    let logsMetrics = '';

    try {
      if (
        this.loggingService &&
        typeof this.loggingService.getPrometheusMetrics === 'function'
      ) {
        logsMetrics = '\n' + this.loggingService.getPrometheusMetrics();
      }
    } catch {
      // Si le service n'est pas disponible, on continue sans
    }

    return `# HELP zukii_app_uptime_seconds Application uptime in seconds
# TYPE zukii_app_uptime_seconds gauge
zukii_app_uptime_seconds ${uptime}

# HELP zukii_app_memory_heap_bytes Memory heap usage in bytes
# TYPE zukii_app_memory_heap_bytes gauge
zukii_app_memory_heap_bytes ${memoryUsage.heapUsed}

# HELP zukii_app_memory_rss_bytes Memory RSS usage in bytes
# TYPE zukii_app_memory_rss_bytes gauge
zukii_app_memory_rss_bytes ${memoryUsage.rss}

# HELP zukii_app_timestamp_last_request Timestamp of last request
# TYPE zukii_app_timestamp_last_request gauge
zukii_app_timestamp_last_request ${timestamp}

# HELP zukii_app_info Application information
# TYPE zukii_app_info gauge
zukii_app_info{version="1.0.0",name="zukii-nest"} 1${logsMetrics}`;
  }
}
