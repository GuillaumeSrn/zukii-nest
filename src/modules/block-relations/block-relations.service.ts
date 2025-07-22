import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockRelation } from './entities/block-relation.entity';
import { CreateBlockRelationDto } from './dto/create-block-relation.dto';
import { BlockRelationResponseDto } from './dto/block-relation-response.dto';
import { Block } from '../blocks/entities/block.entity';
import { User } from '../users/entities/user.entity';
import { BoardMembersService } from '../board-members/board-members.service';
import { BoardMemberPermission } from '../board-members/enums/board-member.enum';

@Injectable()
export class BlockRelationsService {
  private readonly logger = new Logger(BlockRelationsService.name);

  constructor(
    @InjectRepository(BlockRelation)
    private readonly blockRelationRepository: Repository<BlockRelation>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly boardMembersService: BoardMembersService,
  ) {}

  async create(
    createBlockRelationDto: CreateBlockRelationDto,
    currentUserId: string,
  ): Promise<BlockRelationResponseDto> {
    this.logger.log(
      `Création d'une relation ${createBlockRelationDto.relationType} entre blocks`,
    );

    // Valider que les blocks existent et récupérer leurs boardIds
    const sourceBlock = await this.findBlockEntity(
      createBlockRelationDto.sourceBlockId,
    );
    const targetBlock = await this.findBlockEntity(
      createBlockRelationDto.targetBlockId,
    );

    // Valider que l'utilisateur a les permissions sur les boards des deux blocks
    await this.validateUserPermission(
      sourceBlock.boardId,
      currentUserId,
      BoardMemberPermission.EDIT,
    );
    await this.validateUserPermission(
      targetBlock.boardId,
      currentUserId,
      BoardMemberPermission.EDIT,
    );

    // Valider que les blocks ne sont pas identiques
    if (
      createBlockRelationDto.sourceBlockId ===
      createBlockRelationDto.targetBlockId
    ) {
      throw new BadRequestException(
        'Un block ne peut pas avoir une relation avec lui-même',
      );
    }

    // Vérifier que la relation n'existe pas déjà
    const existingRelation = await this.blockRelationRepository.findOne({
      where: {
        sourceBlockId: createBlockRelationDto.sourceBlockId,
        targetBlockId: createBlockRelationDto.targetBlockId,
        relationType: createBlockRelationDto.relationType,
      },
    });

    if (existingRelation) {
      throw new ConflictException('Cette relation existe déjà');
    }

    const blockRelation = this.blockRelationRepository.create({
      ...createBlockRelationDto,
      createdBy: currentUserId,
    });

    const savedRelation =
      await this.blockRelationRepository.save(blockRelation);
    this.logger.log(`Relation ${savedRelation.id} créée avec succès`);

    return this.mapToResponseDto(savedRelation);
  }

  async findBySourceBlock(
    sourceBlockId: string,
    currentUserId: string,
  ): Promise<BlockRelationResponseDto[]> {
    this.logger.log(
      `Récupération des relations du block source ${sourceBlockId}`,
    );

    // Valider que le block existe et les permissions
    const sourceBlock = await this.findBlockEntity(sourceBlockId);
    await this.validateUserPermission(
      sourceBlock.boardId,
      currentUserId,
      BoardMemberPermission.VIEW,
    );

    const relations = await this.blockRelationRepository.find({
      where: { sourceBlockId },
      order: { createdAt: 'DESC' },
    });

    return relations.map((relation) => this.mapToResponseDto(relation));
  }

  async findByTargetBlock(
    targetBlockId: string,
    currentUserId: string,
  ): Promise<BlockRelationResponseDto[]> {
    this.logger.log(
      `Récupération des relations vers le block cible ${targetBlockId}`,
    );

    // Valider que le block existe et les permissions
    const targetBlock = await this.findBlockEntity(targetBlockId);
    await this.validateUserPermission(
      targetBlock.boardId,
      currentUserId,
      BoardMemberPermission.VIEW,
    );

    const relations = await this.blockRelationRepository.find({
      where: { targetBlockId },
      order: { createdAt: 'DESC' },
    });

    return relations.map((relation) => this.mapToResponseDto(relation));
  }

  async findOne(
    id: string,
    currentUserId: string,
  ): Promise<BlockRelationResponseDto> {
    this.logger.log(`Récupération de la relation ${id}`);

    const relation = await this.findBlockRelationEntity(id);

    // Valider les permissions sur le block source
    const sourceBlock = await this.findBlockEntity(relation.sourceBlockId);
    await this.validateUserPermission(
      sourceBlock.boardId,
      currentUserId,
      BoardMemberPermission.VIEW,
    );

    return this.mapToResponseDto(relation);
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    this.logger.log(`Suppression de la relation ${id}`);

    const relation = await this.findBlockRelationEntity(id);

    // Valider les permissions sur le block source
    const sourceBlock = await this.findBlockEntity(relation.sourceBlockId);
    await this.validateUserPermission(
      sourceBlock.boardId,
      currentUserId,
      BoardMemberPermission.EDIT,
    );

    await this.blockRelationRepository.remove(relation);
    this.logger.log(`Relation ${id} supprimée avec succès`);
  }

  // Méthodes privées utilitaires
  private async findBlockRelationEntity(id: string): Promise<BlockRelation> {
    const relation = await this.blockRelationRepository.findOne({
      where: { id },
    });

    if (!relation) {
      throw new NotFoundException('Relation non trouvée');
    }

    return relation;
  }

  private async findBlockEntity(blockId: string): Promise<Block> {
    const block = await this.blockRepository.findOne({
      where: { id: blockId },
    });

    if (!block) {
      throw new NotFoundException('Block non trouvé');
    }

    return block;
  }

  private async validateUserPermission(
    boardId: string,
    userId: string,
    requiredPermission: BoardMemberPermission,
  ): Promise<void> {
    const hasPermission = await this.boardMembersService.checkUserPermission(
      boardId,
      userId,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Permission ${requiredPermission} requise pour cette action`,
      );
    }
  }

  private mapToResponseDto(relation: BlockRelation): BlockRelationResponseDto {
    return {
      id: relation.id,
      sourceBlockId: relation.sourceBlockId,
      targetBlockId: relation.targetBlockId,
      relationType: relation.relationType,
    };
  }
}
