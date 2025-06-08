import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from './entities/status.entity';

@Injectable()
export class StatusService {
  constructor(
    @InjectRepository(Status)
    private readonly statusRepository: Repository<Status>,
  ) {}

  async findByCategoryAndName(
    category: string,
    name: string,
  ): Promise<Status | null> {
    return this.statusRepository.findOne({
      where: { category, name, isActive: true },
    });
  }

  async findByCategory(category: string): Promise<Status[]> {
    return this.statusRepository.find({
      where: { category, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getStatus(): Promise<{
    status: string;
    timestamp: string;
    database: string;
  }> {
    try {
      // Test simple de connexion à la base de données
      await this.statusRepository.count();
      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch {
      return {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      };
    }
  }
}
