import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { BaseWsGateway } from '@/abstract/abstract.geteway';
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto';
import { MsgsServerMethods, MsgsClientMethods } from '@/types/messages.types';
import { MsgsUpdateIntrlocDto } from '@/app/messages/dto/update-interlocator.dto';
import { MsgsSendMsgDto } from '@/app/messages/dto/send-msg.dto';
import { MsgsUpdateMsgDto } from '@/app/messages/dto/update-msg.dto';
import type { MsgsClientToServerEvents, MsgsServerToClientEvents } from '@/types/messages.types';
import type { ResServerConnection, ResErrData } from '@/types/base.types';

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

  protected async joinRoomService(connectionDto: BaseWsConnectionDto): Promise<ResServerConnection | ResErrData> {
    return await this.msgsService.joinRoom(connectionDto);
  }

  protected async leaveRoomService(connectionDto: BaseWsConnectionDto): Promise<ResServerConnection | ResErrData> {
    return await this.msgsService.leaveRoom(connectionDto);
  }

  @SubscribeMessage(MsgsServerMethods.UpdateInterlocutor)
  async handleUpdateInterlocutor(msgsUpdateIntrlocDto: MsgsUpdateIntrlocDto): Promise<void> {
    const response = await this.msgsService.updateInterlocutor(msgsUpdateIntrlocDto);

    this.server.to(msgsUpdateIntrlocDto.roomName).emit(MsgsClientMethods.UpdateInterData, response);
  }

  @SubscribeMessage(MsgsServerMethods.UpdateMsg)
  async handleUpdateMsg(msgsSendMsgDto: MsgsSendMsgDto): Promise<void> {
    const response = await this.msgsService.updateMsg(msgsSendMsgDto);

    this.server.to(msgsSendMsgDto.roomName).emit(MsgsClientMethods.UpdateMsgData, response);
  }

  @SubscribeMessage(MsgsServerMethods.SendMsg)
  async handleSendMsg(msgsUpdateMsgDto: MsgsUpdateMsgDto): Promise<void> {
    const response = await this.msgsService.sendMsg(msgsUpdateMsgDto);

    this.server.to(msgsUpdateMsgDto.roomName).emit(MsgsClientMethods.SendMsgData, response);
  }
}
