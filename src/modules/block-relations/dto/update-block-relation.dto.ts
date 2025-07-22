import { PartialType } from '@nestjs/swagger';
import { CreateBlockRelationDto } from './create-block-relation.dto';

export class UpdateBlockRelationDto extends PartialType(
  CreateBlockRelationDto,
) {}
