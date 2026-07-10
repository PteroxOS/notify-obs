import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../config/env.validation';

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly configService: ConfigService<EnvConfig>) {}

  handleConnection(client: Socket) {
    const streamKey = client.handshake.query.streamKey as string;
    const expectedStreamKey = this.configService.get('STREAM_KEY', { infer: true });

    if (streamKey !== expectedStreamKey) {
      this.logger.warn(`Client rejected: Invalid streamKey (${client.id})`);
      client.emit('error', 'Invalid stream key');
      client.disconnect(true);
      return;
    }

    this.logger.log(`Client connected: ${client.id}`);
    client.join('overlay:default');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitDonation(payload: any) {
    this.server.to('overlay:default').emit('donation', payload);
    this.logger.log(`Emitted donation to overlay:default`, payload);
  }
}
