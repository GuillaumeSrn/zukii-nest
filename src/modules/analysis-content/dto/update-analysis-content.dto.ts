import { PartialType } from '@nestjs/swagger';
import { CreateAnalysisContentDto } from './create-analysis-content.dto';

export class UpdateAnalysisContentDto extends PartialType(
  CreateAnalysisContentDto,
) {}
