import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { filterXSS, IFilterXSSOptions } from 'xss';

/**
 * Intercepteur de sécurité moderne utilisant le package xss
 * - Sanitise automatiquement tous les inputs contre les attaques XSS réelles
 * - Validation de taille de payload intelligente
 * - Logging des tentatives d'attaque
 *
 * Remplace l'ancien intercepteur qui était inefficace contre les vraies attaques XSS
 */
@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityInterceptor.name);

  // Limites de taille différenciées
  private readonly MAX_JSON_SIZE = 1024 * 1024; // 1MB pour JSON
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB pour uploads

  // Configuration XSS stricte pour API REST
  private readonly xssOptions: IFilterXSSOptions = {
    whiteList: {}, // Aucune balise HTML autorisée dans une API REST
    stripIgnoreTag: true, // Supprime toutes les balises
    stripIgnoreTagBody: ['script', 'style'], // Supprime contenu des balises dangereuses
    allowCommentTag: false, // Aucun commentaire HTML
    css: false, // Aucun CSS inline
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    // Vérification de la taille du payload
    this.validatePayloadSize(request);

    // Sanitisation XSS moderne de tous les inputs
    this.sanitizeUserInputs(request);

    return next.handle();
  }

  private validatePayloadSize(request: Request): void {
    const contentLength = request.headers['content-length'];
    const contentType = request.headers['content-type'] || '';

    if (!contentLength) return;

    const size = parseInt(contentLength);
    const isFileUpload = contentType.includes('multipart/form-data');
    const maxSize = isFileUpload ? this.MAX_FILE_SIZE : this.MAX_JSON_SIZE;

    if (size > maxSize) {
      const type = isFileUpload ? 'fichier' : 'données JSON';
      const limitMB = Math.round(maxSize / (1024 * 1024));

      this.logger.warn(
        `Tentative d'upload ${type} trop volumineux: ${Math.round(size / (1024 * 1024))}MB > ${limitMB}MB`,
      );

      throw new BadRequestException(
        `${type} trop volumineux (max ${limitMB}MB)`,
      );
    }
  }

  private sanitizeUserInputs(request: Request): void {
    try {
      // Sanitise le body JSON de manière sûre
      if (request.body && typeof request.body === 'object') {
        const sanitizedBody = this.sanitizeValue(request.body);
        request.body = sanitizedBody;
      }

      // Sanitise les query parameters de manière sûre
      if (request.query && typeof request.query === 'object') {
        const sanitizedQuery = this.sanitizeValue(request.query);
        // Remplacer les propriétés individuellement plutôt que l'objet entier
        Object.keys(request.query).forEach((key) => delete request.query[key]);
        Object.assign(request.query, sanitizedQuery);
      }

      // Sanitise les paramètres d'URL de manière sûre
      if (request.params && typeof request.params === 'object') {
        const sanitizedParams = this.sanitizeValue(request.params);
        // Remplacer les propriétés individuellement plutôt que l'objet entier
        Object.keys(request.params).forEach(
          (key) => delete request.params[key],
        );
        Object.assign(request.params, sanitizedParams);
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors de la sanitisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
      // En cas d'erreur, on laisse passer la requête sans sanitisation
      // plutôt que de bloquer complètement l'API
    }
  }

  private sanitizeValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      const sanitized = filterXSS(value, this.xssOptions);

      // Log si une attaque XSS potentielle a été détectée
      if (sanitized !== value) {
        this.logger.warn(
          `Attaque XSS potentielle neutralisée: ${value.substring(0, 100)}...`,
        );
      }

      return sanitized;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }

    if (typeof value === 'object') {
      const sanitized: Record<string, unknown> = {};

      for (const [key, val] of Object.entries(value)) {
        // Sanitise aussi les clés pour éviter les attaques par nom d'attribut
        const sanitizedKey = filterXSS(key, this.xssOptions);
        sanitized[sanitizedKey] = this.sanitizeValue(val);
      }

      return sanitized;
    }

    return value;
  }
}
