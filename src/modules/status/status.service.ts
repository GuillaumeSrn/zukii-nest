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
      { type: 'user', value: 'active', description: 'Utilisateur actif' },
      { type: 'user', value: 'inactive', description: 'Utilisateur inactif' },

      // Invitation statuses
      {
        type: 'invitation',
        value: 'pending',
        description: 'Invitation en attente',
      },
      {
        type: 'invitation',
        value: 'accepted',
        description: 'Invitation acceptée',
      },
      {
        type: 'invitation',
        value: 'declined',
        description: 'Invitation refusée',
      },
      {
        type: 'invitation',
        value: 'expired',
        description: 'Invitation expirée',
      },

      // Member statuses
      { type: 'member', value: 'active', description: 'Membre actif' },
      { type: 'member', value: 'inactive', description: 'Membre inactif' },

      // File statuses
      {
        type: 'file',
        value: 'pending',
        description: 'Fichier en attente de traitement',
      },
      {
        type: 'file',
        value: 'processed',
        description: 'Fichier traité avec succès',
      },
      {
        type: 'file',
        value: 'error',
        description: 'Erreur lors du traitement',
      },
      { type: 'file', value: 'archived', description: 'Fichier archivé' },

      // Analysis statuses
      { type: 'analysis', value: 'running', description: 'Analyse en cours' },
      { type: 'analysis', value: 'completed', description: 'Analyse terminée' },
      { type: 'analysis', value: 'failed', description: 'Analyse échouée' },
    ];

    for (const statusData of statusesToSeed) {
      const exists = await this.statusRepository.findOne({
        where: { type: statusData.type, value: statusData.value },
      });

      if (!exists) {
        const status = this.statusRepository.create(statusData);
        await this.statusRepository.save(status);
      }
    }
  }

  async findByTypeAndValue(
    type: string,
    value: string,
  ): Promise<Status | null> {
    return this.statusRepository.findOne({
      where: { type, value, isActive: true },
    });
  }

  async findByType(type: string): Promise<Status[]> {
    return this.statusRepository.find({
      where: { type, isActive: true },
      order: { value: 'ASC' },
    });
  }
}
