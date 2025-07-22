import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Block } from '../../blocks/entities/block.entity';
import { User } from '../../users/entities/user.entity';

export enum BlockRelationType {
  GENERATED_FROM = 'generated_from',
  COMMENT_ON = 'comment_on',
  REFERENCES = 'references',
  DERIVED_FROM = 'derived_from',
}

@Entity('block_relations')
@Index('IDX_block_relations_source', ['sourceBlockId'])
@Index('IDX_block_relations_target', ['targetBlockId'])
@Unique(['sourceBlockId', 'targetBlockId', 'relationType'])
export class BlockRelation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ name: 'source_block_id', type: 'uuid' })
  sourceBlockId: string;

  @Column({ name: 'target_block_id', type: 'uuid' })
  targetBlockId: string;

  @Column({
    name: 'relation_type',
    type: 'enum',
    enum: BlockRelationType,
  })
  relationType: BlockRelationType;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  // Relations
  @ManyToOne(() => Block, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_block_id' })
  sourceBlock: Block;

  @ManyToOne(() => Block, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_block_id' })
  targetBlock: Block;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
