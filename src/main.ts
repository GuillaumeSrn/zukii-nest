import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SecurityInterceptor } from './common/interceptors/security.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { StatusSeeder } from './database/seeds/status.seed';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Auto-seeding des données de référence
  try {
    const dataSource = app.get(DataSource);
    const seedResult = await StatusSeeder.run(dataSource);

    if (!seedResult.canContinue) {
      console.error("🚨 Arrêt de l'application : données critiques manquantes");
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur critique lors du seeding des statuts:', error);
    process.exit(1);
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // CORS sécurisé
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN')?.split(',') || false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Filtre d'exception global
  app.useGlobalFilters(new HttpExceptionFilter());

  // Validation globale avec sécurité
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages:
        configService.get<string>('NODE_ENV') === 'production',
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Interceptor de sécurité global
  app.useGlobalInterceptors(new SecurityInterceptor());

  // Conf Swagger
  const config = new DocumentBuilder()
    .setTitle('Zukii API')
    .setDescription(
      "API REST Zukii : application collaborative d'analyse de données CSV",
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Entrez votre token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}

void bootstrap();
