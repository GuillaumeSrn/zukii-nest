import { Controller, Get, Public } from '@nestjs/common';

@Controller('version')
export class VersionController {
  @Get()
  @Public()
  getVersion() {
    return {
      service: 'zukii-nest',
      version: '1.0.0',
      buildDate: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    };
  }
}
