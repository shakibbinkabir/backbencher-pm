import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { NotificationsService } from './notifications.service';
import { JoinRoomData, LeaveRoomData } from './types';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4200'],
    credentials: true,
  },
  namespace: '/',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedClients = new Map<string, { userId: string; socket: Socket }>();

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.notificationsService.setGateway(this);
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      
      if (!user) {
        this.logger.warn(`Client ${client.id} connected with invalid user`);
        client.disconnect();
        return;
      }

      // Store client connection
      this.connectedClients.set(client.id, { userId: user.id, socket: client });
      
      // Join user-specific room
      await client.join(`user_${user.id}`);
      
      this.logger.log(`Client ${client.id} connected as user ${user.id}`);
      
      // Send connection confirmation
      client.emit('connected', { 
        userId: user.id, 
        message: 'Successfully connected to WebSocket' 
      });

    } catch (error: any) {
      this.logger.error(`Connection error for client ${client.id}:`, error?.message || error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const connection = this.connectedClients.get(client.id);
    if (connection) {
      this.logger.log(`Client ${client.id} (user ${connection.userId}) disconnected`);
      this.connectedClients.delete(client.id);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: JoinRoomData,
    @ConnectedSocket() client: Socket,
  ) {
    const connection = this.connectedClients.get(client.id);
    if (!connection) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      await client.join(data.room);
      this.logger.log(`User ${connection.userId} joined room ${data.room}`);
      
      client.emit('room_joined', {
        room: data.room,
        message: `Successfully joined room ${data.room}`,
      });
    } catch (error: any) {
      this.logger.error(`Error joining room ${data.room}:`, error?.message || error);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() data: LeaveRoomData,
    @ConnectedSocket() client: Socket,
  ) {
    const connection = this.connectedClients.get(client.id);
    if (!connection) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      await client.leave(data.room);
      this.logger.log(`User ${connection.userId} left room ${data.room}`);
      
      client.emit('room_left', {
        room: data.room,
        message: `Successfully left room ${data.room}`,
      });
    } catch (error: any) {
      this.logger.error(`Error leaving room ${data.room}:`, error?.message || error);
      client.emit('error', { message: 'Failed to leave room' });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  // Admin/debugging methods
  getConnectedClients() {
    return Array.from(this.connectedClients.values()).map(conn => ({
      socketId: conn.socket.id,
      userId: conn.userId,
    }));
  }

  getClientCount(): number {
    return this.connectedClients.size;
  }
}
