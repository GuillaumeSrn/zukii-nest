import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlocksService } from './blocks.service';
import { BlocksController } from './blocks.controller';
import { Block } from './entities/block.entity';
import { Board } from '../boards/entities/board.entity';
import { Status } from '../status/entities/status.entity';
import { BoardMembersModule } from '../board-members/board-members.module';
import { TextContentModule } from '../text-content/text-content.module';
import { FileContentModule } from '../file-content/file-content.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Block, Board, Status]),
    BoardMembersModule,
    TextContentModule,
    FileContentModule,
  ],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
