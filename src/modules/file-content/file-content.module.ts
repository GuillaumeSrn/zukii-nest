import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileContentService } from './file-content.service';
import { FileContentController } from './file-content.controller';
import { FileContent } from './entities/file-content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FileContent])],
  controllers: [FileContentController],
  providers: [FileContentService],
  exports: [FileContentService],
})
export class FileContentModule {} 