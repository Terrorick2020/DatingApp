import { Module } from '@nestjs/common';
import { ChatModule } from './chats/chat.module';
import { LikesModule } from './likes/likes.module';

@Module({
  imports: [ChatModule, LikesModule],
})
export class AppModule {};
