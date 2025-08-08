import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BoardLockService } from './board-lock.service';

interface LockRequestPayload {
  boardId: string;
}

@Injectable()
@WebSocketGateway({ namespace: '/boards', cors: { origin: true, credentials: true } })
export class BoardsGateway {
  private readonly logger = new Logger(BoardsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly lockService: BoardLockService,
    private readonly jwtService: JwtService,
  ) {}

  @SubscribeMessage('join')
  handleJoin(@MessageBody() payload: { boardId: string }, @ConnectedSocket() client: Socket) {
    const room = `board:${payload.boardId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined ${room}`);
  }

  @SubscribeMessage('leave')
  handleLeave(@MessageBody() payload: { boardId: string }, @ConnectedSocket() client: Socket) {
    const room = `board:${payload.boardId}`;
    client.leave(room);
    this.logger.debug(`Client ${client.id} left ${room}`);
  }

  @SubscribeMessage('lock:request')
  async handleLockRequest(
    @MessageBody() payload: LockRequestPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const token = (client.handshake.auth && (client.handshake.auth as any).token) || '';
    const userId = this.safeExtractUserId(token);
    const { boardId } = payload;
    try {
      await this.lockService.lockBoard(boardId, userId);
      const data = { boardId, userId };
      this.server.to(`board:${boardId}`).emit('lock:granted', data);
      // Diffusion globale pour les clients hors room (ex: navigation en cours)
      this.server.emit('lock:granted', data);
    } catch (e) {
      client.emit('lock:denied', { boardId });
    }
  }

  @SubscribeMessage('unlock')
  async handleUnlock(
    @MessageBody() payload: LockRequestPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const token = (client.handshake.auth && (client.handshake.auth as any).token) || '';
    const userId = this.safeExtractUserId(token);
    const { boardId } = payload;
    try {
      await this.lockService.unlockBoard(boardId, userId);
      const data = { boardId };
      this.server.to(`board:${boardId}`).emit('lock:released', data);
      // Diffusion globale pour éviter toute perte d'event
      this.server.emit('lock:released', data);
    } catch (e) {
      // No-op
    }
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @MessageBody() payload: LockRequestPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const token = (client.handshake.auth && (client.handshake.auth as any).token) || '';
    const userId = this.safeExtractUserId(token);
    const { boardId } = payload;
    try {
      await this.lockService.lockBoard(boardId, userId);
    } catch (e) {
      // No-op: si déjà verrouillé par un autre, on ne casse rien
    }
  }

  // Déverrouillage automatique si le client coupe brutalement (fermeture onglet)
  async handleDisconnect(client: Socket) {
    const token = (client.handshake.auth && (client.handshake.auth as any).token) || '';
    const userId = this.safeExtractUserId(token);
    if (!userId) return;
    const unlockedBoards = await this.lockService.unlockAllByUser(userId);
    for (const boardId of unlockedBoards) {
      const data = { boardId };
      this.server.to(`board:${boardId}`).emit('lock:released', data);
      this.server.emit('lock:released', data);
    }
  }

  private safeExtractUserId(token: string): string {
    try {
      if (!token) return '';
      const decoded = this.jwtService.decode(token) as { sub?: string; type?: string } | null;
      if (decoded && decoded.type === 'access' && typeof decoded.sub === 'string') {
        return decoded.sub;
      }
      return '';
    } catch {
      return '';
    }
  }
}


