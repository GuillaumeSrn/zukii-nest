import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { BaseEntity } from '../entities/base.entity';

// Interface pour les statuts
interface StatusEntity {
  id: string;
  category: string;
  name: string;
  isActive: boolean;
}

export class SoftDeleteHelper {
  private static readonly logger = new Logger(SoftDeleteHelper.name);

  /**
   * Effectue un soft delete avec traçabilité complète
   */
  static async softDeleteWithUser<T extends BaseEntity>(
    repository: Repository<T>,
    statusRepository: Repository<StatusEntity>,
    entityId: string,
    currentUserId: string,
    statusCategory: string,
    archivedStatusName = 'archived',
  ): Promise<void> {
    try {
      // Récupérer le statut approprié
      const archivedStatus = await statusRepository.findOne({
        where: {
          category: statusCategory,
          name: archivedStatusName,
          isActive: true,
        },
      });

      if (!archivedStatus) {
        this.logger.warn(
          `Statut ${archivedStatusName} non trouvé pour ${statusCategory}, utilisation de softDelete simple`,
        );
        await repository.softDelete(entityId);
        return;
      }

      // Soft delete avec traçabilité complète
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await repository.update(entityId, {
        deletedAt: new Date(),
        deletedBy: currentUserId,
        statusId: archivedStatus.id,
      } as any);

      this.logger.log(
        `Soft delete avec traçabilité: ${entityId} par ${currentUserId}`,
      );
    } catch (error) {
      this.logger.error(`Erreur lors du soft delete: ${error}`);
      throw error;
    }
  }

  /**
   * Effectue un soft delete avec statut personnalisé
   */
  static async softDeleteWithStatus<T extends BaseEntity>(
    repository: Repository<T>,
    entityId: string,
    currentUserId: string,
    statusId: string,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await repository.update(entityId, {
      deletedAt: new Date(),
      deletedBy: currentUserId,
      statusId,
    } as any);
  }

  /**
   * Soft delete simple avec traçabilité (sans changement de statut)
   */
  static async softDeleteSimple<T extends BaseEntity>(
    repository: Repository<T>,
    entityId: string,
    currentUserId: string,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await repository.update(entityId, {
      deletedAt: new Date(),
      deletedBy: currentUserId,
    } as any);
  }
}
