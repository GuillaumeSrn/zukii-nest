import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({
    description: "Token d'invitation à valider",
    example: 'a1b2c3d4e5f6...',
  })
  @IsString({ message: "Le token d'invitation est requis" })
  @IsNotEmpty({ message: "Le token d'invitation ne peut pas être vide" })
  token: string;
}
