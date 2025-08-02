import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { Board } from './entities/board.entity';
import { Status } from '../status/entities/status.entity';
import { BoardMember } from '../board-members/entities/board-member.entity';
import { SuperBlock } from '../super-blocks/entities/super-block.entity';
import { UsersModule } from '../users/users.module';
import { BoardMembersModule } from '../board-members/board-members.module';
import { SuperBlocksModule } from '../super-blocks/super-blocks.module';
import { BlocksModule } from '../blocks/blocks.module';
import { TextContentModule } from '../text-content/text-content.module';
import { FileContentModule } from '../file-content/file-content.module';
import { AnalysisContentModule } from '../analysis-content/analysis-content.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Board, Status, BoardMember, SuperBlock]),
    UsersModule,
    BoardMembersModule,
    SuperBlocksModule,
    BlocksModule,
    TextContentModule,
    FileContentModule,
    AnalysisContentModule,
  ],
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}
