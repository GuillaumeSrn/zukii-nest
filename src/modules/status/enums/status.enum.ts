export enum UserStatus {
  ACTIVE = 'user-active',
  INACTIVE = 'user-inactive',
}

export enum BoardStatus {
  ACTIVE = 'board-active',
  ARCHIVED = 'board-archived',
}

export enum BoardMemberStatus {
  ACTIVE = 'board-member-active',
  INACTIVE = 'board-member-inactive',
}

export enum BlockStatus {
  DRAFT = 'block-draft',
  ACTIVE = 'block-active',
  ARCHIVED = 'block-archived',
}

export enum TextContentStatus {
  ACTIVE = 'text-content-active',
  INACTIVE = 'text-content-inactive',
}

export enum FileContentStatus {
  ACTIVE = 'file-content-active',
  INACTIVE = 'file-content-inactive',
}

export enum InvitationStatus {
  PENDING = 'invitation-pending',
  ACCEPTED = 'invitation-accepted',
  DECLINED = 'invitation-declined',
  EXPIRED = 'invitation-expired',
}

// Helper pour tous les statuts
export const ALL_STATUSES = [
  ...Object.values(UserStatus),
  ...Object.values(BoardStatus),
  ...Object.values(BoardMemberStatus),
  ...Object.values(BlockStatus),
  ...Object.values(TextContentStatus),
  ...Object.values(FileContentStatus),
  ...Object.values(InvitationStatus),
] as const;

// Helper par catégorie
export const STATUS_BY_CATEGORY = {
  user: UserStatus,
  board: BoardStatus,
  'board-member': BoardMemberStatus,
  block: BlockStatus,
  'text-content': TextContentStatus,
  'file-content': FileContentStatus,
  invitation: InvitationStatus,
} as const;
