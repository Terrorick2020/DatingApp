import { IsBoolean, IsNotEmpty } from 'class-validator'
import { ConnectionDto } from '@/abstract/dto/connection.dto'
import type { TrigFromUser } from '@/types/like.types'

export class LikeTriggerDto extends ConnectionDto {
	@IsBoolean()
	isTrigger!: boolean

	@IsNotEmpty()
	fromUser!: TrigFromUser
}
