import { DataSource } from 'typeorm';
import { Status } from '../../modules/status/entities/status.entity';
import { ALL_STATUSES } from '../../modules/status/enums/status.enum';

export class StatusSeeder {
  static async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Status);

    // Génération automatique des statuts à partir des enums
    const statusesToSeed = ALL_STATUSES.map((statusId) => {
      const [category, name] = statusId.split('-');
      return {
        id: statusId,
        category,
        name,
        isActive: true,
      };
    });

    console.log(`🌱 Seeding ${statusesToSeed.length} statuts...`);

    try {
      // Utilisation d'upsert pour éviter les erreurs de duplication
      for (const statusData of statusesToSeed) {
        await repository.save(statusData);
        console.log(`✅ Status: ${statusData.id}`);
      }

      console.log('✅ Seed des statuts terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur durant le seed:', error);
      throw error;
    }
  }
} 