import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('statuses')
export class Status {
  @PrimaryColumn()
  id: string; // ID fixe au lieu d'UUID auto-généré

  @Column()
  category: string;

  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
