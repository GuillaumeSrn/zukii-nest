import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: "Refresh token pour renouveler le token d'accès",
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh...',
  })
  @IsNotEmpty({ message: 'Le refresh token est requis' })
  @IsString({ message: 'Le refresh token doit être une chaîne de caractères' })
  refresh_token: string;
}
