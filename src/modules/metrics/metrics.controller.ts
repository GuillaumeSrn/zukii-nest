import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { LoggingService } from '../logging/logging.service';

@Controller('metrics')
export class MetricsController {
  constructor(
    @Inject(LoggingService) private readonly loggingService: LoggingService,
  ) {}

  @Get()
  @Public()
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
