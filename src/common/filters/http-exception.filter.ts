import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Standardisation du message : toujours une string
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        // Si c'est un objet (comme UnauthorizedException), on extrait le message
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || 'Une erreur est survenue';
      } else {
        message = 'Une erreur est survenue';
      }
    } else {
      // Erreur 500 pour toutes les autres erreurs
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Erreur interne du serveur';

      // Log l'erreur complète pour le debug
      this.logger.error(
        `Erreur 500 sur ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : exception,
      );
    }

    // Log des erreurs 4xx et 5xx
    if (status >= 400) {
      this.logger.warn(
        `${status} ${request.method} ${request.url} - ${message}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    });
  }
}
