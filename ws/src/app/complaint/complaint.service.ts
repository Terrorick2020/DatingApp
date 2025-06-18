import { Injectable } from '@nestjs/common'
import { BaseWsService } from '@/abstract/abstract.service'
import { ConfigService } from '@nestjs/config'
import { RedisService } from '../redis/redis.service'
import { ComplaintCreateDto } from './dto/complaint-create.dto'
import { ComplaintUpdateDto } from './dto/complaint-update.dto'
import { SendComplaintTcpPatterns } from '@/types/complaint.types'
import { ConnectionDto } from '@/abstract/dto/connection.dto'
import { ResConnectionDto } from '@/abstract/dto/response.dto'
import { ConnectionStatus } from '~/src/types/base.types'

@Injectable()
export class ComplaintService extends BaseWsService {
	constructor(
		protected readonly configService: ConfigService,
		private readonly redisService: RedisService
	) {
		super(configService)
	}

	/**
	 * Создание жалобы
	 */
	async createComplaint(complaintData: ComplaintCreateDto): Promise<any> {
		try {
			this.logger.debug(
				`Создание жалобы от ${complaintData.fromUserId} на ${complaintData.reportedUserId}`
			)

			// Отправляем запрос на создание жалобы через TCP
			const response = await this.sendRequest(
				SendComplaintTcpPatterns.CreateComplaint,
				complaintData
			)

			// Проверяем ответ
			if (response && (response as any).status === 'error') {
				return {
					status: 'error',
					message: (response as any).message || 'Ошибка при создании жалобы',
				}
			}

			// Публикуем событие в Redis для межсервисной коммуникации
			const eventData = {
				id: (response as any).id || Date.now().toString(),
				fromUserId: complaintData.fromUserId,
				reportedUserId: complaintData.reportedUserId,
				type: complaintData.type,
				status: 'PENDING',
				timestamp: Date.now(),
			}

			await this.redisService.publish(
				'complaint:new',
				JSON.stringify(eventData)
			)

			return (
				response || {
					id: eventData.id,
					status: 'PENDING',
					type: complaintData.type,
					createdAt: Date.now(),
				}
			)
		} catch (error) {
			this.logger.error(
				`Ошибка при создании жалобы: ${error.message}`,
				error.stack
			)
			return {
				status: 'error',
				message: `Ошибка при создании жалобы: ${error.message}`,
			}
		}
	}

	/**
	 * Обновление жалобы
	 */
	async updateComplaint(complaintData: ComplaintUpdateDto): Promise<any> {
		try {
			this.logger.debug(
				`Обновление жалобы #${complaintData.complaintId} со статусом ${complaintData.status}`
			)

			// Отправляем запрос на обновление жалобы через TCP
			const response = await this.sendRequest(
				SendComplaintTcpPatterns.UpdateComplaint,
				complaintData
			)

			// Проверяем ответ
			if (response && (response as any).status === 'error') {
				return {
					status: 'error',
					message: (response as any).message || 'Ошибка при обновлении жалобы',
				}
			}

			// Публикуем событие в Redis для межсервисной коммуникации
			const eventData = {
				id: complaintData.complaintId,
				adminId: complaintData.telegramId,
				status: complaintData.status,
				resolutionNotes: complaintData.resolutionNotes,
				timestamp: Date.now(),
			}

			await this.redisService.publish(
				'complaint:update',
				JSON.stringify(eventData)
			)

			return (
				response || {
					id: complaintData.complaintId,
					status: complaintData.status,
					updatedAt: Date.now(),
				}
			)
		} catch (error) {
			this.logger.error(
				`Ошибка при обновлении жалобы: ${error.message}`,
				error.stack
			)
			return {
				status: 'error',
				message: `Ошибка при обновлении жалобы: ${error.message}`,
			}
		}
	}

	/**
	 * Получение жалоб пользователя
	 */
	async getUserComplaints(
		userId: string,
		type: 'sent' | 'received' | 'admin'
	): Promise<any[]> {
		try {
			this.logger.debug(`Получение жалоб пользователя ${userId} типа ${type}`)

			// Используем API через TCP для получения жалоб
			const response = await this.sendRequest('getUserComplaints', {
				userId,
				type,
			})

			// Проверяем, что ответ не содержит ошибку
			if (response && (response as any).status === 'error') {
				this.logger.warn(
					`Ошибка при получении жалоб пользователя ${userId}: ${
						(response as any).message
					}`
				)
				return []
			}

			// Если ответ содержит успешный результат в формате ApiResponse
			if (response && (response as any).success && (response as any).data) {
				return (response as any).data
			}

			// Если ответ содержит данные как массив напрямую
			if (response && Array.isArray(response)) {
				return response
			}

			// Если ответ не содержит данные в ожидаемом формате
			return []
		} catch (error) {
			this.logger.error(
				`Ошибка при получении жалоб пользователя ${userId}: ${error.message}`,
				error.stack
			)
			return []
		}
	}

	/**
	 * Получение статистики жалоб для администраторов
	 */
	async getComplaintStats(adminId: string): Promise<any> {
		try {
			this.logger.debug(
				`Получение статистики жалоб для администратора ${adminId}`
			)

			// Проверяем, является ли пользователь администратором
			const isAdmin = await this.checkIfAdmin(adminId)

			if (!isAdmin) {
				return {
					status: 'error',
					message: 'Недостаточно прав для просмотра статистики жалоб',
				}
			}

			// Используем API через TCP для получения статистики
			const response = await this.sendRequest('getComplaintStats', { adminId })

			// Проверяем, что ответ не содержит ошибку
			if (response && (response as any).status === 'error') {
				return {
					status: 'error',
					message:
						(response as any).message ||
						'Ошибка при получении статистики жалоб',
				}
			}

			// Возвращаем статистику
			if (response && (response as any).success && (response as any).data) {
				return (response as any).data
			}

			return (
				response || {
					status: 'error',
					message: 'Неизвестная ошибка при получении статистики жалоб',
				}
			)
		} catch (error) {
			this.logger.error(
				`Ошибка при получении статистики жалоб: ${error.message}`,
				error.stack
			)
			return {
				status: 'error',
				message: `Ошибка при получении статистики жалоб: ${error.message}`,
			}
		}
	}

	/**
	 * Проверка, является ли пользователь администратором
	 */
	private async checkIfAdmin(userId: string): Promise<boolean> {
		try {
			// Проверяем роль пользователя через TCP запрос
			const response = await this.sendRequest('checkUserRole', { userId })

			if (response && (response as any).role === 'Admin') {
				return true
			}

			return false
		} catch (error) {
			this.logger.error(
				`Ошибка при проверке роли пользователя ${userId}: ${error.message}`,
				error.stack
			)
			return false
		}
	}

	/**
	 * Обработка подключения к комнате
	 */
	async joinRoom(connectionDto: ConnectionDto): Promise<ResConnectionDto> {
		try {
			this.logger.debug(
				`Пользователь ${connectionDto.telegramId} подключается к комнате ${connectionDto.roomName}`
			)

			// Обновляем статус пользователя
			const userStatusKey = `user:${connectionDto.telegramId}:status`
			await this.redisService.set(userStatusKey, 'online', 3600)

			// Сохраняем комнату пользователя
			const userRoomKey = `user:${connectionDto.telegramId}:room`
			await this.redisService.set(userRoomKey, connectionDto.roomName, 3600)

			return {
				roomName: connectionDto.roomName,
				telegramId: connectionDto.telegramId,
				status: ConnectionStatus.Success,
			}
		} catch (error) {
			this.logger.error(
				`Ошибка при подключении к комнате: ${error.message}`,
				error.stack
			)
			return {
				roomName: connectionDto.roomName,
				telegramId: connectionDto.telegramId,
				message: `Ошибка при подключении к комнате: ${error.message}`,
				status: ConnectionStatus.Error,
			}
		}
	}

	/**
	 * Обработка отключения от комнаты
	 */
	async leaveRoom(connectionDto: ConnectionDto): Promise<ResConnectionDto> {
		try {
			this.logger.debug(
				`Пользователь ${connectionDto.telegramId} покидает комнату ${connectionDto.roomName}`
			)

			// Если пользователь покидает свою личную комнату, обновляем статус на оффлайн
			if (connectionDto.roomName === connectionDto.telegramId) {
				await this.updateUserOfflineStatus(connectionDto.telegramId)
			}

			return {
				roomName: connectionDto.roomName,
				telegramId: connectionDto.telegramId,
				status: ConnectionStatus.Success,
			}
		} catch (error) {
			this.logger.error(
				`Ошибка при отключении от комнаты: ${error.message}`,
				error.stack
			)
			return {
				roomName: connectionDto.roomName,
				telegramId: connectionDto.telegramId,
				message: `Ошибка при отключении от комнаты: ${error.message}`,
				status: ConnectionStatus.Error,
			}
		}
	}

	/**
	 * Обновление статуса пользователя на оффлайн
	 */
	async updateUserOfflineStatus(userId: string): Promise<void> {
		try {
			// Обновляем статус в Redis
			const userStatusKey = `user:${userId}:status`
			await this.redisService.set(userStatusKey, 'offline', 86400)

			// Удаляем привязку к комнате
			const userRoomKey = `user:${userId}:room`
			await this.redisService.del(userRoomKey)

			// Публикуем событие об изменении статуса пользователя
			await this.redisService.publish(
				'user:status',
				JSON.stringify({
					userId,
					status: 'offline',
					timestamp: Date.now(),
				})
			)
		} catch (error) {
			this.logger.error(
				`Ошибка при обновлении статуса пользователя ${userId} на оффлайн: ${error.message}`,
				error.stack
			)
		}
	}
}
