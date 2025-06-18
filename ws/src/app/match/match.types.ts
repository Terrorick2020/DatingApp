// Интерфейсы для типизации ответов от сервиса
export interface MatchesResponse {
	matches: MatchItem[]
	count: number
	error?: string
}

export interface MatchServiceResponse {
	message?: string
	status?: string
	[key: string]: any
}

export interface MatchItem {
	userId: string
	matchUserId: string
	matchUserName?: string
	matchUserAvatar?: string
	createdAt?: number
	seen?: boolean
	chatId?: string
}

// Type guard для проверки типа ответа
export function isMatchesResponse(obj: any): obj is MatchesResponse {
	return obj && Array.isArray(obj.matches) && typeof obj.count === 'number'
}
