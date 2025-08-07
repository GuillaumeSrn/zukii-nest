import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardLock } from './entities/board-lock.entity';

@Injectable()
export class BoardLockService {
  private readonly logger = new Logger(BoardLockService.name);

  constructor(
    @InjectRepository(BoardLock)
    private readonly boardLockRepository: Repository<BoardLock>,
  ) {}

  async lockBoard(boardId: string, userId: string): Promise<boolean> {
    const existingLock = await this.boardLockRepository.findOne({
      where: { boardId },
    });

    if (existingLock) {
      if (existingLock.userId === userId) {
        return true;
      }
      throw new ConflictException(
        'Board déjà verrouillé par un autre utilisateur',
      );
    }

    const lock = this.boardLockRepository.create({
      boardId,
      userId,
      lockedAt: new Date(),
    });

    await this.boardLockRepository.save(lock);
    this.logger.log(`Board ${boardId} verrouillé par l'utilisateur ${userId}`);
    return true;
  }

  async unlockBoard(boardId: string, userId: string): Promise<void> {
    const lock = await this.boardLockRepository.findOne({
      where: { boardId },
    });

    if (!lock) {
      return;
    }

    if (lock.userId !== userId) {
      throw new ConflictException('Vous ne pouvez pas déverrouiller ce board');
    }

    await this.boardLockRepository.remove(lock);
    this.logger.log(
      `Board ${boardId} déverrouillé par l'utilisateur ${userId}`,
    );
  }

  async getBoardLock(boardId: string): Promise<BoardLock | null> {
    return this.boardLockRepository.findOne({
      where: { boardId },
    });
  }

  async isBoardLocked(boardId: string): Promise<boolean> {
    const lock = await this.getBoardLock(boardId);
    return lock !== null;
  }

  async cleanupExpiredLocks(): Promise<void> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    await this.boardLockRepository
      .createQueryBuilder()
      .delete()
      .where('lockedAt < :fifteenMinutesAgo', { fifteenMinutesAgo })
      .execute();
  }
}
