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

/**
 * Interceptor de sécurité global qui applique :
 * - Protection contre les injections XSS
 * - Limitation de taille intelligente (JSON vs Files)
 * - Validation des headers dangereux
 * - Logging des tentatives d'attaque
 */
@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityInterceptor.name);

  // Limites différenciées selon le type de contenu
  private readonly MAX_JSON_SIZE = 1024 * 1024; // 1MB pour JSON
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB pour uploads

  private readonly DANGEROUS_PATTERNS = [
    /<script/gi,
    /<iframe/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onerror=/gi,
    /onclick=/gi,
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // Vérifie la taille du payload selon le type
    this.validatePayloadSize(request);

    // Vérifie les headers suspects
    this.validateHeaders(request);

    // Scan rapide du body pour patterns dangereux (uniquement JSON)
    this.scanForDangerousPatterns(request);

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

  private validateHeaders(request: Request): void {
    const userAgent = request.headers['user-agent'];
    const referer = request.headers.referer;

    // Détecte les User-Agents suspects
    if (userAgent && /sqlmap|nmap|nikto|dirb|gobuster/i.test(userAgent)) {
      this.logger.warn(`User-Agent suspect détecté: ${userAgent}`);
      throw new BadRequestException('Requête suspecte détectée');
    }

    // Vérifie les referers dangereux
    if (referer && /javascript:|vbscript:|data:/i.test(referer)) {
      this.logger.warn(`Referer dangereux détecté: ${referer}`);
      throw new BadRequestException('Referer invalide');
    }
  }

  private scanForDangerousPatterns(request: Request): void {
    // Ne scanne que les payloads JSON pour éviter les faux positifs sur les fichiers
    const contentType = request.headers['content-type'] || '';

    if (!contentType.includes('application/json') || !request.body) {
      return;
    }

    const bodyString = JSON.stringify(request.body).toLowerCase();

    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(bodyString)) {
        this.logger.warn(
          `Pattern malveillant détecté dans le JSON: ${pattern}`,
        );
        throw new BadRequestException(
          'Contenu potentiellement malveillant détecté',
        );
      }
    }
  }
}
