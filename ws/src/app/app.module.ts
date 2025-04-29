import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ChatModule } from './chats/chat.module'
import { MessagesModule } from './messages/messages.module'
import { MatchModule } from './match/match.module'

import serverConfig from '@/config/server.config'
import connectionConfig from '@/config/connection.config'
import { ComplaintModule } from './complaint/complain.module'
import { RedisModule } from './redis/redis.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
			load: [serverConfig, connectionConfig],
		}),
		ChatModule,
		MessagesModule,
		MatchModule,
		ComplaintModule,
		RedisModule,
	],
})
export class AppModule {}
