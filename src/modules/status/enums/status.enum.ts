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
  ...Object.values(InvitationStatus),
] as const;

// Helper par catégorie
export const STATUS_BY_CATEGORY = {
  user: UserStatus,
  board: BoardStatus,
  'board-member': BoardMemberStatus,
  block: BlockStatus,
  invitation: InvitationStatus,
} as const;
