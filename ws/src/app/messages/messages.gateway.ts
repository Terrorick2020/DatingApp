import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { BaseWsGateway } from '@/abstract/abstract.geteway';
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto';
import type { MsgsClientToServerEvents, MsgsServerToClientEvents } from '@/types/messages.types';
import type { ResServerConnection } from '@/types/base.types';

@WebSocketGateway(8080, {
  namespace: 'chat',
  cors: {
    origin: '*'
  }
})
export class MessagesGateway extends BaseWsGateway<MsgsClientToServerEvents, MsgsServerToClientEvents> {
  constructor(private readonly msgsService: MessagesService) {
    super();
  }

  protected async joinRoomService(connectionDto: BaseWsConnectionDto): Promise<ResServerConnection> {
    return await this.msgsService.joinRoom(connectionDto);
  }

  protected async leaveRoomService(connectionDto: BaseWsConnectionDto): Promise<ResServerConnection> {
    return await this.msgsService.leaveRoom(connectionDto);
  }

  @SubscribeMessage('')
  async handleUpdateInterlocutor(): Promise<void> {}

  @SubscribeMessage('')
  async handleUpdateMsg(): Promise<void> {}

  @SubscribeMessage('')
  async handleSendMsg(): Promise<void> {}
}
