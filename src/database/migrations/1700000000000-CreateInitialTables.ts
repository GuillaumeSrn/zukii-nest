import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1700000000000 implements MigrationInterface {
  name = 'CreateInitialTables1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Installation de l'extension uuid-ossp pour gen_random_uuid()
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Table Status (doit être créée en premier car référencée par les autres)
    await queryRunner.query(`
      CREATE TABLE "statuses" (
        "id" character varying NOT NULL,
        "category" character varying(50) NOT NULL,
        "name" character varying(50) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_statuses_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_statuses_category_name" UNIQUE ("category", "name")
      )
    `);

    // Table User
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "display_name" character varying(100) NOT NULL,
        "status_id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_email" UNIQUE ("email"),
        CONSTRAINT "FK_user_status" FOREIGN KEY ("status_id") REFERENCES "statuses"("id")
      )
    `);

    // Table Board
    await queryRunner.query(`
      CREATE TABLE "board" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(100) NOT NULL,
        "description" text,
        "backgroundColor" character varying(7) DEFAULT '#ffffff',
        "owner_id" uuid NOT NULL,
        "status_id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_board_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_board_owner" FOREIGN KEY ("owner_id") REFERENCES "user"("id"),
        CONSTRAINT "FK_board_status" FOREIGN KEY ("status_id") REFERENCES "statuses"("id")
      )
    `);

    // Table BoardLock
    await queryRunner.query(`
      CREATE TABLE "board_locks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "boardId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "lockedAt" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_board_locks_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_board_locks_board" FOREIGN KEY ("boardId") REFERENCES "board"("id"),
        CONSTRAINT "FK_board_locks_user" FOREIGN KEY ("userId") REFERENCES "user"("id"),
        CONSTRAINT "UQ_board_locks_boardId" UNIQUE ("boardId")
      )
    `);

    // Table BoardMember
    await queryRunner.query(`
      CREATE TABLE "board_member" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "board_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "permission_level" character varying NOT NULL DEFAULT 'view',
        "status_id" character varying NOT NULL,
        "updated_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_board_member_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_board_member_unique" UNIQUE ("board_id", "user_id"),
        CONSTRAINT "FK_board_member_board" FOREIGN KEY ("board_id") REFERENCES "board"("id"),
        CONSTRAINT "FK_board_member_user" FOREIGN KEY ("user_id") REFERENCES "user"("id"),
        CONSTRAINT "FK_board_member_status" FOREIGN KEY ("status_id") REFERENCES "statuses"("id"),
        CONSTRAINT "FK_board_member_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id")
      )
    `);

    // Table SuperBlock
    await queryRunner.query(`
      CREATE TABLE "super_block" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "board_id" uuid NOT NULL,
        "title" character varying(200) NOT NULL,
        "color" character varying(7) NOT NULL DEFAULT '#6366f1',
        "collapsed" boolean NOT NULL DEFAULT false,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_super_block_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_super_block_board" FOREIGN KEY ("board_id") REFERENCES "board"("id"),
        CONSTRAINT "FK_super_block_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id")
      )
    `);

    // Table Block
    await queryRunner.query(`
      CREATE TABLE "block" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "board_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        "block_type" character varying NOT NULL,
        "title" character varying(200),
        "position_x" integer,
        "position_y" integer,
        "width" integer NOT NULL DEFAULT 200,
        "height" integer NOT NULL DEFAULT 150,
        "z_index" integer NOT NULL DEFAULT 0,
        "content_id" uuid NOT NULL,
        "super_block_id" uuid,
        "zone_type" character varying(50),
        "status_id" character varying NOT NULL,
        "last_modified_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_block_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_block_board" FOREIGN KEY ("board_id") REFERENCES "board"("id"),
        CONSTRAINT "FK_block_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id"),
        CONSTRAINT "FK_block_super_block" FOREIGN KEY ("super_block_id") REFERENCES "super_block"("id"),
        CONSTRAINT "FK_block_status" FOREIGN KEY ("status_id") REFERENCES "statuses"("id"),
        CONSTRAINT "FK_block_last_modified_by" FOREIGN KEY ("last_modified_by") REFERENCES "user"("id")
      )
    `);

    // Table TextContent
    await queryRunner.query(`
      CREATE TABLE "text_content" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "content" text NOT NULL,
        "format_type" character varying NOT NULL DEFAULT 'plain',
        "word_count" integer NOT NULL DEFAULT 0,
        "status_id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_text_content_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_text_content_status" FOREIGN KEY ("status_id") REFERENCES "statuses"("id")
      )
    `);

    // Table FileContent
    await queryRunner.query(`
      CREATE TABLE "file_content" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "file_name" character varying(255) NOT NULL,
        "mime_type" character varying(100) NOT NULL,
        "file_size" bigint NOT NULL,
        "base64_data" text NOT NULL,
        "md5_hash" character varying(32) NOT NULL,
        "file_type" character varying(50) NOT NULL DEFAULT 'csv',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_file_content_id" PRIMARY KEY ("id")
      )
    `);

    // Table AnalysisContent
    await queryRunner.query(`
      CREATE TABLE "analysis_content" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "analysis_type" character varying(100) NOT NULL,
        "result_data" jsonb NOT NULL,
        "source_file_id" uuid,
        "execution_status" character varying NOT NULL DEFAULT 'pending',
        "execution_time" integer,
        "error_message" text,
        "status_id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_analysis_content_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_analysis_content_source_file" FOREIGN KEY ("source_file_id") REFERENCES "file_content"("id"),
        CONSTRAINT "FK_analysis_content_status" FOREIGN KEY ("status_id") REFERENCES "statuses"("id")
      )
    `);

    // Table Invitation
    await queryRunner.query(`
      CREATE TABLE "invitation" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "board_id" uuid NOT NULL,
        "email" character varying(255) NOT NULL,
        "permission_level" character varying NOT NULL,
        "invitation_token" character varying(128) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "invited_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invitation_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invitation_token" UNIQUE ("invitation_token"),
        CONSTRAINT "FK_invitation_board" FOREIGN KEY ("board_id") REFERENCES "board"("id"),
        CONSTRAINT "FK_invitation_invited_by" FOREIGN KEY ("invited_by") REFERENCES "user"("id")
      )
    `);

    // Index pour les performances
    await queryRunner.query(`CREATE INDEX "IDX_user_email" ON "user" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_board_owner" ON "board" ("owner_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_block_board" ON "block" ("board_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_block_content" ON "block" ("content_id", "block_type")`);
    await queryRunner.query(`CREATE INDEX "IDX_analysis_content_status" ON "analysis_content" ("execution_status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Suppression dans l'ordre inverse des dépendances
    await queryRunner.query(`DROP INDEX "IDX_analysis_content_status"`);
    await queryRunner.query(`DROP INDEX "IDX_block_content"`);
    await queryRunner.query(`DROP INDEX "IDX_block_board"`);
    await queryRunner.query(`DROP INDEX "IDX_board_owner"`);
    await queryRunner.query(`DROP INDEX "IDX_user_email"`);
    
    await queryRunner.query(`DROP TABLE "invitation"`);
    await queryRunner.query(`DROP TABLE "analysis_content"`);
    await queryRunner.query(`DROP TABLE "file_content"`);
    await queryRunner.query(`DROP TABLE "text_content"`);
    await queryRunner.query(`DROP TABLE "block"`);
    await queryRunner.query(`DROP TABLE "super_block"`);
    await queryRunner.query(`DROP TABLE "board_member"`);
    await queryRunner.query(`DROP TABLE "board"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "statuses"`);
    await queryRunner.query(`DROP TABLE "board_locks"`);
  }
}
