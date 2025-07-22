import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockRelationsService } from './block-relations.service';
import { BlockRelation } from './entities/block-relation.entity';
import { Block } from '../blocks/entities/block.entity';
import { User } from '../users/entities/user.entity';
import { BoardMembersModule } from '../board-members/board-members.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlockRelation, Block, User]),
    BoardMembersModule,
  ],
  providers: [BlockRelationsService],
  exports: [BlockRelationsService],
})
export class BlockRelationsModule {}
