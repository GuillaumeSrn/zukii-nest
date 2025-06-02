import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RolesModule } from '../roles/roles.module';
import { StatusModule } from '../status/status.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRole]),
    RolesModule,
    StatusModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
