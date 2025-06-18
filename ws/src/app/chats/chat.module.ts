import { Module } from '@nestjs/common'
import { ChatGateway } from './chat.gateway'
import { ChatService } from './chat.service'
import { RedisModule } from '../redis/redis.module'

@Module({
	imports: [RedisModule],
	providers: [ChatGateway, ChatService],
	exports: [ChatService, ChatGateway],
})
export class ChatModule {}
