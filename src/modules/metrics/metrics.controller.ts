import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

@Controller('metrics')
export class MetricsController {
  @Get()
  @Public()
  getMetrics(): string {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const timestamp = Date.now();

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
zukii_app_info{version="1.0.0",name="zukii-nest"} 1
`;
  }
}
