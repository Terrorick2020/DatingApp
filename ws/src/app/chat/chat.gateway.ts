import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import type { ClientToServerListen, Message, ServerToClientListen } from '@/types/chat.types';

@WebSocketGateway(8080, {
  namespace: 'chat',
  cors: {
    origin: '*'
  }
})
export class ChatGateway {
  @WebSocketServer() server: Server<ClientToServerListen, ServerToClientListen>;

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() roomName: string, @ConnectedSocket() client: Socket): void {
    client.join(roomName);

    const message: Message = {
      id: 0,
      socketId: `${client.id} присоединился к комнате ${roomName}`,
      isFrom: false,
    };

    this.server.to(roomName).emit('message', message);
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() { roomName, message }: { roomName: string, message: Message },
    @ConnectedSocket() client: Socket,
  ): void {
    this.server.to(roomName).emit('message', message)
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() roomName: string, @ConnectedSocket() client: Socket): void {
    client.leave(roomName);

    const message: Message = {
      id: 0,
      socketId: `${client.id} присоединился к комнате ${roomName}`,
      isFrom: false,
    };

    this.server.to(roomName).emit('message', message);
  }
}
