// match.dto.ts

import {
	IsString,
	IsOptional,
	IsArray,
	IsBoolean,
	IsNumber,
	ValidateNested,
} from 'class-validator'

import { ConnectionDto } from '@/abstract/dto/connection.dto'

// DTO для элемента матча
export class MatchItemDto {
	@IsString()
	userId!: string

	@IsString()
	matchUserId!: string

	@IsString()
	@IsOptional()
	matchUserName?: string

	@IsString()
	@IsOptional()
	matchUserAvatar?: string

	@IsNumber()
	@IsOptional()
	createdAt?: number

	@IsBoolean()
	@IsOptional()
	seen?: boolean

	@IsString()
	@IsOptional()
	chatId?: string
}

// DTO для запроса получения матчей пользователя
export class GetUserMatchesDto extends ConnectionDto {
	// Телеграм ID пользователя уже есть в ConnectionDto
}

// DTO для ответа со списком матчей
export class MatchesResponseDto {
	@IsArray()
	@ValidateNested({ each: true })
	matches!: MatchItemDto[]

	@IsNumber()
	count!: number

	@IsString()
	@IsOptional()
	error?: string

	@IsString()
	@IsOptional()
	message?: string

	@IsString()
	@IsOptional()
	status?: string
}

// DTO для запроса на удаление матча
export class RemoveMatchDto extends ConnectionDto {
	@IsString()
	matchUserId!: string
}

// DTO для ответа на удаление матча
export class RemoveMatchResponseDto {
	@IsBoolean()
	success!: boolean

	@IsString()
	@IsOptional()
	message?: string

	@IsString()
	@IsOptional()
	status?: string

	@IsString()
	@IsOptional()
	otherUserId?: string
}

// DTO для подтверждения просмотра матча
export class ConfirmMatchNotificationDto extends ConnectionDto {
	@IsString()
	matchUserId!: string
}

// DTO для триггера матча (наследуется от ConnectionDto)
export class MatchTriggerDto extends ConnectionDto {
	@IsBoolean()
	isTrigger!: boolean

	@ValidateNested()
	fromUser!: MatchFromUserDto
}

// DTO для информации о пользователе в триггере матча
export class MatchFromUserDto {
	@IsString()
	id!: string

	@IsString()
	avatar!: string

	@IsString()
	name!: string
}

// Универсальный DTO для ответов от сервиса
export class MatchServiceResponseDto {
	@IsString()
	@IsOptional()
	message?: string

	@IsString()
	@IsOptional()
	status?: string
}

// DTO для непросмотренных матчей
export class UnseenMatchesResponseDto {
	@IsArray()
	@ValidateNested({ each: true })
	matches!: MatchItemDto[]

	@IsNumber()
	count!: number

	@IsString()
	@IsOptional()
	error?: string
}
