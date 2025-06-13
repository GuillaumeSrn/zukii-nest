import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class StatusResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Identifiant du statut',
    example: 'user-active',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'Catégorie du statut',
    example: 'user',
  })
  category: string;

  @Expose()
  @ApiProperty({
    description: 'Nom du statut',
    example: 'active',
  })
  name: string;

  @Expose()
  @ApiProperty({
    description: 'Indique si le statut est actif',
    example: true,
  })
  isActive: boolean;
}
