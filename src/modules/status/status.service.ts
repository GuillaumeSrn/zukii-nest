import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from './entities/status.entity';

@Injectable()
export class StatusService implements OnModuleInit {
  constructor(
    @InjectRepository(Status)
    private readonly statusRepository: Repository<Status>,
  ) {}

  async onModuleInit() {
    await this.seedStatuses();
  }

  private async seedStatuses() {
    const statusesToSeed = [
      // User statuses
      { category: 'user', name: 'active' },
      { category: 'user', name: 'inactive' },

      // Board statuses
      { category: 'board', name: 'active' },
      { category: 'board', name: 'archived' },

      // Block statuses
      { category: 'block', name: 'draft' },
      { category: 'block', name: 'active' },
      { category: 'block', name: 'archived' },

      // Invitation statuses
      { category: 'invitation', name: 'pending' },
      { category: 'invitation', name: 'accepted' },
      { category: 'invitation', name: 'declined' },
      { category: 'invitation', name: 'expired' },
    ];

    for (const statusData of statusesToSeed) {
      const exists = await this.statusRepository.findOne({
        where: { category: statusData.category, name: statusData.name },
      });

      if (!exists) {
        const status = this.statusRepository.create(statusData);
        await this.statusRepository.save(status);
      }
    }
  }

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
}
