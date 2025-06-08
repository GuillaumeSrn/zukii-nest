import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: "Nouveau nom d'affichage de l'utilisateur",
    example: 'Jean Dupont',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({
    message: "Le nom d'affichage doit être une chaîne de caractères",
  })
  @MaxLength(100, {
    message: "Le nom d'affichage ne peut pas dépasser 100 caractères",
  })
  displayName?: string;
}
