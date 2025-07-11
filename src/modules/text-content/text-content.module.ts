import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TextContentController } from './text-content.controller';
import { TextContentService } from './text-content.service';
import { TextContent } from './entities/text-content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TextContent])],
  controllers: [TextContentController],
  providers: [TextContentService],
  exports: [TextContentService],
})
export class TextContentModule {}
