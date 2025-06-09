import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({
    message: "Le nom d'affichage doit être une chaîne de caractères",
  })
  @MaxLength(100, {
    message: "Le nom d'affichage ne peut pas dépasser 100 caractères",
  })
  displayName?: string;
}
