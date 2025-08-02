import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlocksService } from './blocks.service';
import { BlocksController } from './blocks.controller';
import { Block } from './entities/block.entity';
import { Board } from '../boards/entities/board.entity';
import { User } from '../users/entities/user.entity';
import { Status } from '../status/entities/status.entity';
import { BoardMembersModule } from '../board-members/board-members.module';
import { TextContentModule } from '../text-content/text-content.module';
import { FileContentModule } from '../file-content/file-content.module';
import { AnalysisContentModule } from '../analysis-content/analysis-content.module';
import { BlockRelationsModule } from '../block-relations/block-relations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Block, Board, User, Status]),
    BoardMembersModule,
    TextContentModule,
    FileContentModule,
    AnalysisContentModule,
    BlockRelationsModule,
  ],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
