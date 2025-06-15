<<<<<<< HEAD
=======
import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from './auth-user.dto';

>>>>>>> dev
export class AuthResponseDto {
  access_token: string;
<<<<<<< HEAD
  user: {
    id: string;
    email: string;
    displayName: string;
  };
=======

  @ApiProperty({
    description: "Refresh token pour renouveler le token d'accès",
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token: string;

  @ApiProperty({
    description: "Informations essentielles de l'utilisateur connecté",
    type: AuthUserDto,
  })
  user: AuthUserDto;
>>>>>>> dev
}
