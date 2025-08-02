import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvitationPermission } from '../enums/invitation.enum';

export class CreateInvitationDto {
  @ApiProperty({
    description: "Email de l'utilisateur à inviter",
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({
    description: 'Niveau de permission à accorder',
    enum: InvitationPermission,
    example: InvitationPermission.VIEW,
    required: false,
    default: InvitationPermission.VIEW,
  })
  @IsEnum(InvitationPermission, {
    message: 'Le niveau de permission doit être view, edit ou admin',
  })
  @IsOptional()
  permissionLevel?: InvitationPermission = InvitationPermission.VIEW;
}
