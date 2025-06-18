import { Module } from '@nestjs/common'
import { MonitoringService } from './monitoring.service'
import { ScheduleModule } from '@nestjs/schedule'
import { ChatModule } from '../chats/chat.module'
import { MessagesModule } from '../messages/messages.module'
import { LikeModule } from '../like/like.module'
import { ComplaintModule } from '../complaint/complaint.module'
import { MatchModule } from '../match/match.module'
import { RedisModule } from '../redis/redis.module'

@Module({
	imports: [ScheduleModule.forRoot(),
		ChatModule,
		MessagesModule,
		LikeModule,
		ComplaintModule,
		MatchModule,
		RedisModule,
	],
	providers: [MonitoringService],
	exports: [MonitoringService],
})
export class MonitoringModule {}
