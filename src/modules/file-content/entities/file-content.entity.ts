import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('file_contents')
export class FileContent extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ type: 'text' })
  base64Data: string;

  @Column({ type: 'varchar', length: 32 })
  md5Hash: string;

  @Column({ type: 'varchar', length: 50, default: 'csv' })
  fileType: string;
}