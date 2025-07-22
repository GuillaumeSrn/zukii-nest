import { PartialType } from '@nestjs/swagger';
import { CreateSuperBlockDto } from './create-super-block.dto';

export class UpdateSuperBlockDto extends PartialType(CreateSuperBlockDto) {}
