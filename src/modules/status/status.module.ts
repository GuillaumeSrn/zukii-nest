import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Status } from './entities/status.entity';
import { StatusService } from './status.service';

@Module({
  imports: [TypeOrmModule.forFeature([Status])],
  providers: [StatusService],
  exports: [StatusService, TypeOrmModule],
})
export class StatusModule {}
