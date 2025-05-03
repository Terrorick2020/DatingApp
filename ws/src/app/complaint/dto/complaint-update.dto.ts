import { IsString, IsEnum, IsOptional } from 'class-validator'
import { ConnectionDto } from '@/abstract/dto/connection.dto'
import { ComplaintStatus } from '@/types/complaint.types'

export class ComplaintUpdateDto extends ConnectionDto {
	@IsString()
	complaintId: string

	@IsEnum(ComplaintStatus)
	status: ComplaintStatus

	@IsString()
	@IsOptional()
	resolutionNotes?: string
}
