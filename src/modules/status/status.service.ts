import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from './entities/status.entity';
import { StatusResponseDto } from './dto/status-response.dto';

@Injectable()
export class StatusService {
  private readonly logger = new Logger(StatusService.name);

  constructor(
    @InjectRepository(Status)
    private readonly statusRepository: Repository<Status>,
  ) {}

  async findByCategoryAndName(
    category: string,
    name: string,
  ): Promise<StatusResponseDto | null> {
    const status = await this.statusRepository.findOne({
      where: { category, name, isActive: true },
    });
    return status ? this.toStatusResponseDto(status) : null;
  }

  async findByCategory(category: string): Promise<StatusResponseDto[]> {
    const statuses = await this.statusRepository.find({
      where: { category, isActive: true },
      order: { name: 'ASC' },
    });
    return statuses.map((status) => this.toStatusResponseDto(status));
  }

  private toStatusResponseDto(status: Status): StatusResponseDto {
    return {
      id: status.id,
      category: status.category,
      name: status.name,
      isActive: status.isActive,
    };
  }
}
