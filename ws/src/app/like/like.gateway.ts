import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto'
import type { ResErrData, ResServerConnection } from '@/types/base.types'
import {
	LikeClientMethods,
	LikeServerMethods,
	type LikeClientToServerEvents,
	type LikeServerToClientEvents,
} from '@/types/like.types'
import { EventPattern, Payload } from '@nestjs/microservices'
import { WebSocketGateway } from '@nestjs/websockets'
import { BaseWsGateway } from '~/src/abstract/abstract.gateway'
import { LikeTriggerDto } from './dto/trigger.dto'
import { LikeService } from './like.service'

@WebSocketGateway()
export class LikeGateway extends BaseWsGateway<
	LikeClientToServerEvents,
	LikeServerToClientEvents
> {
	constructor(private readonly likeService: LikeService) {
		super()
	}

	protected async joinRoomService(
		connectionDto: BaseWsConnectionDto
	): Promise<ResServerConnection | ResErrData> {
		return await this.likeService.joinRoom(connectionDto)
	}

	protected async leaveRoomService(
		connectionDto: BaseWsConnectionDto
	): Promise<ResServerConnection | ResErrData> {
		return await this.likeService.leaveRoom(connectionDto)
	}

	@EventPattern(LikeServerMethods.Trigger)
	async handleLikeTrigger(
		@Payload() triggerDto: LikeTriggerDto
	): Promise<void> {
		this.server
			.to(triggerDto.roomName)
			.emit(LikeClientMethods.TriggerData, triggerDto)
	}
}
