
import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  SubscribeMessage
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { RedisService } from './redis.service';

// Interface Stub until api-auth lib is created
export interface AuthService {
  validateToken(token: string): Promise<{ username: string; id?: string }>;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'events'
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger(RealtimeGateway.name);

  constructor(
    @Inject('AuthService') private authService: AuthService,
    private redisService: RedisService
  ) {
    // Listen to Redis Stream events for multi-instance scaling
    this.redisService.on('system.event', (message) => this.broadcast(message));
  }

  async handleConnection(client: Socket) {
    try {
      // Authenticate handshake
      const token = client.handshake.auth.token;
      // In a real scenario, validate this. For now, guest access if token missing in dev
      const user = token ? await this.authService.validateToken(token) : { username: 'guest' };
      
      // Identify Terminal from Headers (passed by Nginx via handshake headers or query)
      const terminalId = client.handshake.query.terminalId as string;
      const unitId = client.handshake.query.unitId as string;

      // Join Rooms
      client.join(`global`);
      if (unitId) client.join(`unit:${unitId}`);
      if (terminalId) client.join(`terminal:${terminalId}`);
      
      this.logger.log(`Client connected: ${client.id} (User: ${user.username})`);
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Called when Redis Stream receives a message from another API instance
  private broadcast(event: any) {
    const { scope, target, type, payload } = event;

    if (scope === 'GLOBAL') {
      this.server.to('global').emit(type, payload);
    } else if (scope === 'UNIT') {
      this.server.to(`unit:${target}`).emit(type, payload);
    } else if (scope === 'TERMINAL') {
      this.server.to(`terminal:${target}`).emit(type, payload);
    }
  }
}