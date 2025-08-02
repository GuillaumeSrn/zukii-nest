import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Board } from '../../boards/entities/board.entity';
import { User } from '../../users/entities/user.entity';
import { Status } from '../../status/entities/status.entity';
import { SuperBlock } from '../../super-blocks/entities/super-block.entity';
import { BlockType } from '../enums/block.enum';

@Entity('blocks')
@Index('IDX_board_spatial', ['boardId', 'positionX', 'positionY'])
@Index('IDX_content_lookup', ['contentId', 'blockType'])
@Index('IDX_blocks_super_block', ['superBlockId'])
@Check('CHK_position_x_positive', '"position_x" IS NULL OR "position_x" >= 0')
@Check('CHK_position_y_positive', '"position_y" IS NULL OR "position_y" >= 0')
@Check('CHK_width_positive', '"width" > 0')
@Check('CHK_height_positive', '"height" > 0')
export class Block extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ name: 'board_id', type: 'uuid' })
  boardId: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({
    name: 'block_type',
    type: 'enum',
    enum: BlockType,
  })
  blockType: BlockType;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title?: string;

  @Column({ name: 'position_x', type: 'int', nullable: true })
  positionX?: number;

  @Column({ name: 'position_y', type: 'int', nullable: true })
  positionY?: number;

  @Column({ type: 'int', default: 300 })
  width: number;

  @Column({ type: 'int', default: 200 })
  height: number;

  @Column({ name: 'z_index', type: 'int', default: 0 })
  zIndex: number;

  @Column({ name: 'status_id', type: 'varchar' })
  statusId: string;

  @Column({ name: 'content_id', type: 'uuid' })
  contentId: string;

  @Column({ name: 'last_modified_by', type: 'uuid', nullable: true })
  lastModifiedBy?: string;

  @Column({ name: 'super_block_id', type: 'uuid', nullable: true })
  superBlockId?: string;

  @Column({ name: 'zone_type', type: 'varchar', length: 50, nullable: true })
  zoneType?: string;

  // Relations principales
  @ManyToOne(() => Board, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'board_id' })
  board: Board;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'last_modified_by' })
  lastModifier?: User;

  @ManyToOne(() => Status)
  @JoinColumn({ name: 'status_id' })
  status: Status;

  @ManyToOne(() => SuperBlock, { eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'super_block_id' })
  superBlock?: SuperBlock;

  @OneToMany('BlockRelation', 'sourceBlock', { cascade: true })
  outgoingRelations: unknown[];

  @OneToMany('BlockRelation', 'targetBlock', { cascade: true })
  incomingRelations: unknown[];
}
