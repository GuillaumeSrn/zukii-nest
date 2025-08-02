import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisContentService } from './analysis-content.service';
import { AnalysisContentController } from './analysis-content.controller';

import { AnalysisContent } from './entities/analysis-content.entity';
import { FileContentModule } from '../file-content/file-content.module';

@Module({
  imports: [TypeOrmModule.forFeature([AnalysisContent]), FileContentModule],

  controllers: [AnalysisContentController],
  providers: [AnalysisContentService],
  exports: [AnalysisContentService],
})
export class AnalysisContentModule {}
