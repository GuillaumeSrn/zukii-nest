import { PickType } from '@nestjs/swagger';
import { CreateBoardMemberDto } from './create-board-member.dto';

// DTO spécialisé pour modifier uniquement les permissions
export class UpdateBoardMemberPermissionDto extends PickType(
  CreateBoardMemberDto,
  ['permissionLevel'] as const,
) {}
