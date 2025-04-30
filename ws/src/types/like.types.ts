import { ClientToServerEvents, ServerToClientEvents } from './base.types'
import { MatchTriggerDto } from '@/app/like/dto/trigger.dto'
import { MatchClientMethods } from './match.type'

export enum LikeClientMethods {
	MatchData = 'MatchData',
}

export interface LikeClientToServerEvents extends ClientToServerEvents {}

export interface LikeServerToClientEvents extends ServerToClientEvents {
	[MatchClientMethods.TriggerData]: (
		triggerDto: MatchTriggerDto
	) => Promise<void>
}
