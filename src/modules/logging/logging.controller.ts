import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { LoggingService, LogEntry } from './logging.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('logs')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Get()
  @Public()
  getLogs(
    @Query('level') level?: string,
    @Query('limit') limit: number = 100,
  ): LogEntry[] {
    return this.loggingService.getLogs(level, limit);
  }

  @Get('anomalies')
  @Public()
  getAnomalies(): LogEntry[] {
    return this.loggingService.getAnomalies();
  }

  @Post('test')
  @Public()
  createTestLog(
    @Body() logData: { level: string; message: string; context?: string },
  ) {
    const { level, message, context } = logData;

    switch (level) {
      case 'error':
        this.loggingService.error(message, context);
        break;
      case 'warn':
        this.loggingService.warn(message, context);
        break;
      case 'debug':
        this.loggingService.debug(message, context);
        break;
      default:
        this.loggingService.log(message, context);
    }

    return { success: true, message: 'Log created' };
  }

  @Get('metrics')
  @Public()
  getLogMetrics() {
    const logs = this.loggingService.getLogs();
    const total = logs.length;
    const errors = logs.filter((log) => log.level === 'error').length;
    const warnings = logs.filter((log) => log.level === 'warn').length;
    const info = logs.filter((log) => log.level === 'info').length;

    return {
      total,
      errors,
      warnings,
      info,
      errorRate: total > 0 ? (errors / total) * 100 : 0,
      warningRate: total > 0 ? (warnings / total) * 100 : 0,
    };
  }
}
