import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Status } from '../../modules/status/entities/status.entity';
import { ALL_STATUSES } from '../../modules/status/enums/status.enum';

export class StatusSeeder {
  private static readonly logger = new Logger(StatusSeeder.name);

  static async run(
    dataSource: DataSource,
  ): Promise<{ success: boolean; canContinue: boolean }> {
    try {
      const repository = dataSource.getRepository(Status);

      // Vérification simple pour éviter le seeding inutile
      const existingCount = await repository.count();
      if (existingCount >= ALL_STATUSES.length) {
        this.logger.log('Statuts déjà présents, seeding ignoré');
        return { success: true, canContinue: true };
      }

      const statusesToSeed = ALL_STATUSES.map((statusId) => {
        const [category, name] = statusId.split('-', 2);
        return repository.create({
          id: statusId,
          category,
          name,
          isActive: true,
        });
      });

      this.logger.log(`🌱 Seeding ${statusesToSeed.length} statuts...`);

      await repository.upsert(statusesToSeed, ['id']);
      this.logger.log('✅ Seed des statuts terminé avec succès');
      return { success: true, canContinue: true };
    } catch (error) {
      this.logger.error('❌ Erreur durant le seed:', error);

      // Vérifier si des statuts existent malgré l'erreur
      try {
        const repository = dataSource.getRepository(Status);
        const existingCount = await repository.count();

        if (existingCount > 0) {
          this.logger.warn(
            '⚠️ Seeding échoué mais des statuts existent, continuons...',
          );
          return { success: false, canContinue: true };
        }
      } catch (checkError) {
        this.logger.error(
          '❌ Impossible de vérifier les statuts existants:',
          checkError,
        );
      }

      this.logger.error("🚨 Aucun statut disponible, arrêt de l'application");
      return { success: false, canContinue: false };
    }
  }
}
