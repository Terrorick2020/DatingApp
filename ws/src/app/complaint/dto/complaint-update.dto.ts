import { IsString, IsEnum, IsOptional } from 'class-validator'
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto'
import { ComplaintStatus } from '@/types/complaint.types'

export class ComplaintUpdateDto extends BaseWsConnectionDto {
	@IsString()
	complaintId: string

	@IsEnum(ComplaintStatus)
	status: ComplaintStatus

	@IsString()
	@IsOptional()
	resolutionNotes?: string
}
