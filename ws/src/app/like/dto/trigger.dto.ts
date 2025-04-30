import { IsBoolean, IsNotEmpty } from 'class-validator'
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto'
import type { TrigFromUser } from '@/types/like.types'

export class LikeTriggerDto extends BaseWsConnectionDto {
	@IsBoolean()
	isTrigger!: boolean

	@IsNotEmpty()
	fromUser!: TrigFromUser
}
