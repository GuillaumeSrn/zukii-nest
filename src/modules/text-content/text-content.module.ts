import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TextContentService } from './text-content.service';
import { TextContent } from './entities/text-content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TextContent])],
  providers: [TextContentService],
  exports: [TextContentService],
})
export class TextContentModule {}
