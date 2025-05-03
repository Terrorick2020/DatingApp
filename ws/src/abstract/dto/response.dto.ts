import { IsString, IsOptional, IsEnum } from 'class-validator'
import { ConnectionDto } from './connection.dto'
import { ConnectionStatus } from '@/types/base.types'

export class ResConnectionDto extends ConnectionDto {
	@IsString()
	@IsOptional()
	message?: string

	@IsEnum(ConnectionStatus)
	status!: ConnectionStatus
}
