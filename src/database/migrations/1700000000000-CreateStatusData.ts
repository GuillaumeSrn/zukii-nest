import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStatusData1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO statuses (id, category, name, "isActive") VALUES
      ('user-active', 'user', 'active', true),
      ('user-inactive', 'user', 'inactive', true),
      ('board-active', 'board', 'active', true),
      ('board-archived', 'board', 'archived', true),
      ('block-draft', 'block', 'draft', true),
      ('block-active', 'block', 'active', true),
      ('block-archived', 'block', 'archived', true),
      ('invitation-pending', 'invitation', 'pending', true),
      ('invitation-accepted', 'invitation', 'accepted', true),
      ('invitation-declined', 'invitation', 'declined', true),
      ('invitation-expired', 'invitation', 'expired', true)
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM statuses WHERE id IN (
        'user-active', 'user-inactive',
        'board-active', 'board-archived', 
        'block-draft', 'block-active', 'block-archived',
        'invitation-pending', 'invitation-accepted', 'invitation-declined', 'invitation-expired'
      );
    `);
  }
}
