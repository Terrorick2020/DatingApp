import {
	MatchClientMethods,
	MatchServerMethods,
	type MatchClientToServerEvents,
	type MatchServerToClientEvents,
} from '@/types/match.type'
import { EventPattern, Payload } from '@nestjs/microservices'
import { WebSocketGateway } from '@nestjs/websockets'
import { BaseWsGateway } from '~/src/abstract/abstract.gateway'
import { MatchTriggerDto } from './dto/trigger.dto'
import { MatchService } from './match.service'

@WebSocketGateway()
export class MatchGateway extends BaseWsGateway<
	MatchService,
	MatchClientToServerEvents,
	MatchServerToClientEvents
> {
	constructor(private readonly matchService: MatchService) {
		super(matchService)
	}

	@EventPattern(MatchServerMethods.Trigger)
	async handleUpdateChat(
		@Payload() triggerDto: MatchTriggerDto
	): Promise<void> {
		this.server
			.to(triggerDto.roomName)
			.emit(MatchClientMethods.TriggerData, triggerDto)
	}
}
