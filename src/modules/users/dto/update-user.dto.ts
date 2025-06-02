import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Email doit être un email valide' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email?: string;

  @IsOptional()
  @IsString({
    message: "Le nom d'affichage doit être une chaîne de caractères",
  })
  @MinLength(2, {
    message: "Le nom d'affichage doit contenir au moins 2 caractères",
  })
  @MaxLength(100, {
    message: "Le nom d'affichage ne peut pas dépasser 100 caractères",
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  displayName?: string;
} 