import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperBlocksService } from './super-blocks.service';
import { SuperBlocksController } from './super-blocks.controller';
import { SuperBlock } from './entities/super-block.entity';
import { Board } from '../boards/entities/board.entity';
import { User } from '../users/entities/user.entity';
import { BoardMembersModule } from '../board-members/board-members.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SuperBlock, Board, User]),
    BoardMembersModule,
  ],
  controllers: [SuperBlocksController],
  providers: [SuperBlocksService],
  exports: [SuperBlocksService],
})
export class SuperBlocksModule {}
