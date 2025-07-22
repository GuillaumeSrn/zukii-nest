import { IsString, IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetStatusCategoryDto {
  @ApiProperty({
    description: 'Catégorie de statuts',
    example: 'user',
    enum: ['user', 'board', 'board-member', 'block', 'invitation'],
  })
  @IsString({ message: 'La catégorie doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La catégorie est requise' })
  @IsIn(['user', 'board', 'board-member', 'block', 'invitation'], {
    message:
      'La catégorie doit être user, board, board-member, block ou invitation',
  })
  category: string;
}
