import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { User } from './modules/users/entities/user.entity';
import { Status } from './modules/status/entities/status.entity';
import { Board } from './modules/boards/entities/board.entity';
import { BoardLock } from './modules/boards/entities/board-lock.entity';
import { BoardMember } from './modules/board-members/entities/board-member.entity';
import { Block } from './modules/blocks/entities/block.entity';
import { SuperBlock } from './modules/super-blocks/entities/super-block.entity';
import { BlockRelation } from './modules/block-relations/entities/block-relation.entity';
import { TextContent } from './modules/text-content/entities/text-content.entity';
import { FileContent } from './modules/file-content/entities/file-content.entity';
import { AnalysisContent } from './modules/analysis-content/entities/analysis-content.entity';
import { Invitation } from './modules/invitation/entities/invitation.entity';
import { StatusModule } from './modules/status/status.module';
import { UsersModule } from './modules/users/users.module';
import { BoardsModule } from './modules/boards/boards.module';
import { BoardMembersModule } from './modules/board-members/board-members.module';
import { InvitationModule } from './modules/invitation/invitation.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailModule } from './modules/email/email.module';
import { BlocksModule } from './modules/blocks/blocks.module';
import { SuperBlocksModule } from './modules/super-blocks/super-blocks.module';
import { BlockRelationsModule } from './modules/block-relations/block-relations.module';
import { TextContentModule } from './modules/text-content/text-content.module';
import { FileContentModule } from './modules/file-content/file-content.module';
import { AnalysisContentModule } from './modules/analysis-content/analysis-content.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST'),
          port: configService.get<number>('SMTP_PORT'),
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: configService.get<string>('SMTP_FROM'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'password'),
        database: configService.get<string>('DB_NAME', 'zukii_db'),
        entities: [
          User,
          Status,
          Board,
          BoardLock,
          BoardMember,
          Block,
          SuperBlock,
          BlockRelation,
          TextContent,
          FileContent,
          AnalysisContent,
          Invitation,
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    StatusModule,
    UsersModule,
    BoardsModule,
    BoardMembersModule,
    InvitationModule,
    AuthModule,
    EmailModule,
    BlocksModule,
    SuperBlocksModule,
    BlockRelationsModule,
    TextContentModule,
    FileContentModule,
    AnalysisContentModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
