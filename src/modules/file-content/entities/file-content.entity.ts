import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

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

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy: string;

  // Relations
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;
}