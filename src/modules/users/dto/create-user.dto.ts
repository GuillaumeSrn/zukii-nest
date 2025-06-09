import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: "Adresse email unique de l'utilisateur",
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: "L'email doit être valide" })
  @IsNotEmpty({ message: "L'email est requis" })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email: string;

  @ApiProperty({
    description: "Mot de passe de l'utilisateur",
    example: 'MotDePasse123!',
    minLength: 8,
    pattern:
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial',
  })
  password: string;

  @ApiPropertyOptional({
    description: "Nom d'affichage de l'utilisateur",
    example: 'Jean Dupont',
  })
  @IsOptional()
  @IsString({
    message: "Le nom d'affichage doit être une chaîne de caractères",
  })
  @IsNotEmpty({ message: "Le nom d'affichage est obligatoire" })
  @MinLength(2, {
    message: "Le nom d'affichage doit contenir au moins 2 caractères",
  })
  @MaxLength(100, {
    message: "Le nom d'affichage ne peut pas dépasser 100 caractères",
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  displayName: string;
}
