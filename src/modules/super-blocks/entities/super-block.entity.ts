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
import { Block } from '../../blocks/entities/block.entity';

@Entity('super_blocks')
@Index('IDX_super_blocks_board', ['boardId'])
@Index('IDX_super_blocks_spatial', ['boardId', 'positionX', 'positionY'])
@Check('CHK_position_x_positive', '"position_x" IS NULL OR "position_x" >= 0')
@Check('CHK_position_y_positive', '"position_y" IS NULL OR "position_y" >= 0')
@Check('CHK_width_positive', '"width" > 0')
@Check('CHK_height_positive', '"height" > 0')
export class SuperBlock extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ name: 'board_id', type: 'uuid' })
  boardId: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 7, default: '#6366f1' })
  color: string;

  @Column({ type: 'boolean', default: false })
  collapsed: boolean;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @Column({ name: 'position_x', type: 'int', nullable: true })
  positionX?: number;

  @Column({ name: 'position_y', type: 'int', nullable: true })
  positionY?: number;

  @Column({ type: 'int', default: 400 })
  width: number;

  @Column({ type: 'int', default: 300 })
  height: number;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  // Relations
  @ManyToOne(() => Board, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'board_id' })
  board: Board;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => Block, (block) => block.superBlock, {
    eager: false,
    cascade: true,
  })
  blocks: Block[];
}
