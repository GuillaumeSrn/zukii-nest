import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getApiInfo(): object {
    return {
      name: 'Zukii API',
      version: '1.0.0',
      description:
        "API REST pour application collaborative d'analyse de données CSV avec IA",
      endpoints: {
        auth: '/auth',
        users: '/users',
      },
    };
  }
}
