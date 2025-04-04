import { Module } from '@nestjs/common';
import { LikesGateway } from './likes.gateway';
import { LikesService } from './likes.service';

@Module({
  providers: [LikesGateway, LikesService]
})
export class LikesModule {}
