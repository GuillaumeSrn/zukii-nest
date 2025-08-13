import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: "Message d'erreur descriptif",
    example: 'Une erreur est survenue lors du traitement de la requête',
  })
  message: string;

  @ApiProperty({
    description: 'Code de statut HTTP',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: "Timestamp de l'erreur",
    example: '2025-08-13T14:37:19.401Z',
  })
  timestamp: string;

  @ApiProperty({
    description: "Chemin de la requête qui a causé l'erreur",
    example: '/api/boards/1',
  })
  path: string;

  @ApiProperty({
    description: 'Méthode HTTP de la requête',
    example: 'POST',
  })
  method: string;
}

export class ValidationErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Détails des erreurs de validation',
    example: [
      {
        field: 'title',
        message: 'Le titre doit contenir au moins 3 caractères',
        value: 'ab',
      },
    ],
  })
  errors: Array<{
    field: string;
    message: string;
    value: any;
  }>;
}
