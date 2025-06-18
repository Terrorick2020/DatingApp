import { Module } from '@nestjs/common'
import { LikeGateway } from './like.gateway'
import { LikeService } from './like.service'

@Module({
	providers: [LikeGateway, LikeService],
	exports: [LikeService, LikeGateway],
})
export class LikeModule {}
