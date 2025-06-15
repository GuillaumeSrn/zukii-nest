export interface MockUser {
  id: string;
  email: string;
  displayName: string;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MockBoard {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  owner?: MockUser;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MockStatus {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MockBoardMember {
  id: string;
  boardId: string;
  userId: string;
  permission: 'view' | 'edit' | 'admin';
  statusId: string;
  board?: MockBoard;
  user?: MockUser;
  status?: MockStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MockAuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
}

export interface MockJwtUser {
  userId: string;
  email: string;
  displayName: string;
}

export interface MockRequest {
  user: MockJwtUser;
}
