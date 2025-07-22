import { PartialType } from '@nestjs/swagger';
import { CreateTextContentDto } from './create-text-content.dto';

export class UpdateTextContentDto extends PartialType(CreateTextContentDto) {}
