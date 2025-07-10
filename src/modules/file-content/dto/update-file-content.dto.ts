import { PartialType } from '@nestjs/swagger';
import { CreateFileContentDto } from './create-file-content.dto';
 
export class UpdateFileContentDto extends PartialType(CreateFileContentDto) {}