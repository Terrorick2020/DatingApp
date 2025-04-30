import {
	MsgsClientMethods,
	MsgsServerMethods,
	type MsgsClientToServerEvents,
	type MsgsServerToClientEvents,
} from '@/types/messages.types'

import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto'
import { MsgsSendMsgDto } from '@/app/messages/dto/send-msg.dto'
import {
	MsgsUpdateIntrlocDto,
	MsgsUpdateLineStatInterLocDto,
} from '@/app/messages/dto/update-interlocator.dto'
import { MsgsUpdateMsgDto } from '@/app/messages/dto/update-msg.dto'
import type { ResErrData, ResServerConnection } from '@/types/base.types'
import { EventPattern, Payload } from '@nestjs/microservices'
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets'
import { BaseWsGateway } from '~/src/abstract/abstract.gateway'
import { MessagesService } from './messages.service'

@WebSocketGateway(8080, {
	namespace: 'chat',
	cors: {
		origin: '*',
	},
})
export class MessagesGateway extends BaseWsGateway<
	MsgsClientToServerEvents,
	MsgsServerToClientEvents
> {
	constructor(private readonly msgsService: MessagesService) {
		super()
	}

	protected async joinRoomService(
		connectionDto: BaseWsConnectionDto
	): Promise<ResServerConnection | ResErrData> {
		return await this.msgsService.joinRoom(connectionDto)
	}

	protected async leaveRoomService(
		connectionDto: BaseWsConnectionDto
	): Promise<ResServerConnection | ResErrData> {
		return await this.msgsService.leaveRoom(connectionDto)
	}

	@EventPattern(MsgsServerMethods.UpdateLineStat)
	async handleUpdateChat(
		@Payload() updateLineStatInterLocDto: MsgsUpdateLineStatInterLocDto
	): Promise<void> {
		this.server
			.to(updateLineStatInterLocDto.roomName)
			.emit(MsgsClientMethods.UpdateLineStatData, updateLineStatInterLocDto)
	}

	@SubscribeMessage(MsgsServerMethods.UpdateInterlocutor)
	async handleUpdateInterlocutor(
		msgsUpdateIntrlocDto: MsgsUpdateIntrlocDto
	): Promise<void> {
		const response = await this.msgsService.updateInterlocutor(
			msgsUpdateIntrlocDto
		)

		this.server
			.to(msgsUpdateIntrlocDto.roomName)
			.emit(MsgsClientMethods.UpdateInterData, response)
	}

	@SubscribeMessage(MsgsServerMethods.UpdateMsg)
	async handleUpdateMsg(msgsSendMsgDto: MsgsSendMsgDto): Promise<void> {
		const response = await this.msgsService.updateMsg(msgsSendMsgDto)

		this.server
			.to(msgsSendMsgDto.roomName)
			.emit(MsgsClientMethods.UpdateMsgData, response)
	}

	@SubscribeMessage(MsgsServerMethods.SendMsg)
	async handleSendMsg(msgsUpdateMsgDto: MsgsUpdateMsgDto): Promise<void> {
		const response = await this.msgsService.sendMsg(msgsUpdateMsgDto)

		this.server
			.to(msgsUpdateMsgDto.roomName)
			.emit(MsgsClientMethods.SendMsgData, response)
	}
}
