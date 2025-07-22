import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateBlockDto } from './create-block.dto';

export class UpdateBlockDto extends PartialType(CreateBlockDto) {}

export class UpdateBlockPositionDto {
  @ApiProperty({
    description: 'Position X du block',
    example: 100,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'La position X doit être un entier' })
  @Min(0, { message: 'La position X doit être positive ou nulle' })
  positionX?: number;

  @ApiProperty({
    description: 'Position Y du block',
    example: 200,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'La position Y doit être un entier' })
  @Min(0, { message: 'La position Y doit être positive ou nulle' })
  positionY?: number;

  @ApiProperty({
    description: "Index Z du block (ordre d'affichage)",
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "L'index Z doit être un entier" })
  zIndex?: number;
}
