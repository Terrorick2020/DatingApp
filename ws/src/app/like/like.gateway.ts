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
	LikeService,
	LikeClientToServerEvents,
	LikeServerToClientEvents
> {
	constructor(private readonly likeService: LikeService) {
		super(likeService)
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
