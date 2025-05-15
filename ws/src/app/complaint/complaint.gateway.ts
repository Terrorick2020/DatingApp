import {
	WebSocketGateway,
	SubscribeMessage,
	MessageBody,
} from '@nestjs/websockets';
import {
	ComplaintClientMethods,
	SendComplaintTcpPatterns,
	type ComplaintClientToServerEvents,
	type ComplaintServerToClientEvents,
	ComplaintCreateResponse,
	ComplaintUpdateResponse,
} from '@/types/complaint.types';
import { EventPattern, Payload } from '@nestjs/microservices';
import { BaseWsGateway } from '~/src/abstract/abstract.gateway';
import { ComplaintService } from './complaint.service';
import { ComplaintCreateDto } from './dto/complaint-create.dto';
import { ComplaintUpdateDto } from './dto/complaint-update.dto';
import { MemoryCacheService } from '../memory-cache.service';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
	namespace: 'complaints',
	cors: {
		origin: '*',
	},
})
@Injectable()
export class ComplaintGateway extends BaseWsGateway<
	ComplaintService,
	ComplaintClientToServerEvents,
	ComplaintServerToClientEvents
> {
	constructor(
		private readonly complaintService: ComplaintService,
		protected readonly cacheService: MemoryCacheService
	) {
		super(complaintService, cacheService);
	}

	@SubscribeMessage(SendComplaintTcpPatterns.CreateComplaint)
	async handleCreateComplaint(
		@MessageBody() complaintData: ComplaintCreateDto
	): Promise<void> {
		try {
			this.logger.debug(`Обработка создания жалобы от ${complaintData.fromUserId} на ${complaintData.reportedUserId}`);
			
			const response = await this.complaintService.createComplaint(complaintData);
			
			this.server
				.to(complaintData.roomName)
				.emit(ComplaintClientMethods.ComplaintCreated, response);
				
			// Инвалидируем кэш жалоб пользователя
			this.cacheService.delete(`user:${complaintData.fromUserId}:complaints:sent`);
		} catch (error) {
			this.logger.error(`Ошибка при создании жалобы: ${error.message}`, error.stack);
			this.sendToUser(complaintData.telegramId, 'complaintError', {
				message: 'Ошибка при создании жалобы',
				status: 'error',
			});
		}
	}

	@SubscribeMessage(SendComplaintTcpPatterns.UpdateComplaint)
	async handleUpdateComplaint(
		@MessageBody() complaintData: ComplaintUpdateDto
	): Promise<void> {
		try {
			this.logger.debug(`Обработка обновления жалобы #${complaintData.complaintId} со статусом ${complaintData.status}`);
			
			const response = await this.complaintService.updateComplaint(complaintData);
			
			this.server
				.to(complaintData.roomName)
				.emit(ComplaintClientMethods.ComplaintUpdated, response);
				
			// Инвалидируем кэш жалоб
			this.cacheService.delete(`admin:complaints:stats`);
		} catch (error) {
			this.logger.error(`Ошибка при обновлении жалобы: ${error.message}`, error.stack);
			this.sendToUser(complaintData.telegramId, 'complaintError', {
				message: 'Ошибка при обновлении жалобы',
				status: 'error',
			});
		}
	}

	@EventPattern(SendComplaintTcpPatterns.ComplaintStatusChanged)
	async handleComplaintStatusChanged(
		@Payload() statusUpdate: ComplaintUpdateResponse
	): Promise<void> {
		try {
			this.logger.debug(`Получено событие об изменении статуса жалобы #${statusUpdate.id}`);
			
			// Уведомляем все заинтересованные стороны
			this.server.emit(
				ComplaintClientMethods.ComplaintStatusUpdated,
				statusUpdate
			);
		} catch (error) {
			this.logger.error(`Ошибка при обработке изменения статуса жалобы: ${error.message}`, error.stack);
		}
	}
	
	/**
	 * Метод для отправки уведомления об обновлении жалобы пользователю
	 */
	async notifyComplaintUpdate(userId: string, updateData: any): Promise<void> {
		try {
			// Проверяем, онлайн ли пользователь
			if (this.isUserOnline(userId)) {
				// Отправляем уведомление пользователю через его личную комнату
				this.sendToUser(userId, 'complaintUpdate', updateData);
				this.logger.debug(`Отправлено уведомление об обновлении жалобы пользователю ${userId}`);
				
				// Инвалидируем кэш жалоб пользователя
				this.cacheService.delete(`user:${userId}:complaints:sent`);
				this.cacheService.delete(`user:${userId}:complaints:received`);
			} else {
				this.logger.debug(`Пользователь ${userId} оффлайн, уведомление об обновлении жалобы не отправлено`);
			}
		} catch (error) {
			this.logger.error(`Ошибка при отправке уведомления об обновлении жалобы пользователю ${userId}: ${error.message}`, error.stack);
		}
	}
	
	/**
	 * Обработчик запроса на получение всех жалоб пользователя
	 */
	@SubscribeMessage('getUserComplaints')
	async handleGetUserComplaints(
		@MessageBody() data: { userId: string, type: 'sent' | 'received' | 'admin' }
	): Promise<void> {
		try {
			this.logger.debug(`Получение жалоб пользователя ${data.userId} типа ${data.type}`);
			
			// Проверяем кэш
			const cacheKey = `user:${data.userId}:complaints:${data.type}`;
			const cachedComplaints = this.cacheService.get(cacheKey);
			
			if (cachedComplaints) {
				// Если данные в кэше, отправляем их
				this.sendToUser(data.userId, 'userComplaints', {
					type: data.type,
					complaints: cachedComplaints,
				});
			} else {
				// Если нет в кэше, запрашиваем через API
				const complaints = await this.complaintService.getUserComplaints(data.userId, data.type);
				
				// Отправляем результат
				this.sendToUser(data.userId, 'userComplaints', {
					type: data.type,
					complaints,
				});
				
				// Кэшируем результат на 2 минуты
				if (complaints && Array.isArray(complaints)) {
					this.cacheService.set(cacheKey, complaints, 120);
				}
			}
		} catch (error) {
			this.logger.error(`Ошибка при получении жалоб: ${error.message}`, error.stack);
			this.sendToUser(data.userId, 'complaintsError', {
				message: 'Ошибка при получении жалоб',
				status: 'error',
			});
		}
	}
}