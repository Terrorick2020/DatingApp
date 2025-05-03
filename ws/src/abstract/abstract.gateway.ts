import {
	ConnectedSocket,
	MessageBody,
	SubscribeMessage,
	WebSocketServer,
} from '@nestjs/websockets'

import {
	ConnectionStatus,
	ClientMethods,
	ServerMethods,
	type ClientToServerEvents,
	type ServerToClientEvents,
} from '@/types/base.types'

import { Server, Socket } from 'socket.io'
import { ConnectionDto } from './dto/connection.dto'
import { ResConnectionDto } from './dto/response.dto'
import { BaseWsService } from './abstract.service'

export abstract class BaseWsGateway<
    TService extends BaseWsService,
	TClientToServerEvents extends ClientToServerEvents,
	TServerToClientEvents extends ServerToClientEvents,
> {
    constructor(private readonly service: TService) {}

	@WebSocketServer()
	protected server: Server<TClientToServerEvents, TServerToClientEvents>
    
	@SubscribeMessage(ServerMethods.JoinRoom)
	async handleJoinRoom(
		@MessageBody() connectionDto: ConnectionDto,
		@ConnectedSocket() client: Socket
	): Promise<void> {
		const resJoinRoom: ResConnectionDto =
			await this.service.joinRoom(connectionDto)

		if (resJoinRoom.status === ConnectionStatus.Success) {
			client.join(connectionDto.roomName)
		}

		client.emit(ClientMethods.Connection, resJoinRoom)
	}

	@SubscribeMessage(ServerMethods.LeaveRoom)
	async handleLeaveRoom(
		@MessageBody() connectionDto: ConnectionDto,
		@ConnectedSocket() client: Socket
	): Promise<void> {
		const resLeaveRoom: ResConnectionDto =
			await this.service.leaveRoom(connectionDto)

		client.leave(connectionDto.roomName)
		client.emit(ClientMethods.Connection, resLeaveRoom)
	}
}
