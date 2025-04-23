import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketServer,
} from '@nestjs/websockets';

import {
    WsConnectionStatus,
    WsClientMethods,
    WsServerMethothod,
    type ClientToServerEvents,
    type ServerToClientEvents,
    type ResServerConnection,
} from '@/types/base.types';

import { Server, Socket } from 'socket.io';
import { BaseWsConnectionDto } from './dto/connection.dto';


export abstract class BaseWsGateway<
    TClientToServerEvents extends ClientToServerEvents,
    TServerToClientEvents extends ServerToClientEvents
> {
    @WebSocketServer()
    protected server: Server<TClientToServerEvents, TServerToClientEvents>;

    protected abstract joinRoomService(
        connectionDto: BaseWsConnectionDto,
    ): Promise<ResServerConnection>;

    protected abstract leaveRoomService(
        connectionDto: BaseWsConnectionDto,
    ): Promise<ResServerConnection>;

    @SubscribeMessage(WsServerMethothod.JoinRoom)
    async handleJoinRoom(
        @MessageBody() connectionDto: BaseWsConnectionDto,
        @ConnectedSocket() client: Socket,
    ): Promise<void> {
        const resJoinRoom: ResServerConnection = await this.joinRoomService(connectionDto);

        if (resJoinRoom.status === WsConnectionStatus.Success) {
            client.join(connectionDto.roomName);
        }

        client.emit(WsClientMethods.Connect, resJoinRoom);
    }

    @SubscribeMessage(WsServerMethothod.LeaveRoom)
    async handleLeaveRoom(
        @MessageBody() connectionDto: BaseWsConnectionDto,
        @ConnectedSocket() client: Socket,
    ): Promise<void> {
        const resLeaveRoom: ResServerConnection = await this.leaveRoomService(connectionDto);

        client.leave(connectionDto.roomName);
        client.emit(WsClientMethods.Connect, resLeaveRoom);
    }
}
