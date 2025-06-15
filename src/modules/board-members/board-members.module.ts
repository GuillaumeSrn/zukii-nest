import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardMembersService } from './board-members.service';
import { BoardMembersController } from './board-members.controller';
import { BoardMember } from './entities/board-member.entity';
import { Board } from '../boards/entities/board.entity';
import { Status } from '../status/entities/status.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BoardMember, Board, Status]),
    UsersModule,
  ],
  controllers: [BoardMembersController],
  providers: [BoardMembersService],
  exports: [BoardMembersService],
})
export class BoardMembersModule {}
