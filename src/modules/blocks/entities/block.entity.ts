import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Board } from '../../boards/entities/board.entity';
import { User } from '../../users/entities/user.entity';
import { Status } from '../../status/entities/status.entity';
import { BlockType } from '../enums/block.enum';

@Entity('blocks')
@Index('IDX_board_spatial', ['boardId', 'positionX', 'positionY'])
@Index('IDX_content_lookup', ['contentId', 'blockType'])
@Check('CHK_position_x_positive', '"position_x" >= 0')
@Check('CHK_position_y_positive', '"position_y" >= 0')
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

  @Column({ name: 'position_x', type: 'int' })
  positionX: number;

  @Column({ name: 'position_y', type: 'int' })
  positionY: number;

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

  // Relations
  @ManyToOne(() => Board)
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
}
