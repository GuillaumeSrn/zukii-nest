import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email doit être un email valide' })
  @IsNotEmpty({ message: 'Email est obligatoire' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  @MaxLength(128, {
    message: 'Le mot de passe ne peut pas dépasser 128 caractères',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial',
  })
  password: string;

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
  @Transform(({ value }) => value?.trim())
  displayName: string;
}
