import { Injectable, LoggerService } from '@nestjs/common';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class LoggingService implements LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Garder les 1000 derniers logs

  log(message: string, context?: string, metadata?: Record<string, unknown>) {
    this.addLog('info', message, context, metadata);
  }

  warn(message: string, context?: string, metadata?: Record<string, unknown>) {
    this.addLog('warn', message, context, metadata);
  }

  error(message: string, context?: string, metadata?: Record<string, unknown>) {
    this.addLog('error', message, context, metadata);
  }

  debug(message: string, context?: string, metadata?: Record<string, unknown>) {
    this.addLog('debug', message, context, metadata);
  }

  private addLog(
    level: LogEntry['level'],
    message: string,
    context?: string,
    metadata?: Record<string, unknown>,
  ) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      ...metadata,
    };

    this.logs.push(logEntry);

    // Garder seulement les maxLogs derniers
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log aussi dans la console pour le debug
    console.log(JSON.stringify(logEntry));
  }

  getLogs(level?: string, limit: number = 100): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = this.logs.filter((log) => log.level === level);
    }

    return filteredLogs.slice(-limit);
  }

  getAnomalies(): LogEntry[] {
    return this.logs.filter(
      (log) => log.level === 'error' || log.level === 'warn',
    );
  }

  clearLogs() {
    this.logs = [];
  }

  getLogMetrics() {
    const logs = this.logs;
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

  // Métriques au format Prometheus
  getPrometheusMetrics(): string {
    const metrics = this.getLogMetrics();

    return `# HELP zukii_logs_total Total number of logs
# TYPE zukii_logs_total counter
zukii_logs_total ${metrics.total}

# HELP zukii_logs_errors Total number of error logs
# TYPE zukii_logs_errors counter
zukii_logs_errors ${metrics.errors}

# HELP zukii_logs_warnings Total number of warning logs
# TYPE zukii_logs_warnings counter
zukii_logs_warnings ${metrics.warnings}

# HELP zukii_logs_info Total number of info logs
# TYPE zukii_logs_info counter
zukii_logs_info ${metrics.info}

# HELP zukii_logs_error_rate Error rate percentage
# TYPE zukii_logs_error_rate gauge
zukii_logs_error_rate ${metrics.errorRate}

# HELP zukii_logs_warning_rate Warning rate percentage
# TYPE zukii_logs_warning_rate gauge
zukii_logs_warning_rate ${metrics.warningRate}

# HELP zukii_logs_by_level Logs by level
# TYPE zukii_logs_by_level gauge
zukii_logs_by_level{level="error"} ${metrics.errors}
zukii_logs_by_level{level="warn"} ${metrics.warnings}
zukii_logs_by_level{level="info"} ${metrics.info}
zukii_logs_by_level{level="debug"} ${this.logs.filter((log) => log.level === 'debug').length}`;
  }
}
