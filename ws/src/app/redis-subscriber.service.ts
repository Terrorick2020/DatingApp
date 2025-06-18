import {
	Injectable,
	OnModuleInit,
	OnModuleDestroy,
	Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { ChatGateway } from './chats/chat.gateway'
import { MessagesGateway } from './messages/messages.gateway'
import { LikeGateway } from './like/like.gateway'
import { ComplaintGateway } from './complaint/complaint.gateway'
import { MatchGateway } from './match/match.gateway'

@Injectable()
export class RedisSubscriberService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(RedisSubscriberService.name)
	private subscriber: Redis
	private readonly channels = [
		'chat:newMessage',
		'chat:messageRead',
		'chat:typing',
		'chat:update',
		'user:status',
		'like:new',
		'match:new',
		'complaint:update',
	]

	constructor(
		private readonly configService: ConfigService,
		private readonly chatGateway: ChatGateway,
		private readonly messagesGateway: MessagesGateway,
		private readonly likeGateway: LikeGateway,
		private readonly complaintGateway: ComplaintGateway,
		private readonly matchGateway: MatchGateway
	) {
		this.subscriber = new Redis({
			host: this.configService.get('REDIS_HOST', 'localhost'),
			port: Number(this.configService.get('REDIS_PORT', 6379)),
			password: this.configService.get('REDIS_PASSWORD', ''),
			db: Number(this.configService.get('REDIS_DB', 0)),
		})
	}

	async onModuleInit() {
		try {
			// Подписываемся на все каналы
			await this.subscriber.subscribe(...this.channels)

			// Настраиваем обработчик сообщений
			this.subscriber.on('message', (channel, message) => {
				try {
					const data = JSON.parse(message)
					this.handleRedisMessage(channel, data)
				} catch (error) {
					this.logger.error(
						`Error processing Redis message: ${error.message}`,
						error.stack
					)
				}
			})

			this.logger.log('Redis Pub/Sub subscriptions initialized')
		} catch (error) {
			this.logger.error(
				`Failed to initialize Redis Pub/Sub: ${error.message}`,
				error.stack
			)
		}
	}

	async onModuleDestroy() {
		try {
			await this.subscriber.unsubscribe(...this.channels)
			await this.subscriber.quit()
			this.logger.log('Redis Pub/Sub connections closed')
		} catch (error) {
			this.logger.error(
				`Error closing Redis Pub/Sub connections: ${error.message}`
			)
		}
	}

	private handleRedisMessage(channel: string, data: any) {
		this.logger.debug(`Received message on channel ${channel}`)

		switch (channel) {
			case 'chat:newMessage':
				this.handleNewMessage(data)
				break
			case 'chat:messageRead':
				this.handleGetReadedMsgs(data)
				break
			case 'chat:typing':
				this.handleGetInterlocTyping(data)
				break
			case 'chat:update':
				this.handleChatUpdate(data)
				break
			case 'user:status':
				this.handleUserStatusChange(data)
				break
			case 'like:new':
				this.handleNewLike(data)
				break
			case 'match:new':
				this.handleNewMatch(data)
				break
			case 'complaint:update':
				this.handleComplaintUpdate(data)
				break
			default:
				this.logger.warn(`Unknown Redis channel: ${channel}`)
		}
	}

	private handleNewMessage(data: any) {
		const { chatId, recipientId } = data

		// Проверяем, есть ли получатель онлайн
		if (recipientId) {
			this.messagesGateway.sendDirectMessageNotification(recipientId, data)
		}
	}

	private handleGetInterlocTyping(data: any) {
		const { chatId, participants, userId, isTyping } = data;

		if(participants.length) {
			this.messagesGateway.sendDirectTypingStatus(participants, userId, isTyping)
		}
	}

	private handleGetReadedMsgs(data: {
		chatId: string,
		userId: string,
		messageIds: string[],
		timestamp: number
	}) {
		const { userId, messageIds, chatId } = data

		if(messageIds.length) {
			this.messagesGateway.updateReadedMsgs(userId, messageIds, chatId)
		}
	}

	private handleChatUpdate(data: any) {
		const { chatId, participants, type, updateData } = data

		if (Array.isArray(participants)) {
			for (const userId of participants) {
				this.chatGateway.sendChatUpdate(userId, {
					chatId,
					type,
					data: updateData,
				})
			}
		}
	}

	private handleUserStatusChange(data: any) {
		const { userId, status, timestamp } = data

		// Находим всех, кто должен получить уведомление о статусе
		if (data.notifyUsers && Array.isArray(data.notifyUsers)) {
			for (const recipientId of data.notifyUsers) {
				this.chatGateway.sendUserStatusUpdate(recipientId, {
					userId,
					status,
					timestamp,
				})
			}
		}
	}

	private handleNewLike(data: any) {
		const { toUserId } = data

		if (toUserId) {
			this.likeGateway.notifyUserAboutLike(toUserId, data)
		}
	}

	private handleNewMatch(data: any) {
		const { user1Id, user2Id } = data

		if (user1Id) this.matchGateway.notifyUserAboutMatch(user1Id, data)
		if (user2Id) this.matchGateway.notifyUserAboutMatch(user2Id, data)
	}

	private handleComplaintUpdate(data: any) {
		const { complainantId, status, complaintId } = data

		if (complainantId) {
			this.complaintGateway.notifyComplaintUpdate(complainantId, {
				complaintId,
				status,
				timestamp: Date.now(),
			})
		}
	}
}
