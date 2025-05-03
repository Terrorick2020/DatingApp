import {
	IsString,
	IsEnum,
	ValidateIf,
	IsOptional,
	IsNumber,
} from 'class-validator'
import { ConnectionDto } from '@/abstract/dto/connection.dto'
import { EWriteType } from '@/types/chat.types'

export class UpdateChatDto extends ConnectionDto {
	@IsString()
	chatId!: string

	@ValidateIf(o => o.newWriteStat === undefined)
	@IsString()
	newLastMsgId?: string 

	@ValidateIf(o => o.newLastMsgId === undefined)
	@IsEnum(EWriteType)
	newWriteStat?: EWriteType

	@IsNumber()
	@IsOptional()
	newUnreadCount?: number
}
