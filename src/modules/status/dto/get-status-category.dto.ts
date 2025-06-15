import { IsString, IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetStatusCategoryDto {
  @ApiProperty({
    description: 'Catégorie de statuts',
    example: 'user',
    enum: ['user', 'board', 'block', 'invitation'],
  })
  @IsString({ message: 'La catégorie doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La catégorie est requise' })
  @IsIn(['user', 'board', 'block', 'invitation'], {
    message: 'La catégorie doit être user, board, block ou invitation',
  })
  category: string;
}
