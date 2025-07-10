import { Module } from '@nestjs/common';
import { TextContentController } from './text-content.controller';

@Module({
  controllers: [TextContentController],
})
export class TextContentModule {}
