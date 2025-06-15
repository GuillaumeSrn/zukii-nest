import { IsNotEmpty, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoardMemberPermission } from '../enums/board-member.enum';

export class CreateBoardMemberDto {
  @ApiProperty({
    description: "Email de l'utilisateur à ajouter comme membre",
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: "L'email doit être valide" })
  @IsNotEmpty({ message: "L'email est requis" })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiPropertyOptional({
    description: 'Niveau de permission pour le membre',
    enum: BoardMemberPermission,
    example: BoardMemberPermission.VIEW,
    default: BoardMemberPermission.VIEW,
  })
  @IsOptional()
  @IsEnum(BoardMemberPermission, {
    message: 'Le niveau de permission doit être view, edit ou admin',
  })
  permissionLevel?: BoardMemberPermission;
}
