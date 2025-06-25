import connectionConfig from '@/config/connection.config'
import serverConfig from '@/config/server.config'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { LoggerModule } from '../common/logger/logger.module'
import { MemoryCacheService } from './cache/memory-cache.service'
import { ChatModule } from './chats/chat.module'
import { ComplaintModule } from './complaint/complaint.module'
import { LikeModule } from './like/like.module'
import { MatchModule } from './match/match.module'
import { MessagesModule } from './messages/messages.module'
import { MonitoringModule } from './monitoring/monitoring.module'
import { RedisSubscriberService } from './redis-subscriber.service'
import { RedisModule } from './redis/redis.module'
import { MemoryCacheModule } from './cache/memory-cache.module'
import { BotModule } from '../../../bot/src/bot/bot.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
			load: [serverConfig, connectionConfig],
		}),
		ScheduleModule.forRoot(), // Для выполнения периодических задач
		LoggerModule,
		RedisModule,
		MonitoringModule,
		ChatModule,
		MessagesModule,
		MatchModule,
		ComplaintModule,
		LikeModule,
		MemoryCacheModule,
		BotModule,
	],
	providers: [
		RedisSubscriberService, // Сервис для Redis Pub/Sub
	],
})
export class AppModule {}
