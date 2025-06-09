import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Status } from './entities/status.entity';
import { StatusSeeder } from '../../database/seeds/status.seed';

@Injectable()
export class StatusService implements OnModuleInit {
  private readonly logger = new Logger(StatusService.name);

  constructor(
    @InjectRepository(Status)
    private readonly statusRepository: Repository<Status>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultStatuses();
  }

  private async ensureDefaultStatuses() {
    try {
      const count = await this.statusRepository.count();
      if (count === 0) {
        this.logger.log(
          'Table statuses vide, initialisation des données par défaut...',
        );
        await StatusSeeder.run(this.dataSource);
        this.logger.log('✅ Statuts par défaut initialisés avec succès');
      } else {
        this.logger.log(
          `Table statuses contient déjà ${count} enregistrement(s)`,
        );
      }
    } catch (error) {
      this.logger.error(
        "❌ Erreur lors de l'initialisation des statuts:",
        error,
      );
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
