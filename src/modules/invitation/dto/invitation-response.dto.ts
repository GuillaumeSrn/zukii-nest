import { ApiProperty } from '@nestjs/swagger';
import { InvitationPermission } from '../enums/invitation.enum';

export class InvitationResponseDto {
  @ApiProperty({
    description: "Identifiant unique de l'invitation",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Identifiant du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  boardId: string;

  @ApiProperty({
    description: "Email de l'utilisateur invité",
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Niveau de permission accordé',
    enum: InvitationPermission,
    example: InvitationPermission.VIEW,
  })
  permissionLevel: InvitationPermission;

  @ApiProperty({
    description: "Identifiant de l'utilisateur qui a créé l'invitation",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  invitedBy: string;

  @ApiProperty({
    description: "Date d'expiration de l'invitation",
    example: '2024-12-31T23:59:59.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: "Date de création de l'invitation",
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière modification',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Informations du board (optionnel)',
    required: false,
  })
  board?: {
    id: string;
    title: string;
  };

  @ApiProperty({
    description: "Informations de l'utilisateur invitant (optionnel)",
    required: false,
  })
  invitedByUser?: {
    id: string;
    displayName: string;
  };
}
