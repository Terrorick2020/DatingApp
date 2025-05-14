import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ChatModule } from './chats/chat.module'
import { MessagesModule } from './messages/messages.module'
import { MatchModule } from './match/match.module'
import { ComplaintModule } from './complaint/complaint.module'
import { RedisModule } from './redis/redis.module'
import { LikeModule } from './like/like.module'
import { ScheduleModule } from '@nestjs/schedule'
import { RedisSubscriberService } from './redis-subscriber.service'
import { MemoryCacheService } from './memory-cache.service'
import { MonitoringModule } from './monitoring/monitoring.module'
import { LoggerModule } from '../common/logger/logger.module'
import serverConfig from '@/config/server.config'
import connectionConfig from '@/config/connection.config'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
			load: [serverConfig, connectionConfig],
		}),
		ScheduleModule.forRoot(), // Для выполнения периодических задач
		LoggerModule, // Модуль для логирования
		RedisModule, // Централизованный модуль Redis
		MonitoringModule, // Добавляем модуль мониторинга
		ChatModule,
		MessagesModule,
		MatchModule,
		ComplaintModule,
		LikeModule,
	],
	providers: [
		RedisSubscriberService, // Сервис для Redis Pub/Sub
		MemoryCacheService, // Сервис для кеширования в памяти
	],
	exports: [MemoryCacheService],
})
export class AppModule {}
