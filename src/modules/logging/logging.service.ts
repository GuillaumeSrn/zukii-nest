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
}
