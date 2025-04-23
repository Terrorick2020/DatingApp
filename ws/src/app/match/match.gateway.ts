import {
  MatchClientMethods,
  MatchServerMethods,
  type MatchClientToServerEvents,
  type MatchServerToClientEvents,
} from '@/types/match.type';
import { WebSocketGateway } from '@nestjs/websockets';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MatchService } from './match.service';
import { MatchTriggerDto } from './dto/trigger.dto';
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto';
import { BaseWsGateway } from '@/abstract/abstract.geteway';
import type { ResServerConnection, ResErrData } from '@/types/base.types';


@WebSocketGateway()
export class MatchGateway extends BaseWsGateway<MatchClientToServerEvents, MatchServerToClientEvents> {
  constructor(private readonly chatService: MatchService) {
    super();
  }

  protected async joinRoomService(connectionDto: BaseWsConnectionDto): Promise<ResServerConnection | ResErrData> {
    return await this.chatService.joinRoom(connectionDto);
  }

  protected async leaveRoomService(connectionDto: BaseWsConnectionDto): Promise<ResServerConnection | ResErrData> {
    return await this.chatService.leaveRoom(connectionDto);
  }

  @EventPattern(MatchServerMethods.Trigger)
  async handleUpdateChat(@Payload() triggerDto: MatchTriggerDto): Promise<void> {
    this.server.to(triggerDto.roomName).emit(MatchClientMethods.TriggerData, triggerDto)
  }
}
