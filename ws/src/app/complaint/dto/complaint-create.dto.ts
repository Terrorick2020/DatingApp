import { IsString, IsEnum, IsOptional } from 'class-validator'
import { ConnectionDto } from '@/abstract/dto/connection.dto'
import { ComplaintType } from '@/types/complaint.types'

export class ComplaintCreateDto extends ConnectionDto {
	@IsString()
	fromUserId!: string

	@IsString()
	reportedUserId!: string

	@IsEnum(ComplaintType)
	type!: ComplaintType

	@IsString()
	description!: string

	@IsString()
	@IsOptional()
	reportedContentId?: string
}
