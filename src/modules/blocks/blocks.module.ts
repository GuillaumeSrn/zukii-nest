import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { Block } from './entities/block.entity';
import { Board } from '../boards/entities/board.entity';
import { Status } from '../status/entities/status.entity';
import { User } from '../users/entities/user.entity';
import { BoardMembersModule } from '../board-members/board-members.module';
import { TextContentModule } from '../text-content/text-content.module';
import { FileContentModule } from '../file-content/file-content.module';
import { BlockRelationsModule } from '../block-relations/block-relations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Block, Board, Status, User]),
    BoardMembersModule,
    TextContentModule,
    FileContentModule,
    BlockRelationsModule,
  ],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
