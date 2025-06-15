import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PublicUserDto } from '../../users/dto/public-user.dto';
import { BoardMemberPermission } from '../enums/board-member.enum';
import { StatusResponseDto } from '../../status/dto/status-response.dto';

export class BoardMemberResponseDto {
  @ApiProperty({
    description: 'Identifiant unique du membre',
    example: 'member-abc123',
    format: 'uuid',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Niveau de permission du membre',
    enum: BoardMemberPermission,
    example: BoardMemberPermission.VIEW,
  })
  @Expose()
  permissionLevel: BoardMemberPermission;

  @ApiProperty({
    description: 'Utilisateur membre',
    type: PublicUserDto,
  })
  @Expose()
  @Type(() => PublicUserDto)
  user: PublicUserDto;

  @ApiProperty({
    description: 'Status du membre',
    type: StatusResponseDto,
  })
  @Expose()
  @Type(() => StatusResponseDto)
  status: StatusResponseDto;

  @ApiProperty({
    description: "Date d'ajout au board",
    example: '2024-01-15T12:45:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière modification',
    example: '2024-01-15T12:45:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  updatedAt: Date;
}
