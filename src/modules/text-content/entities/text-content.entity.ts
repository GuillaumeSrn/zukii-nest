import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('text_contents')
export class TextContent extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    name: 'format_type',
    type: 'varchar',
    length: 20,
    default: 'plain',
  })
  formatType: string;
}
