import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SecurityInterceptor } from './common/interceptors/security.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
    origin: process.env.FRONTEND_URL || false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation globale avec sécurité
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // Supprime les propriétés non définies dans les DTOs
      forbidNonWhitelisted: true, // Rejette les propriétés inconnues
      disableErrorMessages: process.env.NODE_ENV === 'production',
      validationError: {
        target: false, // Cache l'objet original dans les erreurs
        value: false, // Cache la valeur dans les erreurs
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

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
